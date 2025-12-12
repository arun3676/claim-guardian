import { NextRequest, NextResponse } from 'next/server';

/**
 * Chat API Route - Placeholder for future chat functionality
 * 
 * This endpoint is reserved for future chat/streaming features.
 * Currently not implemented as the main application uses MCP tools
 * through the /api/mcp/claimguardian endpoints.
 * 
 * To implement:
 * 1. Configure AI model (OpenAI, Anthropic, etc.)
 * 2. Set up streaming response
 * 3. Add authentication/rate limiting
 */
export async function POST(req: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Chat endpoint not yet implemented',
      message: 'Please use the MCP tool endpoints for medical billing analysis'
    },
    { status: 501 } // 501 Not Implemented
  );
}

