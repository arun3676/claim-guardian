import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/oumi/predict
 * 
 * Proxy endpoint for Oumi model predictions via HuggingFace API
 * This allows Kestra workflows and frontend to call the fine-tuned Oumi model
 * 
 * Request body:
 * {
 *   inputs: string (required) - Text input for the model
 * }
 * 
 * Response:
 * {
 *   generated_text: string - Model prediction
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inputs } = body;

    if (!inputs || typeof inputs !== 'string') {
      return NextResponse.json(
        {
          error: 'inputs is required and must be a string',
        },
        { status: 400 }
      );
    }

    const huggingfaceApiKey = process.env.HUGGINGFACE_API_KEY;
    if (!huggingfaceApiKey) {
      return NextResponse.json(
        {
          error: 'HUGGINGFACE_API_KEY not configured',
          message: 'Please configure HUGGINGFACE_API_KEY environment variable',
        },
        { status: 500 }
      );
    }

    const modelId = 'arungenailab/claimguardian-medical-billing-v2';
    const apiUrl = `https://api-inference.huggingface.co/models/${modelId}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${huggingfaceApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: 'HuggingFace API error',
          message: `API returned ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Handle HuggingFace API response format
    let generatedText: string;
    if (Array.isArray(result) && result.length > 0) {
      generatedText = result[0].generated_text || JSON.stringify(result[0]);
    } else if (typeof result === 'object' && 'generated_text' in result) {
      generatedText = result.generated_text;
    } else {
      generatedText = JSON.stringify(result);
    }

    return NextResponse.json(
      {
        success: true,
        model: modelId,
        generated_text: generatedText,
        raw_response: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error calling Oumi model:', error);

    if (error instanceof Error) {
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

