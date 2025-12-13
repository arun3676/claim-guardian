/**
 * Kestra API Client
 * 
 * Utility functions for interacting with Kestra REST API
 * Handles workflow execution, status checking, and result retrieval
 */

export interface KestraExecutionRequest {
  workflowId: string;
  namespace?: string;
  inputs?: Record<string, any>;
  labels?: Record<string, string>;
}

export interface KestraExecutionResponse {
  id: string;
  namespace: string;
  flowId: string;
  state: {
    current: 'CREATED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'KILLED' | 'WARNING';
  };
  startDate?: string;
  endDate?: string;
  duration?: number;
}

export interface KestraExecutionResult {
  execution: KestraExecutionResponse;
  outputs?: Record<string, any>;
  tasks?: Array<{
    id: string;
    state: {
      current: string;
    };
    outputs?: Record<string, any>;
  }>;
}

export interface KestraError {
  message: string;
  status?: number;
}

/**
 * Get Kestra API base URL from environment variables
 */
function getKestraApiUrl(): string {
  const url = process.env.KESTRA_API_URL || 'http://localhost:8080';
  return url.replace(/\/$/, ''); // Remove trailing slash
}

/**
 * Get Kestra API key from environment variables
 */
function getKestraApiKey(): string | undefined {
  return process.env.KESTRA_API_KEY;
}

/**
 * Make authenticated request to Kestra API
 */
async function kestraRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const apiUrl = getKestraApiUrl();
  const apiKey = getKestraApiKey();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add API key if available
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const url = `${apiUrl}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Kestra API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Network error connecting to Kestra: ${error}`);
  }
}

/**
 * Execute a Kestra workflow
 * 
 * @param request - Workflow execution request
 * @returns Execution response with execution ID
 */
export async function executeKestraWorkflow(
  request: KestraExecutionRequest
): Promise<KestraExecutionResponse> {
  const namespace = request.namespace || 'claimguardian';
  const endpoint = `/api/v1/executions/${namespace}/${request.workflowId}`;

  const body: any = {};
  if (request.inputs) {
    body.inputs = request.inputs;
  }
  if (request.labels) {
    body.labels = request.labels;
  }

  const response = await kestraRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return response.json();
}

/**
 * Get execution status by execution ID
 * 
 * @param executionId - Execution ID from executeKestraWorkflow
 * @returns Current execution status
 */
export async function getExecutionStatus(
  executionId: string
): Promise<KestraExecutionResponse> {
  const endpoint = `/api/v1/executions/${executionId}`;

  const response = await kestraRequest(endpoint, {
    method: 'GET',
  });

  return response.json();
}

/**
 * Get execution results including outputs and task results
 * 
 * @param executionId - Execution ID
 * @returns Complete execution results
 */
export async function getExecutionResults(
  executionId: string
): Promise<KestraExecutionResult> {
  const endpoint = `/api/v1/executions/${executionId}`;

  const response = await kestraRequest(endpoint, {
    method: 'GET',
  });

  const execution = await response.json();

  // Get outputs if available
  let outputs: Record<string, any> | undefined;
  let tasks: any[] | undefined;

  try {
    const outputsResponse = await kestraRequest(
      `/api/v1/executions/${executionId}/outputs`,
      { method: 'GET' }
    );
    if (outputsResponse.ok) {
      outputs = await outputsResponse.json();
    }
  } catch (error) {
    // Outputs endpoint might not be available, ignore
    console.warn('Could not fetch execution outputs:', error);
  }

  try {
    const tasksResponse = await kestraRequest(
      `/api/v1/executions/${executionId}/tasks`,
      { method: 'GET' }
    );
    if (tasksResponse.ok) {
      const tasksData = await tasksResponse.json();
      tasks = tasksData.results || tasksData;
    }
  } catch (error) {
    // Tasks endpoint might not be available, ignore
    console.warn('Could not fetch execution tasks:', error);
  }

  return {
    execution,
    outputs,
    tasks,
  };
}

/**
 * Poll execution status until completion
 * 
 * @param executionId - Execution ID
 * @param options - Polling options
 * @returns Final execution result
 */
export async function pollExecutionUntilComplete(
  executionId: string,
  options: {
    interval?: number; // Polling interval in ms (default: 1000)
    maxAttempts?: number; // Maximum polling attempts (default: 60)
    onProgress?: (status: KestraExecutionResponse) => void;
  } = {}
): Promise<KestraExecutionResult> {
  const interval = options.interval || 1000;
  const maxAttempts = options.maxAttempts || 60;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const status = await getExecutionStatus(executionId);

    if (options.onProgress) {
      options.onProgress(status);
    }

    const currentState = status.state?.current;
    if (
      currentState === 'SUCCESS' ||
      currentState === 'FAILED' ||
      currentState === 'KILLED' ||
      currentState === 'WARNING'
    ) {
      // Execution completed, get full results
      return getExecutionResults(executionId);
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, interval));
    attempts++;
  }

  // Timeout - return current status
  throw new Error(
    `Execution ${executionId} did not complete within ${maxAttempts * interval}ms`
  );
}

