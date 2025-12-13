'use client';

import React, { useState } from 'react';
import { useKestraExecution } from '../hooks/useKestraExecution';

interface KestraWorkflowTriggerProps {
  workflowId?: string;
  namespace?: string;
  billData?: {
    patient?: { name?: string; id?: string };
    procedures: Array<{
      cpt_code?: string;
      description: string;
      billed_amount: number;
      date?: string;
    }>;
    diagnoses?: Array<{
      icd10_code?: string;
      description: string;
    }>;
    total_billed: number;
    insurance?: {
      company?: string;
      policy_number?: string;
    };
  };
  onComplete?: (results: any) => void;
  onError?: (error: string) => void;
}

/**
 * KestraWorkflowTrigger Component
 * 
 * React component for triggering and monitoring Kestra workflow executions
 * 
 * @example
 * ```tsx
 * <KestraWorkflowTrigger
 *   workflowId="claimguardian-ai-agent-summarizer"
 *   billData={{
 *     procedures: [{ description: "MRI brain", billed_amount: 5000 }],
 *     total_billed: 5000
 *   }}
 *   onComplete={(results) => console.log('Analysis complete:', results)}
 * />
 * ```
 */
export default function KestraWorkflowTrigger({
  workflowId = 'claimguardian-ai-agent-summarizer',
  namespace = 'claimguardian',
  billData,
  onComplete,
  onError,
}: KestraWorkflowTriggerProps) {
  const {
    execute,
    execution,
    results,
    isLoading,
    error,
    pollUntilComplete,
  } = useKestraExecution();

  const [isPolling, setIsPolling] = useState(false);

  const handleExecute = async () => {
    if (!billData) {
      onError?.('Bill data is required');
      return;
    }

    try {
      // Execute workflow
      await execute({
        workflowId,
        namespace,
        inputs: {
          bill_data: billData,
        },
        labels: {
          source: 'frontend',
          component: 'KestraWorkflowTrigger',
        },
      });

      if (execution?.id) {
        // Start polling for completion
        setIsPolling(true);
        await pollUntilComplete(execution.id, {
          interval: 2000,
          maxAttempts: 60,
          onProgress: (exec) => {
            console.log('Execution progress:', exec.state?.current);
          },
        });
        setIsPolling(false);

        if (results) {
          onComplete?.(results);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Execution failed';
      onError?.(errorMessage);
      setIsPolling(false);
    }
  };

  const getStateColor = (state?: string) => {
    switch (state) {
      case 'SUCCESS':
        return 'text-green-600';
      case 'FAILED':
        return 'text-red-600';
      case 'RUNNING':
        return 'text-blue-600';
      case 'WARNING':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStateIcon = (state?: string) => {
    switch (state) {
      case 'SUCCESS':
        return '✅';
      case 'FAILED':
        return '❌';
      case 'RUNNING':
        return '⏳';
      case 'WARNING':
        return '⚠️';
      default:
        return '📋';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Kestra Workflow Execution</h2>

      {/* Workflow Info */}
      <div className="mb-4 p-4 bg-gray-50 rounded">
        <p className="text-sm text-gray-600">
          <strong>Workflow:</strong> {workflowId}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Namespace:</strong> {namespace}
        </p>
      </div>

      {/* Execute Button */}
      <button
        onClick={handleExecute}
        disabled={isLoading || isPolling || !billData}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed mb-4"
      >
        {isLoading
          ? 'Executing...'
          : isPolling
          ? 'Monitoring Execution...'
          : 'Execute Workflow'}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800 font-semibold">Error:</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Execution Status */}
      {execution && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Execution Status:</span>
            <span className={`font-bold ${getStateColor(execution.state?.current)}`}>
              {getStateIcon(execution.state?.current)} {execution.state?.current}
            </span>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <strong>Execution ID:</strong> {execution.id}
            </p>
            {execution.startDate && (
              <p>
                <strong>Started:</strong>{' '}
                {new Date(execution.startDate).toLocaleString()}
              </p>
            )}
            {execution.endDate && (
              <p>
                <strong>Completed:</strong>{' '}
                {new Date(execution.endDate).toLocaleString()}
              </p>
            )}
            {execution.duration && (
              <p>
                <strong>Duration:</strong> {execution.duration}ms
              </p>
            )}
          </div>
        </div>
      )}

      {/* Results Display */}
      {results && results.outputs && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="font-semibold mb-2 text-green-800">Results:</h3>
          <pre className="text-xs bg-white p-3 rounded overflow-auto max-h-96">
            {JSON.stringify(results.outputs, null, 2)}
          </pre>
        </div>
      )}

      {/* Task Results */}
      {results && results.tasks && results.tasks.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded">
          <h3 className="font-semibold mb-2">Task Results:</h3>
          <div className="space-y-2">
            {results.tasks.map((task, index) => (
              <div key={index} className="text-sm">
                <span className="font-medium">{task.id}:</span>{' '}
                <span className={getStateColor(task.state?.current)}>
                  {task.state?.current}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

