/**
 * Vercel AI SDK Streaming Chat Route
 * 
 * This route provides streaming AI responses for ClaimGuardian features:
 * - Bill summarization
 * - Appeal letter drafting
 * - Risk explanation
 * - General medical billing chat
 * 
 * VERCEL INTEGRATION:
 * - Uses Vercel AI SDK for streaming responses
 * - Routes through AI Gateway for observability and metrics
 * - Optimized for Edge runtime for low latency
 * 
 * @route POST /api/ai/chat
 */

import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { NextRequest } from 'next/server';
import {
  getModelConfigForOperation,
  buildChatMessages,
  type OperationType,
  type AIProvider,
} from '@/lib/ai-client';

// Enable Edge runtime for faster streaming responses
// This provides lower latency for AI streaming compared to Node.js runtime
export const runtime = 'edge';

/**
 * Request body interface for the chat endpoint
 */
interface ChatRequest {
  messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  message?: string; // Simple single message mode
  operationType?: OperationType;
  provider?: AIProvider;
  model?: string;
  context?: string; // Additional context like bill data
  sessionId?: string; // For observability tracking
}

/**
 * Create model client based on provider
 */
function createModelClient(provider: AIProvider, model: string) {
  switch (provider) {
    case 'openai':
      return createOpenAI({
        apiKey: process.env.OPENAI_API_KEY || '',
      })(model);
    
    case 'anthropic':
      return createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY || '',
      })(model);
    
    case 'deepseek':
      return createOpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY || '',
        baseURL: 'https://api.deepseek.com/v1',
      })(model);
    
    default:
      // Default to OpenAI
      return createOpenAI({
        apiKey: process.env.OPENAI_API_KEY || '',
      })('gpt-4o-mini');
  }
}

/**
 * POST /api/ai/chat
 * 
 * Accepts chat requests and returns streaming AI responses
 * 
 * Request body:
 * {
 *   message: string (for simple mode)
 *   messages: array (for full chat mode)
 *   operationType: 'summary' | 'appeal' | 'risk' | 'analysis' | 'chat'
 *   provider?: 'openai' | 'anthropic' | 'deepseek'
 *   model?: string
 *   context?: string (additional context like bill data)
 *   sessionId?: string (for tracking)
 * }
 * 
 * Response: Streaming text response via Vercel AI SDK
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body: ChatRequest = await request.json();
    const {
      messages: providedMessages,
      message,
      operationType = 'chat',
      provider: requestedProvider,
      model: requestedModel,
      context,
      sessionId,
    } = body;

    // Validate input
    if (!providedMessages && !message) {
      return new Response(
        JSON.stringify({ error: 'Either messages or message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get model configuration for the operation type
    const modelConfig = getModelConfigForOperation(operationType);
    const provider = requestedProvider || modelConfig.provider;
    const model = requestedModel || modelConfig.model;

    // Handle HuggingFace separately (doesn't support streaming in the same way)
    if (provider === 'huggingface') {
      return new Response(
        JSON.stringify({ 
          error: 'HuggingFace provider does not support streaming. Use /api/oumi/predict instead.' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build messages
    let messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    if (providedMessages) {
      messages = providedMessages;
    } else if (message) {
      messages = buildChatMessages(operationType, message, context);
    } else {
      messages = [];
    }

    // Create the model client
    const modelClient = createModelClient(provider, model);

    // Log for Vercel Observability
    console.log(JSON.stringify({
      type: 'ai_request',
      operationType,
      provider,
      model,
      sessionId: sessionId || 'anonymous',
      messageCount: messages.length,
      timestamp: new Date().toISOString(),
    }));

    // Stream the response using Vercel AI SDK
    const result = streamText({
      model: modelClient,
      messages,
      // Callback for tracking completion
      onFinish: ({ text, usage }) => {
        const latencyMs = Date.now() - startTime;
        // Log completion for Vercel Observability
        console.log(JSON.stringify({
          type: 'ai_response',
          operationType,
          provider,
          model,
          sessionId: sessionId || 'anonymous',
          latencyMs,
          inputTokens: usage?.inputTokens,
          outputTokens: usage?.outputTokens,
          totalTokens: usage?.totalTokens,
          responseLength: text.length,
          timestamp: new Date().toISOString(),
        }));
      },
    });

    // Return streaming response
    return result.toTextStreamResponse();

  } catch (error) {
    const latencyMs = Date.now() - startTime;
    
    console.error(JSON.stringify({
      type: 'ai_error',
      error: error instanceof Error ? error.message : 'Unknown error',
      latencyMs,
      timestamp: new Date().toISOString(),
    }));

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return new Response(
          JSON.stringify({ 
            error: 'AI provider not configured',
            message: 'Please ensure API keys are set in environment variables'
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      if (error.message.includes('rate limit')) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded',
            message: 'Please try again in a few moments'
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        error: 'Failed to process AI request',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

