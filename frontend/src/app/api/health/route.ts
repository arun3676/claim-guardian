/**
 * Health Check API Route
 * 
 * Provides system health status for monitoring and dashboard display.
 * Checks connectivity to all integrated services.
 * 
 * VERCEL INTEGRATION:
 * - Edge runtime for fast health checks
 * - Used for "System Status" indicator in UI
 * - Logged for Vercel Observability
 * 
 * RUNTIME: Edge
 * - Health checks should be fast and lightweight
 * - Edge provides lowest latency for status checks
 * - Simple JSON response doesn't need Node.js features
 * 
 * @route GET /api/health
 */

import { NextRequest, NextResponse } from 'next/server';

// Enable Edge runtime for fast health checks
export const runtime = 'edge';

interface ServiceStatus {
  name: string;
  status: 'ok' | 'degraded' | 'error';
  latencyMs?: number;
  message?: string;
}

interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  services: ServiceStatus[];
  vercel: {
    region?: string;
    environment?: string;
  };
}

/**
 * Check if a URL is reachable
 */
async function checkEndpoint(
  url: string,
  timeout: number = 5000
): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    return {
      ok: response.ok,
      latencyMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * GET /api/health
 * 
 * Returns health status of the application and its services
 * 
 * Response:
 * {
 *   status: 'ok' | 'degraded' | 'error'
 *   timestamp: string
 *   version: string
 *   services: ServiceStatus[]
 *   vercel: { region, environment }
 * }
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const services: ServiceStatus[] = [];

  // Check Kestra API (if configured)
  const kestraUrl = process.env.KESTRA_API_URL;
  if (kestraUrl) {
    const kestraCheck = await checkEndpoint(`${kestraUrl}/api/v1/health`);
    services.push({
      name: 'Kestra',
      status: kestraCheck.ok ? 'ok' : 'error',
      latencyMs: kestraCheck.latencyMs,
      message: kestraCheck.error,
    });
  } else {
    services.push({
      name: 'Kestra',
      status: 'degraded',
      message: 'Not configured',
    });
  }

  // Check HuggingFace API (for Oumi model)
  if (process.env.HUGGINGFACE_API_KEY) {
    services.push({
      name: 'Oumi/HuggingFace',
      status: 'ok',
      message: 'API key configured',
    });
  } else {
    services.push({
      name: 'Oumi/HuggingFace',
      status: 'degraded',
      message: 'API key not configured',
    });
  }

  // Check AI providers
  const aiProviders = [
    { name: 'OpenAI', envVar: 'OPENAI_API_KEY' },
    { name: 'Anthropic', envVar: 'ANTHROPIC_API_KEY' },
  ];

  for (const provider of aiProviders) {
    if (process.env[provider.envVar]) {
      services.push({
        name: provider.name,
        status: 'ok',
        message: 'API key configured',
      });
    } else {
      services.push({
        name: provider.name,
        status: 'degraded',
        message: 'API key not configured',
      });
    }
  }

  // Check Vercel Blob (check env var presence)
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    services.push({
      name: 'Vercel Blob',
      status: 'ok',
      message: 'Token configured',
    });
  } else {
    services.push({
      name: 'Vercel Blob',
      status: 'degraded',
      message: 'Token not configured',
    });
  }

  // Check Vercel KV (check env var presence)
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    services.push({
      name: 'Vercel KV',
      status: 'ok',
      message: 'Configured',
    });
  } else {
    services.push({
      name: 'Vercel KV',
      status: 'degraded',
      message: 'Not configured - using mock data',
    });
  }

  // Determine overall status
  const hasError = services.some(s => s.status === 'error');
  const hasDegraded = services.some(s => s.status === 'degraded');
  
  let overallStatus: 'ok' | 'degraded' | 'error' = 'ok';
  if (hasError) {
    overallStatus = 'error';
  } else if (hasDegraded) {
    overallStatus = 'degraded';
  }

  const response: HealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services,
    vercel: {
      region: process.env.VERCEL_REGION,
      environment: process.env.VERCEL_ENV,
    },
  };

  // Log health check for Vercel Observability
  console.log(JSON.stringify({
    type: 'health_check',
    status: overallStatus,
    serviceCount: services.length,
    okCount: services.filter(s => s.status === 'ok').length,
    degradedCount: services.filter(s => s.status === 'degraded').length,
    errorCount: services.filter(s => s.status === 'error').length,
    latencyMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  }));

  return NextResponse.json(response, {
    status: overallStatus === 'error' ? 503 : 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

