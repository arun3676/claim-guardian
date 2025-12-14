'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useKestraExecution } from '../hooks/useKestraExecution';

/**
 * Supported file types for bill uploads
 * Matches the types defined in blob-storage.ts
 */
const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/tiff',
];

/**
 * Maximum file size in bytes (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface UploadedBill {
  blobUrl: string;
  blobId: string;
  fileName: string;
  size: number;
  mimeType: string;
}

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
/**
 * KestraWorkflowTrigger Component
 * 
 * VERCEL INTEGRATION:
 * - Supports file uploads via Vercel Blob storage
 * - Passes blob URLs to Kestra workflows for processing
 * - Shows upload progress and file preview
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
  
  // File upload state - Vercel Blob integration
  const [uploadedBill, setUploadedBill] = useState<UploadedBill | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle file selection and upload to Vercel Blob
   */
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
      setUploadError(`Unsupported file type: ${file.type}. Please upload PDF or image files.`);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 10MB.`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workflowId', workflowId);

      setUploadProgress(30);

      const response = await fetch('/api/bills/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(70);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();
      setUploadProgress(100);

      setUploadedBill({
        blobUrl: result.blobUrl,
        blobId: result.blobId,
        fileName: result.fileName,
        size: result.size,
        mimeType: result.mimeType,
      });

      console.log('Bill uploaded to Vercel Blob:', result.blobUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [workflowId]);

  /**
   * Clear the uploaded file
   */
  const clearUploadedFile = useCallback(() => {
    setUploadedBill(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleExecute = async () => {
    if (!billData && !uploadedBill) {
      onError?.('Bill data or uploaded file is required');
      return;
    }

    try {
      // Prepare workflow inputs
      const inputs: Record<string, any> = {};
      
      if (billData) {
        inputs.bill_data = billData;
      }
      
      // Include Vercel Blob URL if file was uploaded
      if (uploadedBill) {
        inputs.bill_file_url = uploadedBill.blobUrl;
        inputs.bill_file_name = uploadedBill.fileName;
        inputs.bill_file_type = uploadedBill.mimeType;
      }

      // Execute workflow
      await execute({
        workflowId,
        namespace,
        inputs,
        labels: {
          source: 'frontend',
          component: 'KestraWorkflowTrigger',
          has_blob_file: uploadedBill ? 'true' : 'false',
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

      {/* File Upload Section - Vercel Blob Integration */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold mb-2 text-blue-800 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          Upload Bill (Vercel Blob)
        </h3>
        
        {!uploadedBill ? (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.tiff"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Supported: PDF, JPEG, PNG, WebP, TIFF (max 10MB)
            </p>
            
            {isUploading && (
              <div className="mt-2">
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">{uploadProgress}%</span>
                </div>
                <p className="text-sm text-blue-600 mt-1">Uploading to Vercel Blob...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-white rounded border border-blue-300">
            <div className="flex items-center">
              <svg className="w-8 h-8 text-blue-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium text-gray-900">{uploadedBill.fileName}</p>
                <p className="text-xs text-gray-500">
                  {(uploadedBill.size / 1024).toFixed(1)} KB • {uploadedBill.mimeType}
                </p>
              </div>
            </div>
            <button
              onClick={clearUploadedFile}
              className="text-red-500 hover:text-red-700 p-1"
              title="Remove file"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
        
        {uploadError && (
          <p className="text-sm text-red-600 mt-2">{uploadError}</p>
        )}
      </div>

      {/* Execute Button */}
      <button
        onClick={handleExecute}
        disabled={isLoading || isPolling || isUploading || (!billData && !uploadedBill)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed mb-4"
      >
        {isLoading
          ? 'Executing...'
          : isPolling
          ? 'Monitoring Execution...'
          : isUploading
          ? 'Uploading...'
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

