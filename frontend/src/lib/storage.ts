/**
 * Vercel KV Storage Integration
 * 
 * This module provides persistent storage for analysis history and sessions
 * using Vercel KV (Redis-compatible key-value store).
 * 
 * VERCEL INTEGRATION:
 * - Uses Vercel KV for serverless, low-latency storage
 * - Stores analysis history per session
 * - Enables "Recent Analyses" dashboard feature
 * - Persists results from Kestra/Oumi/MCP operations
 * 
 * Why KV over Postgres?
 * - Simpler schema for key-value access patterns
 * - Lower latency for frequent reads
 * - No schema migrations needed
 * - Perfect for session-based data
 * 
 * @module storage
 */

import { kv } from '@vercel/kv';

/**
 * Analysis record stored in KV
 */
export interface AnalysisRecord {
  /** Unique analysis ID */
  id: string;
  /** Session ID (user session) */
  sessionId: string;
  /** Timestamp of analysis */
  timestamp: string;
  /** Source of analysis (kestra, oumi, mcp) */
  source: 'kestra' | 'oumi' | 'mcp' | 'ai_chat';
  /** Type of analysis performed */
  analysisType: 'summary' | 'appeal' | 'risk' | 'billing_errors' | 'full';
  /** Blob URL if file was uploaded */
  blobUrl?: string;
  /** Original filename */
  fileName?: string;
  /** Analysis summary text */
  summary?: string;
  /** Risk score (0-100) */
  riskScore?: number;
  /** Risk level */
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  /** Detected billing errors */
  errorsFound?: number;
  /** Potential savings amount */
  potentialSavings?: number;
  /** Flags/warnings from analysis */
  flags?: string[];
  /** Full analysis result (JSON) */
  fullResult?: Record<string, any>;
  /** Status of the analysis */
  status: 'pending' | 'completed' | 'failed';
  /** Error message if failed */
  errorMessage?: string;
  /** Workflow execution ID (for Kestra) */
  workflowExecutionId?: string;
}

/**
 * Session metadata stored in KV
 */
export interface SessionData {
  /** Session ID */
  id: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last activity timestamp */
  lastActiveAt: string;
  /** Number of analyses performed */
  analysisCount: number;
  /** Total potential savings identified */
  totalSavings: number;
}

// KV key prefixes
const ANALYSIS_PREFIX = 'analysis:';
const SESSION_PREFIX = 'session:';
const SESSION_ANALYSES_PREFIX = 'session_analyses:';

/**
 * Generate a unique ID for an analysis
 */
export function generateAnalysisId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}

/**
 * Generate a session ID (or use from cookie)
 */
export function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 12);
  return `sess_${timestamp}_${random}`;
}

/**
 * Save an analysis record to KV storage
 * 
 * @param record - The analysis record to save
 * @returns The saved record with ID
 */
export async function saveAnalysis(
  record: Omit<AnalysisRecord, 'id' | 'timestamp'>
): Promise<AnalysisRecord> {
  const id = generateAnalysisId();
  const timestamp = new Date().toISOString();

  const fullRecord: AnalysisRecord = {
    ...record,
    id,
    timestamp,
  };

  try {
    // Save the analysis record
    await kv.set(`${ANALYSIS_PREFIX}${id}`, fullRecord);

    // Add to session's analysis list
    await kv.lpush(`${SESSION_ANALYSES_PREFIX}${record.sessionId}`, id);

    // Update session metadata
    await updateSessionMetadata(record.sessionId, fullRecord);

    // Log for Vercel Observability
    console.log(JSON.stringify({
      type: 'analysis_saved',
      analysisId: id,
      sessionId: record.sessionId,
      source: record.source,
      analysisType: record.analysisType,
      status: record.status,
      timestamp,
    }));

    return fullRecord;
  } catch (error) {
    console.error(JSON.stringify({
      type: 'analysis_save_error',
      sessionId: record.sessionId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }));
    throw error;
  }
}

/**
 * Update session metadata after an analysis
 */
async function updateSessionMetadata(
  sessionId: string,
  analysis: AnalysisRecord
): Promise<void> {
  const sessionKey = `${SESSION_PREFIX}${sessionId}`;
  const existing = await kv.get<SessionData>(sessionKey);

  const now = new Date().toISOString();
  const savings = analysis.potentialSavings || 0;

  if (existing) {
    await kv.set(sessionKey, {
      ...existing,
      lastActiveAt: now,
      analysisCount: existing.analysisCount + 1,
      totalSavings: existing.totalSavings + savings,
    });
  } else {
    await kv.set(sessionKey, {
      id: sessionId,
      createdAt: now,
      lastActiveAt: now,
      analysisCount: 1,
      totalSavings: savings,
    });
  }
}

/**
 * Get an analysis by ID
 * 
 * @param id - Analysis ID
 * @returns Analysis record or null
 */
