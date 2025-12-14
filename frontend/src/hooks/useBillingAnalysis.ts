import { useState, useCallback, useRef, useMemo } from 'react';
import { BillingItem, BillingAnalysisResult } from '../utils/billingAnalysis';

// CPT code validation regex from medical billing rules
const CPT_CODE_REGEX = /^[0-9]{5}(-[A-Z0-9]{2})?$/;

/**
 * Error types for billing analysis operations
 */
export enum BillingAnalysisErrorType {
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  API = 'API',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Structured error interface for billing analysis
 */
export interface BillingAnalysisError {
  type: BillingAnalysisErrorType;
  message: string;
  details?: unknown;
  retryable: boolean;
}

/**
 * Loading states for granular UI feedback
 */
export interface BillingAnalysisLoadingState {
  isAnalyzing: boolean;
  isRetrying: boolean;
  currentItem?: string; // CPT code being processed
  progress: number; // 0-100
}

/**
 * Cache entry structure for billing analysis results
 */
interface CacheEntry {
  result: BillingAnalysisResult;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

/**
 * Cache key generator for deterministic caching
 */
const generateCacheKey = (cptCode: string, billedAmount: number): string => {
  return `${cptCode}-${billedAmount.toFixed(2)}`;
};

/**
 * Custom hook for medical billing analysis with caching and retry functionality
 *
 * This hook handles the complete billing analysis workflow including:
 * - API calls to MCP endpoints for CPT lookup and Medicare rate calculation
 * - Caching to avoid duplicate requests
 * - Request deduplication for concurrent identical requests
 * - Automatic retry with exponential backoff
 * - HIPAA-compliant error handling and logging
 *
 * @returns Object containing analysis function, state, and utility methods
 *
 * @example
 * ```typescript
 * const {
 *   analyzeBilling,
 *   retry,
 *   isAnalyzing,
 *   error,
 *   results
 * } = useBillingAnalysis();
 *
 * // Analyze billing items
 * const handleAnalyze = async (items: BillingItem[]) => {
 *   const results = await analyzeBilling(items);
 *   console.log('Analysis complete:', results);
 * };
 *
 * // Retry on error
 * const handleRetry = () => {
 *   retry();
 * };
 * ```
 */
export const useBillingAnalysis = () => {
  // State management
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<BillingAnalysisError | null>(null);
  const [results, setResults] = useState<BillingAnalysisResult[]>([]);
  const [loadingState, setLoadingState] = useState<BillingAnalysisLoadingState>({
    isAnalyzing: false,
    isRetrying: false,
    progress: 0
  });

  // Cache for results (simple Map-based cache)
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes TTL

  // Request deduplication - track in-flight requests
  const inFlightRequestsRef = useRef<Map<string, Promise<BillingAnalysisResult>>>(new Map());

  // Retry configuration
  const RETRY_CONFIG = useMemo(() => ({
    maxAttempts: 3,
    baseDelay: 1000, // 1 second
    backoffMultiplier: 2
  }), []);

  /**
   * Creates a structured error object
   */
  const createError = useCallback((
    type: BillingAnalysisErrorType,
    message: string,
    details?: unknown,
    retryable: boolean = true
  ): BillingAnalysisError => ({
    type,
    message,
    details,
    retryable
  }), []);

  /**
   * Validates billing items according to medical billing rules
   */
  const validateBillingItems = useCallback((items: BillingItem[]): BillingAnalysisError | null => {
    if (!Array.isArray(items) || items.length === 0) {
      return createError(
        BillingAnalysisErrorType.VALIDATION,
        'Items array must be non-empty',
        undefined,
        false
      );
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (!item.cptCode || typeof item.cptCode !== 'string') {
        return createError(
          BillingAnalysisErrorType.VALIDATION,
          `Invalid CPT code at index ${i}: ${item.cptCode}`,
          { index: i, cptCode: item.cptCode },
          false
        );
      }

      if (!CPT_CODE_REGEX.test(item.cptCode)) {
        return createError(
          BillingAnalysisErrorType.VALIDATION,
          `CPT code ${item.cptCode} does not match required format ^[0-9]{5}(-[A-Z0-9]{2})?$`,
          { index: i, cptCode: item.cptCode },
          false
        );
      }

      if (typeof item.billedAmount !== 'number' || item.billedAmount < 0) {
        return createError(
          BillingAnalysisErrorType.VALIDATION,
          `Invalid billed amount at index ${i}: ${item.billedAmount}`,
          { index: i, billedAmount: item.billedAmount },
          false
        );
      }
    }

    return null;
  }, [createError]);

  /**
   * Checks cache for existing result
   */
  const getCachedResult = useCallback((cptCode: string, billedAmount: number): BillingAnalysisResult | null => {
    const key = generateCacheKey(cptCode, billedAmount);
    const entry = cacheRef.current.get(key);

    if (!entry) return null;

    // Check if cache entry is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      cacheRef.current.delete(key);
      return null;
    }

    return entry.result;
  }, []);

