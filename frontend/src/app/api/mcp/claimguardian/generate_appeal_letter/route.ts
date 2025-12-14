import { NextRequest, NextResponse } from 'next/server';

interface AppealLetterRequest {
  patient_name: string;
  claim_number: string;
  denial_reason: string;
  procedure: string;
  supporting_facts: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AppealLetterRequest = await request.json();
    const { patient_name, claim_number, denial_reason, procedure, supporting_facts } = body;

    // Validate required fields
    if (!patient_name || !claim_number || !denial_reason || !procedure || !supporting_facts) {
      return NextResponse.json(
        { error: 'All fields are required: patient_name, claim_number, denial_reason, procedure, supporting_facts' },
        { status: 400 }
      );
    }

    // Generate appeal letter content
    const appealLetter = generateAppealLetter({
      patient_name,
      claim_number,
      denial_reason,
      procedure,
      supporting_facts
    });

    return NextResponse.json({
      success: true,
      appeal_letter: appealLetter,
      claim_number: claim_number,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error during appeal letter generation' },
      { status: 500 }
    );
  }
}

function generateAppealLetter(params: AppealLetterRequest): string {
  const { patient_name, claim_number, denial_reason, procedure, supporting_facts } = params;

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
[Your Name]
[Your Address]
[City, State, ZIP Code]
[Email Address]
[Phone Number]
${today}

Insurance Appeals Department
[Insurance Company Name]
[Insurance Company Address]
[City, State, ZIP Code]

Re: Appeal of Denied Claim - Claim Number: ${claim_number}
    Patient: ${patient_name}

Dear Sir or Madam:

I am writing to formally appeal the denial of the above-referenced claim for ${procedure}. This letter serves as an official appeal pursuant to your internal appeal procedures and applicable state insurance regulations.

CLAIM DETAILS:
- Claim Number: ${claim_number}
- Patient: ${patient_name}
- Procedure: ${procedure}
- Denial Reason: ${denial_reason}

MEDICAL NECESSITY AND SUPPORTING FACTS:
${supporting_facts}

I request that you reconsider this claim and provide coverage for the above-mentioned procedure. The procedure was medically necessary and appropriate for the patient's condition. The charges were reasonable and consistent with Medicare rates for similar procedures.

Please provide written notification of your decision within the timeframe required by law. If additional information is needed to process this appeal, please contact me at your earliest convenience.

Thank you for your attention to this matter.

Sincerely,

[Your Name]
[Your Insurance ID/Member Number]
[Relationship to Patient]
[Phone Number]
[Email Address]

Enclosures:
- Original Claim Documentation
- Medical Records
- Any Additional Supporting Documentation
`;
}
