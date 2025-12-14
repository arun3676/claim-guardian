import { NextRequest, NextResponse } from 'next/server';

// Mock CPT code database - in production this would use actual MCP tool
const CPT_DATABASE: Record<string, { description: string; category: string }> = {
  '99214': {
    description: 'Office or other outpatient visit for the evaluation and management of an established patient, which requires at least 2 of these 3 key components: a detailed history; a detailed examination; medical decision making of moderate complexity',
    category: 'Evaluation and Management'
  },
  '85025': {
    description: 'Blood count; complete (CBC), automated (Hgb, Hct, RBC, WBC and platelet count) and automated differential WBC count',
    category: 'Pathology and Laboratory'
  },
  '71045': {
    description: 'Radiologic examination, chest; single view',
    category: 'Radiology'
  },
  '99213': {
    description: 'Office or other outpatient visit for the evaluation and management of an established patient, which requires at least 2 of these 3 key components: an expanded problem focused history; an expanded problem focused examination; straightforward medical decision making',
    category: 'Evaluation and Management'
  },
  '93000': {
    description: 'Electrocardiogram, routine ECG with at least 12 leads; with interpretation and report',
    category: 'Cardiology'
  },
  '90686': {
    description: 'Influenza virus vaccine, quadrivalent (IIV4), split virus, preservative free, 0.5 mL dosage, for intramuscular use',
    category: 'Medicine'
  },
  '80053': {
    description: 'Comprehensive metabolic panel',
    category: 'Pathology and Laboratory'
  },
  '83735': {
    description: 'Magnesium level',
    category: 'Pathology and Laboratory'
  },
  '84443': {
    description: 'Thyroid stimulating hormone (TSH)',
    category: 'Pathology and Laboratory'
  },
  '85610': {
    description: 'Prothrombin time',
    category: 'Pathology and Laboratory'
  }
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

    // Look up the CPT code (remove any modifier for lookup)
    const baseCode = procedure.split('-')[0];
    const cptInfo = CPT_DATABASE[baseCode];

    if (!cptInfo) {
      // Return a generic description for unknown codes
      return NextResponse.json({
        code: procedure,
        description: `Medical procedure ${procedure}`,
        category: 'Unknown'
      });
    }

    return NextResponse.json({
      code: procedure,
      description: cptInfo.description,
      category: cptInfo.category
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error during CPT lookup' },
      { status: 500 }
    );
  }
}
