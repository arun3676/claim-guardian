import { useState, useCallback } from 'react';

export interface KestraExecutionRequest {
  workflowId: string;
  namespace?: string;
  inputs?: Record<string, any>;
  labels?: Record<string, string>;
}

export interface KestraExecution {
  id: string;
  namespace: string;
  flowId: string;
  state: {
    current: 'CREATED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'KILLED' | 'WARNING';
  };
  startDate?: string;
  endDate?: string;
  duration?: number;
}

export interface KestraExecutionResult {
  execution: KestraExecution;
  outputs?: Record<string, any>;
  tasks?: Array<{
    id: string;
    state: { current: string };
    outputs?: Record<string, any>;
  }>;
}

export interface UseKestraExecutionReturn {
  execute: (request: KestraExecutionRequest) => Promise<void>;
  checkStatus: (executionId: string) => Promise<void>;
  getResults: (executionId: string) => Promise<void>;
  execution: KestraExecution | null;
  results: KestraExecutionResult | null;
  isLoading: boolean;
  error: string | null;
  pollUntilComplete: (executionId: string, options?: PollOptions) => Promise<void>;
}

export interface PollOptions {
  interval?: number; // Polling interval in ms (default: 2000)
  maxAttempts?: number; // Maximum polling attempts (default: 60)
  onProgress?: (execution: KestraExecution) => void;
}

/**
 * React hook for executing and monitoring Kestra workflows
 * 
 * @example
 * ```tsx
 * const { execute, execution, isLoading, error } = useKestraExecution();
 * 
 * const handleAnalyze = async () => {
 *   await execute({
 *     workflowId: 'claimguardian-ai-agent-summarizer',
 *     inputs: { bill_data: {...} }
 *   });
 * };
 * ```
 */
export function useKestraExecution(): UseKestraExecutionReturn {
  const [execution, setExecution] = useState<KestraExecution | null>(null);
  const [results, setResults] = useState<KestraExecutionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Execute a Kestra workflow
   */
  const execute = useCallback(async (request: KestraExecutionRequest) => {
    setIsLoading(true);
    setError(null);
    setExecution(null);
    setResults(null);

    try {
      const response = await fetch('/api/kestra/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setExecution(data.execution);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute workflow';
      setError(errorMessage);
      console.error('Kestra execution error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Check execution status
   */
  const checkStatus = useCallback(async (executionId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/kestra/status/${executionId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setExecution(data.execution);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check status';
      setError(errorMessage);
      console.error('Kestra status check error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get execution results
   */
  const getResults = useCallback(async (executionId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/kestra/results/${executionId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResults({
        execution: data.execution,
        outputs: data.outputs,
        tasks: data.tasks,
      });
      setExecution(data.execution);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get results';
      setError(errorMessage);
      console.error('Kestra results error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Poll execution until completion
   */
  const pollUntilComplete = useCallback(
    async (executionId: string, options: PollOptions = {}) => {
      const interval = options.interval || 2000;
      const maxAttempts = options.maxAttempts || 60;
      let attempts = 0;

      while (attempts < maxAttempts) {
        try {
          await checkStatus(executionId);

          if (execution) {
            const currentState = execution.state?.current;

            if (options.onProgress) {
              options.onProgress(execution);
            }

            if (
              currentState === 'SUCCESS' ||
              currentState === 'FAILED' ||
              currentState === 'KILLED' ||
              currentState === 'WARNING'
            ) {
              // Execution completed, get results
              await getResults(executionId);
              return;
            }
          }

          // Wait before next poll
          await new Promise((resolve) => setTimeout(resolve, interval));
          attempts++;
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Polling error');
          return;
        }
      }

      // Timeout
      setError(`Execution ${executionId} did not complete within ${maxAttempts * interval}ms`);
    },
    [execution, checkStatus, getResults]
  );

  return {
    execute,
    checkStatus,
    getResults,
    execution,
    results,
    isLoading,
    error,
    pollUntilComplete,
  };
}

