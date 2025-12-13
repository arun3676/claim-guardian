/**
 * Bill Extract API Route
 * 
 * Extracts billing data from uploaded PDF files.
 * Works with Vercel Blob URLs or direct file uploads.
 * 
 * VERCEL INTEGRATION:
 * - Accepts Vercel Blob URLs for PDF processing
 * - Logs extraction for Vercel Observability
 * - Returns structured data for MCP and Kestra integration
 * 
 * CLINE MCP INTEGRATION:
 * - Returns data in format compatible with detect_billing_errors tool
 * - Includes diagnosis codes for validate_insurance_claim tool
 * 
 * @route POST /api/bills/extract
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPDF, extractTextFromPDFUrl, cleanExtractedText } from '@/lib/pdf-extractor';
import { parseBillingText, validateBillingData, toMCPFormat, toKestraFormat } from '@/lib/billing-parser';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const contentType = request.headers.get('content-type') || '';
    
    let pdfText = '';
    let extractionResult;
    
    if (contentType.includes('multipart/form-data')) {
      // Handle direct file upload
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      
      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }
      
      if (!file.type.includes('pdf')) {
        return NextResponse.json(
          { error: 'File must be a PDF' },
          { status: 400 }
        );
      }
      
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      extractionResult = await extractTextFromPDF(buffer);
      
    } else if (contentType.includes('application/json')) {
      // Handle Blob URL
      const body = await request.json();
      const { blobUrl, pdfUrl } = body;
      
      const url = blobUrl || pdfUrl;
      if (!url) {
        return NextResponse.json(
          { error: 'blobUrl or pdfUrl is required' },
          { status: 400 }
        );
      }
      
      extractionResult = await extractTextFromPDFUrl(url);
      
    } else {
      return NextResponse.json(
        { error: 'Content-Type must be multipart/form-data or application/json' },
        { status: 400 }
      );
    }
    
    if (!extractionResult.success) {
      console.error(JSON.stringify({
        type: 'bill_extract_error',
        error: extractionResult.error,
        timestamp: new Date().toISOString(),
      }));
      
      return NextResponse.json(
        {
          error: 'PDF extraction failed',
          message: extractionResult.error,
        },
        { status: 422 }
      );
    }
    
    // Clean and parse the extracted text
    pdfText = cleanExtractedText(extractionResult.text);
    const parsedData = parseBillingText(pdfText);
    const validation = validateBillingData(parsedData);
    
    const latencyMs = Date.now() - startTime;
    
    // Log for Vercel Observability
    console.log(JSON.stringify({
      type: 'bill_extract_success',
      pageCount: extractionResult.pageCount,
      procedureCount: parsedData.procedures.length,
      diagnosisCount: parsedData.diagnosisCodes.length,
      totalBilled: parsedData.totalBilled,
      validationErrors: validation.errors.length,
      latencyMs,
      timestamp: new Date().toISOString(),
    }));
    
    // Return comprehensive response
    return NextResponse.json({
      success: true,
      extraction: {
        pageCount: extractionResult.pageCount,
        metadata: extractionResult.metadata,
      },
      billingData: {
        patientInfo: parsedData.patientInfo,
        providerInfo: parsedData.providerInfo,
        serviceDate: parsedData.serviceDate,
        procedures: parsedData.procedures,
        diagnosisCodes: parsedData.diagnosisCodes,
        totalBilled: parsedData.totalBilled,
        patientResponsibility: parsedData.patientResponsibility,
        insurancePaid: parsedData.insurancePaid,
      },
      validation: {
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
      },
      // Pre-formatted for integration
      mcpFormat: toMCPFormat(parsedData),
      kestraFormat: toKestraFormat(parsedData),
      // Include raw text for debugging
      rawTextPreview: pdfText.substring(0, 500) + (pdfText.length > 500 ? '...' : ''),
    });
    
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    
    console.error(JSON.stringify({
      type: 'bill_extract_error',
      error: error instanceof Error ? error.message : 'Unknown error',
      latencyMs,
      timestamp: new Date().toISOString(),
    }));
    
    return NextResponse.json(
      {
        error: 'Extraction failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bills/extract
 * 
 * Return endpoint information
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/bills/extract',
    description: 'Extract billing data from PDF files',
    methods: {
      POST: {
        'multipart/form-data': {
          fields: {
            file: 'PDF file to extract',
          },
        },
        'application/json': {
          fields: {
            blobUrl: 'Vercel Blob URL of uploaded PDF',
            pdfUrl: 'Alternative: any accessible PDF URL',
          },
        },
      },
    },
    response: {
      billingData: 'Structured billing information',
      mcpFormat: 'Data formatted for Cline MCP tools',
      kestraFormat: 'Data formatted for Kestra workflow',
    },
  });
}

