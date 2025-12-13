import { NextRequest, NextResponse } from 'next/server';
import {
  executeKestraWorkflow,
  KestraExecutionRequest,
  KestraError,
} from '@/lib/kestra-client';

/**
 * POST /api/kestra/execute
 * 
 * Execute a Kestra workflow
 * 
 * Request body:
 * {
 *   workflowId: string (required)
 *   namespace?: string (default: "claimguardian")
 *   inputs?: Record<string, any>
 *   labels?: Record<string, string>
 * }
 * 
 * Response:
 * {
 *   id: string (execution ID)
 *   namespace: string
 *   flowId: string
 *   state: { current: string }
 *   startDate?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.workflowId || typeof body.workflowId !== 'string') {
      return NextResponse.json(
        {
          error: 'workflowId is required and must be a string',
        },
        { status: 400 }
      );
    }

    // Build execution request
    const executionRequest: KestraExecutionRequest = {
      workflowId: body.workflowId,
      namespace: body.namespace || 'claimguardian',
      inputs: body.inputs || {},
      labels: body.labels || {},
    };

    // Execute workflow
    const execution = await executeKestraWorkflow(executionRequest);

    return NextResponse.json(
      {
        success: true,
        execution: {
          id: execution.id,
          namespace: execution.namespace,
          flowId: execution.flowId,
          state: execution.state,
          startDate: execution.startDate,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error executing Kestra workflow:', error);

    if (error instanceof Error) {
      // Check if it's a network error (Kestra server not available)
      if (error.message.includes('Network error') || error.message.includes('fetch')) {
        return NextResponse.json(
          {
            error: 'Could not connect to Kestra server',
            message: 'Make sure Kestra is running and KESTRA_API_URL is configured correctly',
            details: error.message,
          },
          { status: 503 } // Service Unavailable
        );
      }

      // Check if it's a Kestra API error
      if (error.message.includes('Kestra API error')) {
        return NextResponse.json(
          {
            error: 'Kestra API error',
            message: error.message,
          },
          { status: 502 } // Bad Gateway
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to execute Kestra workflow',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Unknown error occurred',
        message: 'An unexpected error occurred while executing the workflow',
      },
      { status: 500 }
    );
  }
}