  /**
   * Stores result in cache
   */
  const setCachedResult = useCallback((result: BillingAnalysisResult): void => {
    const key = generateCacheKey(result.cptCode, result.billedAmount);
    cacheRef.current.set(key, {
      result,
      timestamp: Date.now(),
      ttl: CACHE_TTL
    });
  }, []);

  /**
   * Fetches CPT code description from MCP API
   */
  const fetchCptDescription = useCallback(async (cptCode: string): Promise<string> => {
    try {
      const response = await fetch('/api/mcp/claimguardian/lookup_cpt_code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ procedure: cptCode }),
      });

      if (!response.ok) {
        throw new Error(`CPT lookup failed: ${response.status}`);
      }

      const data = await response.json();
      return data.description || `Procedure ${cptCode}`;
    } catch (error) {
      // HIPAA compliant fallback - no sensitive data in logs
      // Log error in development only (HIPAA-compliant - no full CPT codes)
      if (process.env.NODE_ENV === 'development') {
        console.error(`CPT lookup error for code ${cptCode.substring(0, 3)}XXX`);
      }
      return `Procedure ${cptCode}`;
    }
  }, []);

  /**
   * Fetches Medicare rate from MCP API
   */
  const fetchMedicareRate = useCallback(async (cptCode: string): Promise<number> => {
    const response = await fetch('/api/mcp/claimguardian/calculate_medicare_rate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ procedure: cptCode }),
    });

    if (!response.ok) {
      throw new Error(`Medicare rate lookup failed: ${response.status}`);
    }

    const data = await response.json();

    if (typeof data.rate !== 'number' || data.rate < 0) {
      throw new Error(`Invalid Medicare rate received: ${data.rate}`);
    }

    return data.rate;
  }, []);

  /**
   * Processes a single billing item with caching and deduplication
   */
  const processBillingItem = useCallback(async (
    item: BillingItem,
    onProgress?: (cptCode: string, progress: number) => void
  ): Promise<BillingAnalysisResult> => {
    const cacheKey = generateCacheKey(item.cptCode, item.billedAmount);

    // Check cache first
    const cached = getCachedResult(item.cptCode, item.billedAmount);
    if (cached) {
      onProgress?.(item.cptCode, 100);
      return cached;
    }

    // Check for in-flight request (deduplication)
    const inFlight = inFlightRequestsRef.current.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }

    // Create new request
    const request = (async () => {
      try {
        onProgress?.(item.cptCode, 10);

        // Fetch description and Medicare rate in parallel
        const [description, medicareRate] = await Promise.all([
          fetchCptDescription(item.cptCode),
          fetchMedicareRate(item.cptCode)
        ]);

        onProgress?.(item.cptCode, 80);

        // Calculate overcharge
        const overchargePercentage = ((item.billedAmount - medicareRate) / medicareRate) * 100;
        const isHighPriority = overchargePercentage > 20;

        const result: BillingAnalysisResult = {
          ...item,
          medicareRate,
          overchargePercentage,
          isHighPriority
        };

        // Cache the result
        setCachedResult(result);

        onProgress?.(item.cptCode, 100);

        return result;
      } finally {
        // Clean up in-flight request tracking
        inFlightRequestsRef.current.delete(cacheKey);
      }
    })();

    // Track in-flight request
    inFlightRequestsRef.current.set(cacheKey, request);

    return request;
  }, [getCachedResult, setCachedResult, fetchCptDescription, fetchMedicareRate]);

  /**
   * Implements retry logic with exponential backoff
   */
  const retryWithBackoff = useCallback(async <T>(
    operation: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= RETRY_CONFIG.maxAttempts) {
        throw error;
      }

      const delay = RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));

      return retryWithBackoff(operation, attempt + 1);
    }
  }, [RETRY_CONFIG]);

  /**
   * Main analysis function with retry support
   */
  const analyzeBilling = useCallback(async (
    items: BillingItem[],
    options: { enableRetry?: boolean } = {}
  ): Promise<BillingAnalysisResult[]> => {
    const { enableRetry = true } = options;

    // Validate input
    const validationError = validateBillingItems(items);
    if (validationError) {
      setError(validationError);
      throw validationError;
    }

    setIsAnalyzing(true);
    setError(null);
    setResults([]);
    setLoadingState(prev => ({ ...prev, isAnalyzing: true, progress: 0 }));

    try {
      const operation = async (): Promise<BillingAnalysisResult[]> => {
        const processedResults: BillingAnalysisResult[] = [];
        let completedCount = 0;

        const progressCallback = (cptCode: string, itemProgress: number) => {
          setLoadingState(prev => ({
            ...prev,
            currentItem: cptCode,
            progress: ((completedCount + itemProgress / 100) / items.length) * 100
          }));
        };

        // Process items with progress tracking
        for (const item of items) {
          const result = await processBillingItem(item, progressCallback);
          processedResults.push(result);
          completedCount++;

          setLoadingState(prev => ({
            ...prev,
            progress: (completedCount / items.length) * 100
          }));
        }

        // Sort by overcharge percentage (highest first)
        const sortedResults = processedResults.sort((a, b) => b.overchargePercentage - a.overchargePercentage);

        setResults(sortedResults);
        setLoadingState(prev => ({ ...prev, isAnalyzing: false, progress: 100 }));

        return sortedResults;
      };

      if (enableRetry) {
        return await retryWithBackoff(operation);
      } else {
        return await operation();
      }

    } catch (error) {
      const billingError = error instanceof Error
        ? createError(
            BillingAnalysisErrorType.API,
            `Analysis failed: ${error.message}`,
            error
          )
        : createError(
            BillingAnalysisErrorType.UNKNOWN,
            'An unknown error occurred during analysis'
          );

      setError(billingError);
      setLoadingState(prev => ({ ...prev, isAnalyzing: false, progress: 0 }));

      throw billingError;
    } finally {
      setIsAnalyzing(false);
      setLoadingState(prev => ({ ...prev, isAnalyzing: false }));
    }
  }, [validateBillingItems, processBillingItem, retryWithBackoff, createError]);

  /**
   * Retry the last failed analysis
   */
  const retry = useCallback(async (): Promise<BillingAnalysisResult[]> => {
    if (!error?.retryable) {
      throw new Error('Cannot retry - operation is not retryable');
    }

    setIsRetrying(true);
    setError(null);
    setLoadingState(prev => ({ ...prev, isRetrying: true }));

    try {
      // Note: In a real implementation, we'd store the last items
      // For now, this is a placeholder that would need the last items passed
      throw new Error('Retry not implemented - need last billing items');
    } catch (retryError) {
      const billingError = retryError instanceof Error
        ? createError(
            BillingAnalysisErrorType.API,
            `Retry failed: ${retryError.message}`,
            retryError
          )
        : createError(
            BillingAnalysisErrorType.UNKNOWN,
            'Retry failed with unknown error'
          );

      setError(billingError);
      throw billingError;
    } finally {
      setIsRetrying(false);
      setLoadingState(prev => ({ ...prev, isRetrying: false }));
    }
  }, [error, createError]);

  /**
   * Clears the analysis cache
   */
  const clearCache = useCallback((): void => {
    cacheRef.current.clear();
    inFlightRequestsRef.current.clear();
  }, []);

  /**
   * Clears current results and error state
   */
  const clearResults = useCallback((): void => {
    setResults([]);
    setError(null);
    setLoadingState({
      isAnalyzing: false,
      isRetrying: false,
      progress: 0
    });
  }, []);

  return {
    // Main functions
    analyzeBilling,
    retry,

    // State
    isAnalyzing,
    isRetrying,
    error,
    results,
    loadingState,

    // Utilities
    clearCache,
    clearResults
  };
};

export default useBillingAnalysis;
