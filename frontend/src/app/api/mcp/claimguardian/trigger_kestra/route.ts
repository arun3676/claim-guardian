import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/mcp/claimguardian/trigger_kestra
 * 
 * Proxy endpoint for triggering Kestra workflows via MCP tool
 * This allows Cline MCP to trigger Kestra workflows through the Next.js API
 * 
 * Request body:
 * {
 *   workflowId: string (required)
 *   namespace?: string (default: "claimguardian")
 *   billData: {
 *     patient?: { name?: string, id?: string }
 *     procedures: Array<{ cpt_code?: string, description: string, billed_amount: number }>
 *     diagnoses?: Array<{ icd10_code?: string, description: string }>
 *     total_billed: number
 *     insurance?: { company?: string, policy_number?: string }
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflowId, namespace, billData } = body;

    // Validate required fields
    if (!workflowId || typeof workflowId !== 'string') {
      return NextResponse.json(
        {
          error: 'workflowId is required and must be a string',
        },
        { status: 400 }
      );
    }

    if (!billData || typeof billData !== 'object') {
      return NextResponse.json(
        {
          error: 'billData is required and must be an object',
        },
        { status: 400 }
      );
    }

    // Get Kestra API configuration
    const kestraApiUrl = process.env.KESTRA_API_URL || 'http://localhost:8080';
    const kestraNamespace = namespace || 'claimguardian';

    // Prepare execution request
    const executionRequest: any = {
      inputs: {
        bill_data: billData,
      },
      labels: {
        source: 'mcp_api',
        tool: 'trigger_kestra_workflow',
      },
    };

    // Call Kestra API
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (process.env.KESTRA_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.KESTRA_API_KEY}`;
    }

    const response = await fetch(
      `${kestraApiUrl}/api/v1/executions/${kestraNamespace}/${workflowId}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(executionRequest),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: 'Failed to trigger Kestra workflow',
          message: `Kestra API error: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const execution = await response.json();

    return NextResponse.json(
      {
        success: true,
        message: `Kestra workflow '${workflowId}' triggered successfully`,
        execution: {
          id: execution.id,
          namespace: execution.namespace,
          flowId: execution.flowId,
          state: execution.state?.current || 'CREATED',
          startDate: execution.startDate,
        },
        links: {
          status: `/api/kestra/status/${execution.id}`,
          results: `/api/kestra/results/${execution.id}`,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error triggering Kestra workflow:', error);

    if (error instanceof Error) {
      // Check if it's a network error
      if (error.message.includes('fetch') || error.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          {
            error: 'Could not connect to Kestra server',
            message: 'Make sure Kestra is running and KESTRA_API_URL is configured correctly',
            details: error.message,
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to trigger Kestra workflow',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Unknown error occurred',
        message: 'An unexpected error occurred while triggering the workflow',
      },
      { status: 500 }
    );
  }
}

