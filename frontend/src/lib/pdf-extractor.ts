/**
 * PDF Extractor Module
 * 
 * Extracts text content from PDF files for medical billing analysis.
 * Uses pdf-parse library for text extraction.
 * 
 * VERCEL INTEGRATION:
 * - Works with Vercel Blob URLs for PDF storage
 * - Optimized for serverless execution
 */

// Note: pdf-parse is a Node.js library, so this runs server-side only
// Using require for CommonJS compatibility
const pdf = require('pdf-parse');

export interface PDFExtractionResult {
  success: boolean;
  text: string;
  pageCount: number;
  metadata?: {
    title?: string;
    author?: string;
    creationDate?: string;
  };
  error?: string;
}

/**
 * Extract text from a PDF buffer
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<PDFExtractionResult> {
  try {
    const data = await pdf(pdfBuffer);
    
    return {
      success: true,
      text: data.text,
      pageCount: data.numpages,
      metadata: {
        title: data.info?.Title,
        author: data.info?.Author,
        creationDate: data.info?.CreationDate,
      },
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    return {
      success: false,
      text: '',
      pageCount: 0,
      error: error instanceof Error ? error.message : 'Failed to extract PDF text',
    };
  }
}

/**
 * Extract text from a PDF URL (e.g., Vercel Blob URL)
 */
export async function extractTextFromPDFUrl(pdfUrl: string): Promise<PDFExtractionResult> {
  try {
    const response = await fetch(pdfUrl);
    
    if (!response.ok) {
      return {
        success: false,
        text: '',
        pageCount: 0,
        error: `Failed to fetch PDF: ${response.status} ${response.statusText}`,
      };
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    return extractTextFromPDF(buffer);
  } catch (error) {
    console.error('PDF fetch error:', error);
    return {
      success: false,
      text: '',
      pageCount: 0,
      error: error instanceof Error ? error.message : 'Failed to fetch PDF',
    };
  }
}

/**
 * Clean extracted text for better parsing
 */
export function cleanExtractedText(text: string): string {
  return text
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove excessive newlines
    .replace(/\n{3,}/g, '\n\n')
    // Trim each line
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

