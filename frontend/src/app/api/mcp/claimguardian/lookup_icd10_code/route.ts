import { NextRequest, NextResponse } from 'next/server';

// Mock ICD-10 codes database - in production this would use actual MCP tool
const ICD10_DATABASE: Record<string, { description: string; category: string }> = {
  'E11.9': {
    description: 'Type 2 diabetes mellitus without complications',
    category: 'Endocrine, Nutritional and Metabolic Diseases'
  },
  'I10': {
    description: 'Essential (primary) hypertension',
    category: 'Circulatory System Diseases'
  },
  'J44.9': {
    description: 'Chronic obstructive pulmonary disease, unspecified',
    category: 'Respiratory System Diseases'
  },
  'J45.909': {
    description: 'Unspecified asthma, uncomplicated',
    category: 'Respiratory System Diseases'
  },
  'R07.9': {
    description: 'Chest pain, unspecified',
    category: 'Symptoms, Signs and Abnormal Clinical Findings'
  },
  'M54.5': {
    description: 'Low back pain',
    category: 'Musculoskeletal System Diseases'
  },
  'F41.9': {
    description: 'Anxiety disorder, unspecified',
    category: 'Mental and Behavioral Disorders'
  },
  'F32.9': {
    description: 'Major depressive disorder, single episode, unspecified',
    category: 'Mental and Behavioral Disorders'
  },
  'I50.9': {
    description: 'Heart failure, unspecified',
    category: 'Circulatory System Diseases'
  },
  'I48.91': {
    description: 'Unspecified atrial fibrillation',
    category: 'Circulatory System Diseases'
  }
};

// Reverse lookup for diagnosis names
const DIAGNOSIS_TO_CODE: Record<string, string> = {
  'diabetes': 'E11.9',
  'type 2 diabetes': 'E11.9',
  'hypertension': 'I10',
  'high blood pressure': 'I10',
  'copd': 'J44.9',
  'chronic obstructive pulmonary disease': 'J44.9',
  'asthma': 'J45.909',
  'chest pain': 'R07.9',
  'back pain': 'M54.5',
  'low back pain': 'M54.5',
  'anxiety': 'F41.9',
  'depression': 'F32.9',
  'heart failure': 'I50.9',
  'atrial fibrillation': 'I48.91',
  'afib': 'I48.91'
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { diagnosis } = body;

    if (!diagnosis || typeof diagnosis !== 'string') {
      return NextResponse.json(
        { error: 'Diagnosis is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate ICD-10 code format or look up by diagnosis name
    const icd10Regex = /^[A-Z][0-9]{2}\.?[0-9A-Z]{0,4}$/;
    let code: string | undefined;
    let info: { description: string; category: string } | undefined;

    if (icd10Regex.test(diagnosis)) {
      // Direct ICD-10 code lookup
      code = diagnosis;
      info = ICD10_DATABASE[code];
    } else {
      // Look up by diagnosis name
      const normalizedDiagnosis = diagnosis.toLowerCase().trim();
      code = DIAGNOSIS_TO_CODE[normalizedDiagnosis];

      if (code) {
        info = ICD10_DATABASE[code];
      }
    }

    if (!info) {
      // Return a generic description for unknown codes/diagnoses
      return NextResponse.json({
        icd10_code: diagnosis,
        description: `Medical condition: ${diagnosis}`,
        category: 'Unknown'
      });
    }

    return NextResponse.json({
      icd10_code: code,
      description: info.description,
      category: info.category
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error during ICD-10 lookup' },
      { status: 500 }
    );
  }
}
