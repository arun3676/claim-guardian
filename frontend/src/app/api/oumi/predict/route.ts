import { NextRequest, NextResponse } from 'next/server';
import { callOumiModel } from '@/lib/ai-client';

/**
 * POST /api/oumi/predict
 * 
 * Proxy endpoint for Oumi model predictions via HuggingFace API
 * This allows Kestra workflows and frontend to call the fine-tuned Oumi model
 * 
 * VERCEL INTEGRATION:
 * - Routes through Vercel AI Gateway for observability
 * - Tracks model usage, latency, and costs via AI Gateway metrics
 * - Uses centralized ai-client for consistent provider handling
 * 
 * RUNTIME: Node.js (not Edge)
 * - HuggingFace Inference API can have variable response times
 * - Model cold starts may exceed Edge timeout limits
 * - Non-streaming response doesn't benefit from Edge latency advantages
 * 
 * Request body:
 * {
 *   inputs: string (required) - Text input for the model
 *   sessionId?: string - Optional session ID for tracking
 * }
 * 
 * Response:
 * {
 *   success: boolean
 *   model: string
 *   generated_text: string - Model prediction
 *   raw_response: any
 *   metadata: { provider, latencyMs }
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { inputs, sessionId } = body;

    if (!inputs || typeof inputs !== 'string') {
      return NextResponse.json(
        {
          error: 'inputs is required and must be a string',
        },
        { status: 400 }
      );
    }

    // Log for Vercel Observability - request start
    console.log(JSON.stringify({
      type: 'oumi_request',
      inputLength: inputs.length,
      sessionId: sessionId || 'anonymous',
      timestamp: new Date().toISOString(),
    }));

    // Use centralized AI client for Oumi model calls
    // This ensures consistent handling and AI Gateway integration
    const result = await callOumiModel(inputs);

    // Log for Vercel Observability - request complete
    console.log(JSON.stringify({
      type: 'oumi_response',
      model: result.metadata.model,
      provider: result.metadata.provider,
      latencyMs: result.metadata.latencyMs,
      responseLength: result.generatedText.length,
      sessionId: sessionId || 'anonymous',
      timestamp: new Date().toISOString(),
    }));

    return NextResponse.json(
      {
        success: true,
        model: result.metadata.model,
        generated_text: result.generatedText,
        raw_response: result.rawResponse,
        metadata: {
          provider: result.metadata.provider,
          latencyMs: result.metadata.latencyMs,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    
    // Log error for Vercel Observability
    console.error(JSON.stringify({
      type: 'oumi_error',
      error: error instanceof Error ? error.message : 'Unknown error',
      latencyMs,
      timestamp: new Date().toISOString(),
    }));

    if (error instanceof Error) {
      // Check if it's an API key error
      if (error.message.includes('HUGGINGFACE_API_KEY')) {
        return NextResponse.json(
          {
            error: 'HUGGINGFACE_API_KEY not configured',
            message: 'Please configure HUGGINGFACE_API_KEY environment variable',
          },
          { status: 500 }
        );
      }

      // Check if it's a network error
      if (error.message.includes('fetch') || error.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          {
            error: 'Could not connect to HuggingFace API',
            message: 'Network error connecting to HuggingFace Inference API',
            details: error.message,
          },
          { status: 503 }
        );
      }

      // Check for HuggingFace API errors
      if (error.message.includes('HuggingFace API error')) {
        return NextResponse.json(
          {
            error: 'HuggingFace API error',
            message: error.message,
          },
          { status: 502 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to get Oumi model prediction',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Unknown error occurred',
        message: 'An unexpected error occurred while calling the Oumi model',
      },
      { status: 500 }
    );
  }
}

