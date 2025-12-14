import { NextRequest, NextResponse } from 'next/server';

/**
 * Download Appeal Letter/Complaint Report
 * 
 * Generates a professional PDF or text file of the appeal letter
 * 
 * @route GET /api/workflow/download
 * @query sessionId - Session ID to retrieve the appeal letter
 * @query format - Format: 'pdf' | 'txt' | 'docx' (default: 'pdf')
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const format = searchParams.get('format') || 'pdf';
    const appealLetter = searchParams.get('appealLetter');

    if (!appealLetter) {
      return NextResponse.json(
        { error: 'Appeal letter content is required' },
        { status: 400 }
      );
    }

    // For now, return as downloadable text file
    // In production, you could use a library like pdfkit or puppeteer for PDF generation
    const filename = `ClaimGuardian_Appeal_Letter_${sessionId || Date.now()}.${format === 'pdf' ? 'txt' : format}`;
    
    // Set headers for file download
    const headers = new Headers();
    headers.set('Content-Type', format === 'pdf' ? 'application/pdf' : 'text/plain');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    
    // For PDF, you would generate actual PDF here
    // For now, return formatted text that can be converted
    const formattedContent = format === 'pdf' 
      ? appealLetter // In production, convert to PDF using pdfkit or similar
      : appealLetter;

    return new NextResponse(formattedContent, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('[Download] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate download file' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to generate and download appeal letter
 * Accepts appeal letter content in request body
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appealLetter, sessionId, format = 'txt' } = body;

    if (!appealLetter) {
      return NextResponse.json(
        { error: 'Appeal letter content is required' },
        { status: 400 }
      );
    }

    const filename = `ClaimGuardian_Appeal_Letter_${sessionId || Date.now()}.${format}`;
    
    const headers = new Headers();
    headers.set('Content-Type', format === 'pdf' ? 'application/pdf' : 'text/plain');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    
    return new NextResponse(appealLetter, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('[Download] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate download file' },
      { status: 500 }
    );
  }
}
