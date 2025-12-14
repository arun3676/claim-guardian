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
 * Get Kestra API key from environment variables (for Bearer token auth)
 */
function getKestraApiKey(): string | undefined {
  return process.env.KESTRA_API_KEY;
}

/**
 * Get Kestra Basic Auth credentials from environment variables
 * Defaults to Kestra's default Docker credentials if not set
 */
function getKestraAuth(): { username: string; password: string } {
  return {
    username: process.env.KESTRA_USERNAME || 'admin@kestra.io',
    password: process.env.KESTRA_PASSWORD || 'kestra',
  };
}

/**
 * Make authenticated request to Kestra API
 * Uses Basic Auth (username/password) which is required for Kestra 0.24.0+
 */
async function kestraRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const apiUrl = getKestraApiUrl();
  const apiKey = getKestraApiKey();
  const auth = getKestraAuth();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Kestra 0.24.0+ requires Basic Auth (username/password)
  // If API key is provided, use Bearer token (for older versions or custom setups)
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  } else {
    // Use Basic Auth with default or configured credentials
    const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
    headers['Authorization'] = `Basic ${credentials}`;
  }

  const url = `${apiUrl}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      const responseHeaders = Object.fromEntries(response.headers.entries());
      
      // Log detailed error for debugging
      console.error(`[Kestra] API Error Details:`, {
        url,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: errorText,
      });
      
      // Provide helpful error message for 401 Unauthorized
      if (response.status === 401) {
        const authInfo = apiKey 
          ? 'Bearer token (KESTRA_API_KEY)' 
          : `Basic Auth (username: ${auth.username})`;
        throw new Error(
          `Kestra API authentication failed (401). ` +
          `Using ${authInfo}. ` +
          `Please check your Kestra credentials. ` +
          `Default Docker credentials: admin@kestra.io / kestra. ` +
          `Set KESTRA_USERNAME and KESTRA_PASSWORD if different. ` +
          `Response: ${errorText || 'No error details'}`
        );
      }
      
      // Provide helpful error message for 404 Not Found
      if (response.status === 404) {
        throw new Error(
          `Kestra API resource not found (404). ` +
          `URL: ${url}. ` +
          `This usually means: ` +
          `1. The namespace or flow ID is incorrect, ` +
          `2. The flow doesn't exist in that namespace, ` +
          `3. Your user doesn't have access to that namespace. ` +
          `Response: ${errorText || 'No error details'}`
        );
      }
      
      // Provide helpful error message for 500 Internal Server Error
      if (response.status === 500) {
        // Try to parse error message from Kestra response
        let errorMessage = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorText;
        } catch {
          // Not JSON, use text as-is
        }
        
        // Check for common 500 errors
        if (errorMessage.includes('secret') || errorMessage.includes('API key') || errorMessage.includes('OPENAI')) {
          throw new Error(
            `Kestra workflow execution failed (500) - Missing API Key Secret. ` +
            `The workflow uses {{ secret('OPENAI_API_KEY') }} but the secret is not configured. ` +
            `Fix: Go to Kestra UI (${apiUrl}) → Settings → Secrets → Create secret named "OPENAI_API_KEY". ` +
            `Response: ${errorMessage}`
          );
        }
        
        throw new Error(
          `Kestra workflow execution failed (500). ` +
          `This usually means the workflow has an error. ` +
          `Check Kestra UI (${apiUrl}/ui/flows/${url.split('/flows/')[1] || 'unknown'}) for details. ` +
          `Response: ${errorMessage}`
        );
      }
      
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
 * List all namespaces
 */
export async function listNamespaces(): Promise<string[]> {
  try {
    const response = await kestraRequest('/api/v1/namespaces', {
      method: 'GET',
    });
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('[Kestra] Could not list namespaces:', error);
    return [];
  }
}

/**
 * List flows in a namespace
 */
export async function listFlows(namespace: string): Promise<any[]> {
  try {
    const response = await kestraRequest(`/api/v1/flows/${namespace}`, {
      method: 'GET',
    });
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn(`[Kestra] Could not list flows in namespace "${namespace}":`, error);
    return [];
  }
}

/**
 * Get a flow by namespace and flowId (to verify it exists)
 */
