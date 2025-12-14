/**
 * Next.js Middleware for Rate Limiting and WAF
 * 
 * Provides protection for AI-heavy API endpoints using:
 * - IP-based rate limiting
 * - Session-based rate limiting
 * - Request logging for Vercel Observability
 * 
 * VERCEL INTEGRATION:
 * - Uses Vercel Edge Runtime for low-latency checks
 * - Logs rate limit events for Vercel Observability
 * - Works with Vercel WAF for additional protection
 * 
 * Rate Limits:
 * - AI endpoints: 10 requests/minute per IP
 * - Upload endpoints: 5 requests/minute per IP
 * - General API: 100 requests/minute per IP
 */

import { NextRequest, NextResponse } from 'next/server';

// In-memory rate limit store (for demo - in production use Vercel KV)
// Note: This is reset on cold starts, which is acceptable for rate limiting
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Rate limit configuration for different endpoint types
 */
const RATE_LIMITS = {
  ai: { requests: 10, windowMs: 60 * 1000 },      // 10 requests per minute
  upload: { requests: 5, windowMs: 60 * 1000 },   // 5 requests per minute
  general: { requests: 100, windowMs: 60 * 1000 }, // 100 requests per minute
};

/**
 * Get rate limit key for the request
 */
function getRateLimitKey(request: NextRequest, type: string): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
             request.headers.get('x-real-ip') ||
             'unknown';
  return `${type}:${ip}`;
}

/**
 * Check and update rate limit
 */
function checkRateLimit(
  key: string,
  config: { requests: number; windowMs: number }
): { allowed: boolean; current: number; limit: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // If no entry or window expired, create new entry
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      current: 1,
      limit: config.requests,
      resetAt: now + config.windowMs,
    };
  }

  // Increment count
  entry.count += 1;
  rateLimitStore.set(key, entry);

  return {
    allowed: entry.count <= config.requests,
    current: entry.count,
    limit: config.requests,
    resetAt: entry.resetAt,
  };
}

/**
 * Get endpoint type for rate limiting
 */
function getEndpointType(pathname: string): 'ai' | 'upload' | 'general' | null {
  // AI endpoints
  if (
    pathname.startsWith('/api/ai/') ||
    pathname.startsWith('/api/oumi/') ||
    pathname.startsWith('/api/mcp/')
  ) {
    return 'ai';
  }

  // Upload endpoints
  if (pathname.startsWith('/api/bills/upload')) {
    return 'upload';
  }

  // Kestra endpoints (treat as general, they call external services)
  if (pathname.startsWith('/api/kestra/')) {
    return 'general';
  }

  // Other API endpoints
  if (pathname.startsWith('/api/')) {
    return 'general';
  }

  // Non-API routes are not rate limited
  return null;
}

/**
 * Middleware function
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip non-API routes
  const endpointType = getEndpointType(pathname);
  if (!endpointType) {
    return NextResponse.next();
  }

  // Skip health check endpoint
  if (pathname === '/api/health') {
    return NextResponse.next();
  }

  // Check rate limit
  const rateLimitKey = getRateLimitKey(request, endpointType);
  const config = RATE_LIMITS[endpointType];
  const result = checkRateLimit(rateLimitKey, config);

  // Add rate limit headers
  const response = result.allowed
    ? NextResponse.next()
    : NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again later.`,
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
        },
        { status: 429 }
      );

  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', Math.max(0, result.limit - result.current).toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000).toString());

  // Log rate limit event if exceeded
  if (!result.allowed) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    console.log(JSON.stringify({
      type: 'rate_limit',
      level: 'warn',
      endpoint: pathname,
      endpointType,
      ip,
      currentCount: result.current,
      limit: result.limit,
      resetAt: new Date(result.resetAt).toISOString(),
      timestamp: new Date().toISOString(),
    }));
  }

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

/**
 * Configure which paths the middleware runs on
 */
export const config = {
  matcher: [
    /*
     * Match all API routes except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/api/:path*',
  ],
};

