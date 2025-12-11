import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // TODO: Implement chat endpoint with AI SDK
    const result = await streamText({
      model: null, // Configure your model
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

