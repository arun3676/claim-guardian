/**
 * Vercel Blob Storage Integration
 * 
 * This module provides file upload functionality for medical bills using Vercel Blob.
 * Uploaded files are stored securely and their URLs can be passed to Kestra workflows.
 * 
 * VERCEL INTEGRATION:
 * - Uses Vercel Blob for serverless file storage
 * - Files are stored with public URLs for workflow access
 * - Supports PDFs, images, and document formats
 * - Metadata is stored with each blob for tracking
 * 
 * @module blob-storage
 */

import { put, del, list, head, type PutBlobResult } from '@vercel/blob';

/**
 * Get the Vercel Blob token from environment variables
 * Throws an error if the token is not configured
 */
function getBlobToken(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  
  if (!token) {
    throw new Error(
      'BLOB_READ_WRITE_TOKEN environment variable is not set. ' +
      'Please configure it in Vercel Dashboard → Settings → Environment Variables. ' +
      'For local development, add it to .env.local file.'
    );
  }
  
  return token;
}

/**
 * Supported file types for medical bill uploads
 */
export const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/tiff',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Metadata stored with uploaded bills
 */
export interface BillUploadMetadata {
  /** Original filename */
  fileName: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  size: number;
  /** Upload timestamp */
  uploadedAt: string;
  /** Session ID for tracking */
  sessionId?: string;
  /** User-provided description */
  description?: string;
  /** Associated workflow ID */
  workflowId?: string;
}

/**
 * Result of a bill upload operation
 */
export interface BillUploadResult {
  /** Success status */
  success: boolean;
  /** Public URL to access the file */
  blobUrl: string;
  /** Unique blob identifier (pathname) */
  blobId: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  mimeType: string;
  /** Original filename */
  fileName: string;
  /** Full metadata */
  metadata: BillUploadMetadata;
}

/**
 * Options for uploading a bill
 */
export interface UploadBillOptions {
  /** Session ID for tracking */
  sessionId?: string;
  /** User-provided description */
  description?: string;
  /** Associated workflow ID */
  workflowId?: string;
  /** Custom path prefix (defaults to 'bills/') */
  pathPrefix?: string;
}

/**
 * Validate file type and size
 * 
 * @param file - File or Blob to validate
 * @param fileName - Original filename
 * @returns Validation result with error message if invalid
 */
export function validateFile(
  file: File | Blob,
  fileName: string
): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check file type
  const mimeType = file.type || 'application/octet-stream';
  if (!SUPPORTED_FILE_TYPES.includes(mimeType as any)) {
    return {
      valid: false,
      error: `File type ${mimeType} is not supported. Supported types: PDF, JPEG, PNG, WebP, TIFF, DOC, DOCX`,
    };
  }

  // Check for empty file
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty',
    };
  }

  return { valid: true };
}

/**
 * Generate a unique pathname for the blob
 * 
 * @param fileName - Original filename
 * @param pathPrefix - Path prefix (defaults to 'bills/')
 * @returns Unique pathname
 */
function generateBlobPath(fileName: string, pathPrefix: string = 'bills/'): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 10);
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${pathPrefix}${timestamp}-${randomId}-${sanitizedFileName}`;
}

/**
 * Upload a medical bill file to Vercel Blob
 * 
 * @param file - File or Blob to upload
 * @param fileName - Original filename
 * @param options - Upload options
 * @returns Upload result with blob URL and metadata
 */
export async function uploadBillFile(
  file: File | Blob,
  fileName: string,
  options: UploadBillOptions = {}
): Promise<BillUploadResult> {
  // Validate the file
  const validation = validateFile(file, fileName);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const mimeType = file.type || 'application/octet-stream';
  const pathPrefix = options.pathPrefix || 'bills/';
  const blobPath = generateBlobPath(fileName, pathPrefix);

  // Create metadata
  const metadata: BillUploadMetadata = {
    fileName,
    mimeType,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    sessionId: options.sessionId,
    description: options.description,
    workflowId: options.workflowId,
  };

  try {
    // Get token from environment variable
    const token = getBlobToken();

    // Upload to Vercel Blob
    const blob: PutBlobResult = await put(blobPath, file, {
      access: 'public',
      contentType: mimeType,
      token: token, // Explicitly pass token to ensure it's used
      // Store metadata in the blob's custom metadata
      // Note: Vercel Blob doesn't support custom metadata in the put call,
      // so we'll include essential info in the pathname and return full metadata
    });

    // Log for Vercel Observability
    console.log(JSON.stringify({
      type: 'blob_upload',
      blobUrl: blob.url,
      blobPath: blob.pathname,
      fileName,
      mimeType,
      size: file.size,
      sessionId: options.sessionId || 'anonymous',
      timestamp: new Date().toISOString(),
    }));

    return {
      success: true,
      blobUrl: blob.url,
      blobId: blob.pathname,
      size: file.size,
      mimeType,
      fileName,
      metadata,
    };
  } catch (error) {
    // Log error for Vercel Observability
    console.error(JSON.stringify({
      type: 'blob_upload_error',
      error: error instanceof Error ? error.message : 'Unknown error',
      fileName,
      size: file.size,
      sessionId: options.sessionId || 'anonymous',
      timestamp: new Date().toISOString(),
    }));

    throw error;
  }
}

/**
 * Delete a bill file from Vercel Blob
 * 
 * @param blobUrl - URL of the blob to delete
 */
export async function deleteBillFile(blobUrl: string): Promise<void> {
  try {
    const token = getBlobToken();
    await del(blobUrl, { token });
    
    console.log(JSON.stringify({
      type: 'blob_delete',
      blobUrl,
      timestamp: new Date().toISOString(),
    }));
  } catch (error) {
    console.error(JSON.stringify({
      type: 'blob_delete_error',
      blobUrl,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }));
    
    throw error;
  }
}

/**
 * Get information about a stored bill file
 * 
 * @param blobUrl - URL of the blob
 * @returns Blob metadata or null if not found
 */
export async function getBillFileInfo(blobUrl: string): Promise<{
  url: string;
  pathname: string;
  contentType: string;
  size: number;
  uploadedAt: Date;
} | null> {
  try {
    const token = getBlobToken();
    const info = await head(blobUrl, { token });
    return info;
  } catch (error) {
    // Return null if blob not found
    return null;
  }
}

/**
 * List all bill files in storage
 * 
 * @param prefix - Path prefix to filter by (defaults to 'bills/')
 * @param limit - Maximum number of results
 * @returns List of blob information
 */
export async function listBillFiles(
  prefix: string = 'bills/',
  limit: number = 100
): Promise<Array<{
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
}>> {
  try {
    const token = getBlobToken();
    const { blobs } = await list({
      prefix,
      limit,
      token,
    });
    
    return blobs;
  } catch (error) {
    console.error(JSON.stringify({
      type: 'blob_list_error',
      prefix,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }));
    
    return [];
  }
}

/**
 * Parse a blob URL to extract the blob ID (pathname)
 * 
 * @param blobUrl - Full blob URL
 * @returns Blob ID or null if invalid URL
 */
export function extractBlobId(blobUrl: string): string | null {
  try {
    const url = new URL(blobUrl);
    return url.pathname.slice(1); // Remove leading slash
  } catch {
    return null;
  }
}