export async function getFlow(
  namespace: string,
  flowId: string
): Promise<any> {
  const endpoint = `/api/v1/flows/${namespace}/${flowId}`;
  
  try {
    const response = await kestraRequest(endpoint, {
      method: 'GET',
    });
    return response.json();
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      // Try to list available flows to help user
      const availableFlows = await listFlows(namespace);
      const flowIds = availableFlows.map((f: any) => f.id).join(', ');
      
      throw new Error(
        `Flow not found: namespace="${namespace}", flowId="${flowId}". ` +
        `Available flows in "${namespace}": ${flowIds || 'none found'}. ` +
        `Please verify the flow exists in Kestra UI or upload it first.`
      );
    }
    throw error;
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
  const flowId = request.workflowId;
  
  // Try to list flows in namespace first to see what API can access
  console.log(`[Kestra] Attempting to execute flow: ${namespace}/${flowId}`);
  try {
    const flows = await listFlows(namespace);
    console.log(`[Kestra] API can see ${flows.length} flows in namespace "${namespace}":`, flows.map((f: any) => f.id));
    
    // Check if our flow is in the list
    const flowExists = flows.some((f: any) => f.id === flowId);
    if (!flowExists) {
      console.warn(`[Kestra] Flow "${flowId}" not found in API-accessible flows. Available flows:`, flows.map((f: any) => f.id));
      console.warn(`[Kestra] This suggests a scope/permission issue - flow exists in UI but not accessible via API`);
    }
  } catch (error) {
    console.warn(`[Kestra] Could not list flows in namespace "${namespace}":`, error);
  }
  
  // Try the standard execution endpoint
  // Note: Some Kestra versions might need /api/v1/executions/trigger/{namespace}/{flowId}
  let endpoint = `/api/v1/executions/${namespace}/${flowId}`;
  
  // Log the exact endpoint being called for debugging
  const apiUrl = getKestraApiUrl();
  const fullUrl = `${apiUrl}${endpoint}`;
  console.log(`[Kestra] Executing workflow: ${fullUrl}`);
  console.log(`[Kestra] Namespace: ${namespace}, FlowId: ${flowId}`);

  const body: any = {};
  if (request.inputs) {
    body.inputs = request.inputs;
  }
  if (request.labels) {
    body.labels = request.labels;
  }

  try {
    const response = await kestraRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return response.json();
  } catch (error) {
    // PERMANENT FIX: Extract actual error from Kestra response for 500 errors
    if (error instanceof Error) {
      // For 500 errors, try to get more details from the error message
      if (error.message.includes('500')) {
        // The error message should already contain Kestra's response from kestraRequest
        // But let's make it more helpful
        const errorDetails = error.message;
        
        // Check for common 500 error causes
        if (errorDetails.includes('secret') || errorDetails.includes('OPENAI_API_KEY')) {
          throw new Error(
            `Kestra workflow execution failed (500) - Missing API Key Secret. ` +
            `The workflow uses {{ secret('OPENAI_API_KEY') }} but the secret is not configured. ` +
            `PERMANENT FIX: ` +
            `1. Make sure .env_encoded file exists in 'kestra-fixed new' directory ` +
            `2. Run: cd "kestra-fixed new" && .\setup-secrets.ps1 ` +
            `3. Restart Kestra: docker-compose restart kestra ` +
            `4. Verify: docker exec claimguardian-kestra printenv SECRET_OPENAI_API_KEY ` +
            `Original error: ${errorDetails}`
          );
        }
        
        // Generic 500 error with helpful message
        throw new Error(
          `Kestra workflow execution failed (500). ` +
          `Check Kestra UI for execution details: ${apiUrl}/ui/executions ` +
          `Or check Kestra logs: docker logs claimguardian-kestra --tail 50 ` +
          `Original error: ${errorDetails}`
        );
      }
      
      // Provide more helpful error message for 404
      if (error.message.includes('404')) {
        throw new Error(
          `Kestra workflow not found via API (404). ` +
          `Namespace: "${namespace}", FlowId: "${flowId}". ` +
          `PERMANENT FIX: ` +
          `1. Verify workflow exists: ${apiUrl}/ui/flows/${namespace}/${flowId} ` +
          `2. Upload workflow if missing: Kestra UI → Flows → Create → Source → Paste YAML ` +
          `3. Check namespace matches exactly (case-sensitive) ` +
          `Full URL attempted: ${fullUrl}`
        );
      }
    }
    
    throw error;
  }
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

