import { NextRequest, NextResponse } from 'next/server';

// Mock Medicare rates database - in production this would use actual MCP tool
const MEDICARE_RATES: Record<string, number> = {
  '99214': 110.00,  // Office visit, established patient, moderate complexity
  '85025': 25.00,   // Complete blood count
  '71045': 140.00,  // Chest X-ray, single view
  '99213': 76.00,   // Office visit, established patient, straightforward
  '93000': 25.00,   // Electrocardiogram
  '90686': 150.00,  // Flu vaccine
  '80053': 45.00,   // Comprehensive metabolic panel
  '83735': 15.00,   // Magnesium level
  '84443': 30.00,   // Thyroid stimulating hormone
  '85610': 8.00     // Prothrombin time
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { procedure } = body;

    if (!procedure || typeof procedure !== 'string') {
      return NextResponse.json(
        { error: 'Procedure code is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate CPT code format
    const cptRegex = /^[0-9]{5}(-[A-Z0-9]{2})?$/;
    if (!cptRegex.test(procedure)) {
      return NextResponse.json(
        { error: `Invalid CPT code format: ${procedure}` },
        { status: 400 }
      );
    }

    // Look up the Medicare rate (remove any modifier for lookup)
    const baseCode = procedure.split('-')[0];
    const rate = MEDICARE_RATES[baseCode];

    if (rate === undefined) {
      return NextResponse.json(
        { error: `No Medicare rate found for CPT code: ${procedure}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      code: procedure,
      rate: rate,
      source: 'Mock Medicare Rate Database',
      lastUpdated: '2024-01-01' // Mock date
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error during Medicare rate calculation' },
      { status: 500 }
    );
  }
}
