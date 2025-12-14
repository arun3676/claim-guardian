/**
 * Bill Upload API Route
 * 
 * Handles medical bill file uploads using Vercel Blob storage.
 * Uploaded files can be passed to Kestra workflows for analysis.
 * 
 * VERCEL INTEGRATION:
 * - Uses Vercel Blob for secure file storage
 * - Returns public URLs that can be used in Kestra workflows
 * - Logs uploads for Vercel Observability
 * 
 * RUNTIME: Node.js (not Edge)
 * - File uploads require multipart form parsing which works better in Node.js
 * - Blob operations may take longer than Edge timeout limits
 * - No streaming required for upload responses
 * 
 * @route POST /api/bills/upload
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  uploadBillFile,
  validateFile,
  SUPPORTED_FILE_TYPES,
  MAX_FILE_SIZE,
  type UploadBillOptions,
} from '@/lib/blob-storage';

/**
 * POST /api/bills/upload
 * 
 * Upload a medical bill file to Vercel Blob storage
 * 
 * Request: multipart/form-data with:
 * - file: File (required) - The bill file to upload
 * - sessionId: string (optional) - Session ID for tracking
 * - description: string (optional) - User description
 * - workflowId: string (optional) - Associated Kestra workflow
 * 
 * Response:
 * {
 *   success: boolean
 *   blobUrl: string - Public URL to access the file
 *   blobId: string - Unique blob identifier
 *   size: number - File size in bytes
 *   mimeType: string - MIME type
 *   fileName: string - Original filename
 *   metadata: object - Full upload metadata
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const sessionId = formData.get('sessionId') as string | null;
    const description = formData.get('description') as string | null;
    const workflowId = formData.get('workflowId') as string | null;

    // Validate file presence
    if (!file) {
      return NextResponse.json(
        {
          error: 'No file provided',
          message: 'Please include a file in the request',
          supportedTypes: SUPPORTED_FILE_TYPES,
          maxSize: `${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      );
    }

    // Validate file type and size
    const validation = validateFile(file, file.name);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid file',
          message: validation.error,
          supportedTypes: SUPPORTED_FILE_TYPES,
          maxSize: `${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      );
    }

    // Prepare upload options
    const options: UploadBillOptions = {
      sessionId: sessionId || undefined,
      description: description || undefined,
      workflowId: workflowId || undefined,
    };

    // Upload to Vercel Blob
    const result = await uploadBillFile(file, file.name, options);

    const latencyMs = Date.now() - startTime;

    // Log success for Vercel Observability
    console.log(JSON.stringify({
      type: 'bill_upload_success',
      blobUrl: result.blobUrl,
      fileName: result.fileName,
      size: result.size,
      mimeType: result.mimeType,
      sessionId: sessionId || 'anonymous',
      latencyMs,
      timestamp: new Date().toISOString(),
    }));

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    const latencyMs = Date.now() - startTime;

    // Log error for Vercel Observability
    console.error(JSON.stringify({
      type: 'bill_upload_error',
      error: error instanceof Error ? error.message : 'Unknown error',
      latencyMs,
      timestamp: new Date().toISOString(),
    }));

    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('BLOB_READ_WRITE_TOKEN')) {
        return NextResponse.json(
          {
            error: 'Storage not configured',
            message: 'Please configure BLOB_READ_WRITE_TOKEN environment variable',
          },
          { status: 500 }
        );
      }

      if (error.message.includes('size') || error.message.includes('type')) {
        return NextResponse.json(
          {
            error: 'Invalid file',
            message: error.message,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: 'Upload failed',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Unknown error',
        message: 'An unexpected error occurred during upload',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bills/upload
 * 
 * Return upload endpoint information
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/bills/upload',
    method: 'POST',
    contentType: 'multipart/form-data',
    fields: {
      file: {
        type: 'File',
        required: true,
        description: 'The medical bill file to upload',
      },
      sessionId: {
        type: 'string',
        required: false,
        description: 'Session ID for tracking',
      },
      description: {
        type: 'string',
        required: false,
        description: 'User description of the bill',
      },
      workflowId: {
        type: 'string',
        required: false,
        description: 'Associated Kestra workflow ID',
      },
    },
    supportedTypes: SUPPORTED_FILE_TYPES,
    maxSize: `${MAX_FILE_SIZE / 1024 / 1024}MB`,
  });
}

