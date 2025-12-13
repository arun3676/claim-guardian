import { NextRequest, NextResponse } from 'next/server';

/**
 * Chat API Route - Redirects to the main AI chat endpoint
 * 
 * This is a compatibility route. The main streaming chat is at /api/ai/chat
 * 
 * Available AI endpoints:
 * - /api/ai/chat - Streaming chat with multiple providers
 * - /api/ai/analyze - Full bill analysis workflow with streaming
 * - /api/oumi/predict - Oumi fine-tuned model predictions
 */
export async function POST(req: NextRequest) {
  // Forward to the main AI chat endpoint
  const body = await req.json();
  
  const aiChatUrl = new URL('/api/ai/chat', req.url);
  const response = await fetch(aiChatUrl.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  // Return the streaming response
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}

export async function GET() {
  return NextResponse.json({
    message: 'ClaimGuardian AI Chat Endpoints',
    endpoints: {
      '/api/ai/chat': 'Streaming chat with OpenAI/Anthropic',
      '/api/ai/analyze': 'Full bill analysis workflow',
      '/api/oumi/predict': 'Oumi fine-tuned model',
      '/api/mcp/claimguardian/*': 'MCP tool endpoints',
    },
  });
}

