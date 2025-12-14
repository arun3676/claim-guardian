/**
 * Analysis History API Route
 * 
 * Provides access to analysis history stored in Vercel KV.
 * Enables the "Recent Analyses" dashboard feature.
 * 
 * VERCEL INTEGRATION:
 * - Uses Vercel KV for persistent storage
 * - Tracks analysis history per session
 * - Enables historical dashboard data
 * 
 * @route GET/POST /api/analysis/history
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  listAnalysesBySession,
  getSessionStats,
  generateSessionId,
  isStorageAvailable,
} from '@/lib/storage';

const SESSION_COOKIE_NAME = 'claimguardian_session';

/**
 * Get or create session ID from cookies
 */
async function getSessionId(): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (!sessionId) {
    sessionId = generateSessionId();
  }
  
  return sessionId;
}

/**
 * GET /api/analysis/history
 * 
 * Get analysis history for the current session
 * 
 * Query params:
 * - limit: number (default 20) - Maximum number of results
 * 
 * Response:
 * {
 *   success: boolean
 *   sessionId: string
 *   analyses: AnalysisRecord[]
 *   stats: { totalAnalyses, totalSavings, highRiskCount }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Check if storage is available
    const storageAvailable = await isStorageAvailable();
    if (!storageAvailable) {
      // Return empty data if KV is not configured (graceful fallback)
      return NextResponse.json({
        success: true,
        sessionId: 'demo',
        analyses: [],
        stats: {
          totalAnalyses: 0,
          totalSavings: 0,
          highRiskCount: 0,
        },
        message: 'Storage not configured. Analysis history is not available.',
      });
    }

    const sessionId = await getSessionId();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Get analyses and stats
    const [analyses, stats] = await Promise.all([
      listAnalysesBySession(sessionId, limit),
      getSessionStats(sessionId),
    ]);

    // Log for Vercel Observability
    console.log(JSON.stringify({
      type: 'history_fetch',
      sessionId,
      analysisCount: analyses.length,
      timestamp: new Date().toISOString(),
    }));

    const response = NextResponse.json({
      success: true,
      sessionId,
      analyses,
      stats: {
        totalAnalyses: stats.totalAnalyses,
        totalSavings: stats.totalSavings,
        highRiskCount: stats.highRiskCount,
      },
    });

    // Set session cookie if not present
    response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;

  } catch (error) {
    console.error(JSON.stringify({
      type: 'history_fetch_error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }));

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analysis history',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analysis/history
 * 
 * Create a new session (clears history cookie)
 * 
 * Response:
 * {
 *   success: boolean
 *   sessionId: string (new session ID)
 * }
 */
export async function POST() {
  try {
    const newSessionId = generateSessionId();

    const response = NextResponse.json({
      success: true,
      sessionId: newSessionId,
      message: 'New session created',
    });

    // Set new session cookie
    response.cookies.set(SESSION_COOKIE_NAME, newSessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    console.log(JSON.stringify({
      type: 'new_session_created',
      sessionId: newSessionId,
      timestamp: new Date().toISOString(),
    }));

    return response;

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create new session',
      },
      { status: 500 }
    );
  }
}

