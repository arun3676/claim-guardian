import { NextRequest, NextResponse } from 'next/server';
import { getExecutionStatus } from '@/lib/kestra-client';

/**
 * GET /api/kestra/status/[executionId]
 * 
 * Get execution status by execution ID
 * 
 * Response:
 * {
 *   id: string
 *   namespace: string
 *   flowId: string
 *   state: { current: 'CREATED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'KILLED' | 'WARNING' }
 *   startDate?: string
 *   endDate?: string
 *   duration?: number
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { executionId: string } }
) {
  try {
    const { executionId } = params;

    if (!executionId) {
      return NextResponse.json(
        {
          error: 'executionId is required',
        },
        { status: 400 }
      );
    }

    const status = await getExecutionStatus(executionId);

    return NextResponse.json(
      {
        success: true,
        execution: {
          id: status.id,
          namespace: status.namespace,
          flowId: status.flowId,
          state: status.state,
          startDate: status.startDate,
          endDate: status.endDate,
          duration: status.duration,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting Kestra execution status:', error);

    if (error instanceof Error) {
      // Check if execution not found
      if (error.message.includes('404') || error.message.includes('not found')) {
        return NextResponse.json(
          {
            error: 'Execution not found',
            message: `Execution ${params.executionId} does not exist`,
          },
          { status: 404 }
        );
      }

      // Check if it's a network error
      if (error.message.includes('Network error') || error.message.includes('fetch')) {
        return NextResponse.json(
          {
            error: 'Could not connect to Kestra server',
            message: 'Make sure Kestra is running and KESTRA_API_URL is configured correctly',
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to get execution status',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Unknown error occurred',
        message: 'An unexpected error occurred while getting execution status',
      },
      { status: 500 }
    );
  }
}