export async function getAnalysis(id: string): Promise<AnalysisRecord | null> {
  try {
    const record = await kv.get<AnalysisRecord>(`${ANALYSIS_PREFIX}${id}`);
    return record;
  } catch (error) {
    console.error(JSON.stringify({
      type: 'analysis_get_error',
      analysisId: id,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }));
    return null;
  }
}

/**
 * List analyses for a session
 * 
 * @param sessionId - Session ID
 * @param limit - Maximum number of results (default 20)
 * @returns Array of analysis records
 */
export async function listAnalysesBySession(
  sessionId: string,
  limit: number = 20
): Promise<AnalysisRecord[]> {
  try {
    // Get analysis IDs for this session
    const analysisIds = await kv.lrange<string>(
      `${SESSION_ANALYSES_PREFIX}${sessionId}`,
      0,
      limit - 1
    );

    if (!analysisIds || analysisIds.length === 0) {
      return [];
    }

    // Fetch all analysis records
    const records: AnalysisRecord[] = [];
    for (const id of analysisIds) {
      const record = await getAnalysis(id);
      if (record) {
        records.push(record);
      }
    }

    return records;
  } catch (error) {
    console.error(JSON.stringify({
      type: 'analysis_list_error',
      sessionId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }));
    return [];
  }
}

/**
 * Get session metadata
 * 
 * @param sessionId - Session ID
 * @returns Session data or null
 */
export async function getSession(sessionId: string): Promise<SessionData | null> {
  try {
    return await kv.get<SessionData>(`${SESSION_PREFIX}${sessionId}`);
  } catch (error) {
    return null;
  }
}

/**
 * Update an existing analysis record
 * 
 * @param id - Analysis ID
 * @param updates - Partial updates to apply
 * @returns Updated record or null
 */
export async function updateAnalysis(
  id: string,
  updates: Partial<Omit<AnalysisRecord, 'id' | 'sessionId' | 'timestamp'>>
): Promise<AnalysisRecord | null> {
  try {
    const existing = await getAnalysis(id);
    if (!existing) {
      return null;
    }

    const updated: AnalysisRecord = {
      ...existing,
      ...updates,
    };

    await kv.set(`${ANALYSIS_PREFIX}${id}`, updated);

    // Update session savings if applicable
    if (updates.potentialSavings !== undefined && updates.potentialSavings !== existing.potentialSavings) {
      const sessionKey = `${SESSION_PREFIX}${existing.sessionId}`;
      const session = await kv.get<SessionData>(sessionKey);
      if (session) {
        const savingsDiff = (updates.potentialSavings || 0) - (existing.potentialSavings || 0);
        await kv.set(sessionKey, {
          ...session,
          totalSavings: session.totalSavings + savingsDiff,
        });
      }
    }

    console.log(JSON.stringify({
      type: 'analysis_updated',
      analysisId: id,
      updates: Object.keys(updates),
      timestamp: new Date().toISOString(),
    }));

    return updated;
  } catch (error) {
    console.error(JSON.stringify({
      type: 'analysis_update_error',
      analysisId: id,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }));
    return null;
  }
}

/**
 * Delete an analysis record
 * 
 * @param id - Analysis ID
 * @param sessionId - Session ID (for removing from list)
 */
export async function deleteAnalysis(id: string, sessionId: string): Promise<void> {
  try {
    await kv.del(`${ANALYSIS_PREFIX}${id}`);
    await kv.lrem(`${SESSION_ANALYSES_PREFIX}${sessionId}`, 0, id);

    console.log(JSON.stringify({
      type: 'analysis_deleted',
      analysisId: id,
      sessionId,
      timestamp: new Date().toISOString(),
    }));
  } catch (error) {
    console.error(JSON.stringify({
      type: 'analysis_delete_error',
      analysisId: id,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }));
  }
}

/**
 * Get summary statistics for a session
 * 
 * @param sessionId - Session ID
 * @returns Summary statistics
 */
export async function getSessionStats(sessionId: string): Promise<{
  totalAnalyses: number;
  totalSavings: number;
  highRiskCount: number;
  recentAnalyses: AnalysisRecord[];
}> {
  try {
    const session = await getSession(sessionId);
    const recentAnalyses = await listAnalysesBySession(sessionId, 5);
    
    const highRiskCount = recentAnalyses.filter(
      a => a.riskLevel === 'HIGH'
    ).length;

    return {
      totalAnalyses: session?.analysisCount || 0,
      totalSavings: session?.totalSavings || 0,
      highRiskCount,
      recentAnalyses,
    };
  } catch (error) {
    return {
      totalAnalyses: 0,
      totalSavings: 0,
      highRiskCount: 0,
      recentAnalyses: [],
    };
  }
}

/**
 * Check if KV is configured and working
 * 
 * @returns True if KV is available
 */
export async function isStorageAvailable(): Promise<boolean> {
  try {
    await kv.ping();
    return true;
  } catch {
    return false;
  }
}

