/**
 * Vercel Observability Helper
 * 
 * This module provides structured logging and metrics for Vercel Observability.
 * All logs are formatted as JSON for easy parsing in Vercel's log viewer.
 * 
 * VERCEL INTEGRATION:
 * - Structured JSON logs for Vercel Log Drains
 * - AI Gateway metrics integration
 * - Performance timing helpers
 * - Error tracking with context
 * 
 * @module observability
 */

/**
 * Log levels supported by the observability system
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Common fields included in all log entries
 */
export interface LogContext {
  /** Session ID for user tracking */
  sessionId?: string;
  /** Request ID for tracing */
  requestId?: string;
  /** AI model used */
  model?: string;
  /** AI provider */
  provider?: string;
  /** Operation type */
  operationType?: string;
  /** Latency in milliseconds */
  latencyMs?: number;
  /** Token usage (for AI calls) */
  tokens?: {
    prompt?: number;
    completion?: number;
    total?: number;
  };
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Log entry structure for Vercel Observability
 */
export interface LogEntry extends LogContext {
  type: string;
  level: LogLevel;
  message?: string;
  timestamp: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Create a structured log entry
 */
function createLogEntry(
  type: string,
  level: LogLevel,
  context: LogContext = {},
  message?: string,
  error?: Error
): LogEntry {
  const entry: LogEntry = {
    type,
    level,
    timestamp: new Date().toISOString(),
    ...context,
  };

  if (message) {
    entry.message = message;
  }

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return entry;
}

/**
 * Log to console in structured JSON format
 */
function logToConsole(entry: LogEntry): void {
  const jsonString = JSON.stringify(entry);
  
  switch (entry.level) {
    case 'error':
      console.error(jsonString);
      break;
    case 'warn':
      console.warn(jsonString);
      break;
    case 'debug':
      console.debug(jsonString);
      break;
    default:
      console.log(jsonString);
  }
}

/**
 * Log an AI request start
 */
export function logAIRequest(context: {
  operationType: string;
  provider: string;
  model: string;
  sessionId?: string;
  requestId?: string;
  messageCount?: number;
}): void {
  const entry = createLogEntry('ai_request', 'info', {
    operationType: context.operationType,
    provider: context.provider,
    model: context.model,
    sessionId: context.sessionId,
    requestId: context.requestId,
    metadata: {
      messageCount: context.messageCount,
    },
  });
  
  logToConsole(entry);
}

/**
 * Log an AI response completion
 */
export function logAIResponse(context: {
  operationType: string;
  provider: string;
  model: string;
  sessionId?: string;
  requestId?: string;
  latencyMs: number;
  tokens?: {
    prompt?: number;
    completion?: number;
    total?: number;
  };
  responseLength?: number;
}): void {
  const entry = createLogEntry('ai_response', 'info', {
    operationType: context.operationType,
    provider: context.provider,
    model: context.model,
    sessionId: context.sessionId,
    requestId: context.requestId,
    latencyMs: context.latencyMs,
    tokens: context.tokens,
    metadata: {
      responseLength: context.responseLength,
    },
  });
  
  logToConsole(entry);
}

/**
 * Log an AI error
 */
export function logAIError(
  error: Error,
  context: {
    operationType: string;
    provider: string;
    model: string;
    sessionId?: string;
    requestId?: string;
    latencyMs?: number;
  }
): void {
  const entry = createLogEntry(
    'ai_error',
    'error',
    {
      operationType: context.operationType,
      provider: context.provider,
      model: context.model,
      sessionId: context.sessionId,
      requestId: context.requestId,
      latencyMs: context.latencyMs,
    },
    error.message,
    error
  );
  
  logToConsole(entry);
}

/**
 * Log a rate limit event
 */
export function logRateLimit(context: {
  ip: string;
  sessionId?: string;
  endpoint: string;
  currentCount: number;
  limit: number;
  windowMs: number;
}): void {
  const entry = createLogEntry('rate_limit', 'warn', {
    sessionId: context.sessionId,
    metadata: {
      ip: context.ip,
      endpoint: context.endpoint,
      currentCount: context.currentCount,
      limit: context.limit,
      windowMs: context.windowMs,
    },
  }, `Rate limit exceeded: ${context.currentCount}/${context.limit}`);
  
  logToConsole(entry);
}

/**
 * Log a storage operation
 */
export function logStorage(
  operation: 'save' | 'get' | 'list' | 'delete',
  context: {
    recordType: 'analysis' | 'session' | 'blob';
    recordId?: string;
    sessionId?: string;
    latencyMs?: number;
    success: boolean;
    error?: Error;
  }
): void {
  const entry = createLogEntry(
    `storage_${operation}`,
    context.success ? 'info' : 'error',
    {
      sessionId: context.sessionId,
      latencyMs: context.latencyMs,
      metadata: {
        recordType: context.recordType,
        recordId: context.recordId,
      },
    },
    undefined,
    context.error
  );
  
  logToConsole(entry);
}

/**
 * Create a timer for measuring latency
 */
export function createTimer(): () => number {
  const startTime = Date.now();
  return () => Date.now() - startTime;
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `req_${timestamp}_${random}`;
}

/**
 * Wrap a function with observability logging
 */
export function withObservability<T>(
  operationType: string,
  fn: () => Promise<T>,
  context: Partial<LogContext> = {}
): Promise<T> {
  const requestId = generateRequestId();
  const getElapsed = createTimer();
  
  logAIRequest({
    operationType,
    provider: context.provider || 'unknown',
    model: context.model || 'unknown',
    sessionId: context.sessionId,
    requestId,
  });
  
  return fn()
    .then((result) => {
      logAIResponse({
        operationType,
        provider: context.provider || 'unknown',
        model: context.model || 'unknown',
        sessionId: context.sessionId,
        requestId,
        latencyMs: getElapsed(),
      });
      return result;
    })
    .catch((error) => {
      logAIError(error, {
        operationType,
        provider: context.provider || 'unknown',
        model: context.model || 'unknown',
        sessionId: context.sessionId,
        requestId,
        latencyMs: getElapsed(),
      });
      throw error;
    });
}

/**
 * Get session ID from request headers or cookies
 */
export function extractSessionId(request: Request): string | undefined {
  // Try to get from custom header
  const headerSession = request.headers.get('x-session-id');
  if (headerSession) return headerSession;
  
  // Try to get from cookies
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/claimguardian_session=([^;]+)/);
    if (match) return match[1];
  }
  
  return undefined;
}

/**
 * Get client IP from request
 */
export function extractClientIP(request: Request): string {
  // Vercel provides the real IP in x-forwarded-for
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // Fallback headers
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;
  
  return 'unknown';
}

