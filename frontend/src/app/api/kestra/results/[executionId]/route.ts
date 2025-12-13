import { NextRequest, NextResponse } from 'next/server';
import { getExecutionResults } from '@/lib/kestra-client';

/**
 * GET /api/kestra/results/[executionId]
 * 
 * Get complete execution results including outputs and task results
 * 
 * Response:
 * {
 *   execution: {
 *     id: string
 *     namespace: string
 *     flowId: string
 *     state: { current: string }
 *     startDate?: string
 *     endDate?: string
 *     duration?: number
 *   }
 *   outputs?: Record<string, any>
 *   tasks?: Array<{
 *     id: string
 *     state: { current: string }
 *     outputs?: Record<string, any>
 *   }>
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

    const results = await getExecutionResults(executionId);

    return NextResponse.json(
      {
        success: true,
        execution: {
          id: results.execution.id,
          namespace: results.execution.namespace,
          flowId: results.execution.flowId,
          state: results.execution.state,
          startDate: results.execution.startDate,
          endDate: results.execution.endDate,
          duration: results.execution.duration,
        },
        outputs: results.outputs,
        tasks: results.tasks,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting Kestra execution results:', error);

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
          error: 'Failed to get execution results',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Unknown error occurred',
        message: 'An unexpected error occurred while getting execution results',
      },
      { status: 500 }
    );
  }
}

