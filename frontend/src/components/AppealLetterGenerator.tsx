'use client';

import React, { useState, useCallback } from 'react';

// TypeScript interfaces for the component
interface BillingError {
  cptCode: string;
  billedAmount: number;
  medicareRate: number;
  overchargePercentage: number;
  procedure?: string;
  diagnosisCode?: string;
}

interface AppealLetterGeneratorProps {
  patientId: string;
  billingErrors: BillingError[];
}

interface AppealLetter {
  content: string;
  referenceNumber: string;
  generatedAt: string;
}

const AppealLetterGenerator: React.FC<AppealLetterGeneratorProps> = ({
  patientId,
  billingErrors
}) => {
  const [appealLetter, setAppealLetter] = useState<AppealLetter | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Generate reference number (HIPAA compliant - no patient name)
  const generateReferenceNumber = useCallback((): string => {
    const timestamp = Date.now();
    const shortPatientId = patientId.substring(0, 8);
    return `APPEAL_${shortPatientId}_${timestamp}`;
  }, [patientId]);

  // Generate appeal letter content
  const generateAppealLetter = useCallback(async (): Promise<AppealLetter> => {
    const referenceNumber = generateReferenceNumber();
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Calculate total overcharge
    const totalOvercharge = billingErrors.reduce((sum, error) =>
      sum + (error.billedAmount - error.medicareRate), 0
    );

    // Try to use MCP tool first
    try {
      const mcpResponse = await fetch('/api/mcp/claimguardian/generate_appeal_letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_name: 'Patient', // Generic placeholder for HIPAA compliance
          claim_number: referenceNumber,
          denial_reason: `Overcharges totaling $${totalOvercharge.toFixed(2)} above Medicare rates`,
          procedure: billingErrors.map(error => error.procedure || `CPT ${error.cptCode}`).join(', '),
          supporting_facts: billingErrors.map(error =>
            `CPT ${error.cptCode}: Billed $${error.billedAmount.toFixed(2)}, Medicare rate $${error.medicareRate.toFixed(2)}, Overcharge: $${(error.billedAmount - error.medicareRate).toFixed(2)} (${error.overchargePercentage.toFixed(1)}%)`
          ).join('\n')
        }),
      });

      if (mcpResponse.ok) {
        const data = await mcpResponse.json();
        return {
          content: data.appeal_letter,
          referenceNumber,
          generatedAt: new Date().toISOString()
        };
      }
    } catch (mcpError) {
      // MCP tool unavailable, falling back to local generation
    }

    // Fallback: Generate letter locally
    const content = `
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

Re: Appeal of Overcharged Medical Claims - Reference: ${referenceNumber}

Dear Sir or Madam:

I am writing to formally appeal the excessive charges on recent medical services provided to my patient (Reference ID: ${patientId}). This appeal is submitted pursuant to your internal appeal procedures and applicable state insurance regulations.

CLAIM REFERENCE INFORMATION:
- Reference Number: ${referenceNumber}
- Appeal Date: ${today}
- Total Overcharge Disputed: $${totalOvercharge.toFixed(2)}

DISPUTED CHARGES AND MEDICARE COMPARISONS:

${billingErrors.map((error, index) => `
${index + 1}. CPT Code ${error.cptCode}${error.procedure ? ` - ${error.procedure}` : ''}
   - Amount Billed: $${error.billedAmount.toFixed(2)}
   - Medicare Rate: $${error.medicareRate.toFixed(2)}
   - Overcharge: $${(error.billedAmount - error.medicareRate).toFixed(2)} (${error.overchargePercentage.toFixed(1)}%)
   ${error.diagnosisCode ? `- Associated Diagnosis: ${error.diagnosisCode}` : ''}`).join('\n')}

MEDICAL NECESSITY AND JUSTIFICATION:
All procedures listed above were medically necessary and performed in accordance with standard medical practice. The billed amounts significantly exceed Medicare reimbursement rates, which are established based on fair market value and resource costs.

I request that you review these charges and adjust the billed amounts to reflect fair and reasonable Medicare-based rates. This would result in a total adjustment of $${totalOvercharge.toFixed(2)}.

Please provide written notification of your decision within the timeframe required by law. If additional medical records or documentation are needed to process this appeal, please contact me at your earliest convenience.

Thank you for your attention to this matter.

Sincerely,

[Your Name]
[Your Insurance ID/Member Number]
[Relationship to Patient]
[Phone Number]
[Email Address]

Enclosures:
- Original Claims Documentation
- Medical Records Supporting Medical Necessity
- Medicare Rate Comparisons
- Any Additional Supporting Documentation
`;

    return {
      content: content.trim(),
      referenceNumber,
      generatedAt: new Date().toISOString()
    };
  }, [billingErrors, generateReferenceNumber, patientId]);

  // Handle letter generation
  const handleGenerateLetter = async () => {
    if (billingErrors.length === 0) {
      setError('No billing errors to appeal');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const letter = await generateAppealLetter();
      setAppealLetter(letter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate appeal letter');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle copy to clipboard
  const handleCopyToClipboard = async () => {
    if (!appealLetter) return;

    try {
      await navigator.clipboard.writeText(appealLetter.content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = appealLetter.content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Handle PDF download
  const handleDownloadPDF = () => {
    if (!appealLetter) return;

    try {
      // Create a new window with the letter content for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups for this website to download PDF');
        return;
      }

      // Format content for printing - Formal Legal Document Style
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Insurance Appeal Letter - ${appealLetter.referenceNumber}</title>
          <style>
            @page { 
              margin: 1in; 
              size: letter;
            }
            body { 
              font-family: 'Times New Roman', serif; 
              line-height: 1.6; 
              margin: 0;
              padding: 0;
              color: #000;
              background: white;
            }
            .letter-container {
              max-width: 8.5in;
              margin: 0 auto;
              padding: 48px;
            }
            .letterhead {
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 24px;
              margin-bottom: 32px;
            }
            .letterhead h3 {
              font-family: Arial, sans-serif;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              font-size: 12px;
              color: #71717a;
              margin-bottom: 8px;
            }
            .letterhead p {
              font-size: 11px;
              color: #a1a1aa;
            }
            .content {
              font-family: 'Times New Roman', serif;
              font-size: 12pt;
              line-height: 1.6;
              color: #18181b;
              white-space: pre-wrap;
              margin: 0;
            }
            .signature {
              margin-top: 60px;
              padding-top: 32px;
              border-top: 1px solid #e5e7eb;
            }
            .signature-line {
              border-bottom: 2px solid #18181b;
              width: 256px;
              margin-top: 64px;
              margin-bottom: 8px;
            }
            .signature-label {
              font-size: 11px;
              color: #52525b;
              font-style: italic;
            }
            pre {
              white-space: pre-wrap;
              font-family: 'Times New Roman', serif;
              margin: 0;
              font-size: 12pt;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <div class="letter-container">
            <div class="letterhead">
              <h3>Appeal Letter</h3>
              <p>Reference: ${appealLetter.referenceNumber}</p>
            </div>
            <div class="content">
              <pre>${appealLetter.content}</pre>
            </div>
            <div class="signature">
              <div class="signature-line"></div>
              <div class="signature-label">Signature</div>
            </div>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.print();
      };

    } catch (err) {
      alert('Failed to generate PDF. Please try copying to clipboard instead.');
    }
  };

  // Handle email (placeholder)
  const handleEmail = () => {
    if (!appealLetter) return;

    const subject = `Insurance Appeal - Reference ${appealLetter.referenceNumber}`;
    const body = encodeURIComponent(appealLetter.content);
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`;

    window.open(mailtoLink);

    // Note: In a real application, you might want to integrate with an email service
    // or show a modal with email composition instead of using mailto
  };

  // Filter for overcharge errors only
  const overchargeErrors = billingErrors.filter(error => error.overchargePercentage > 0);

  if (overchargeErrors.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Overcharges to Appeal</h3>
        <p className="text-gray-600">All billing items are within acceptable ranges compared to Medicare rates.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Generate Appeal Letter</h2>
            <p className="text-sm text-gray-600 mt-1">
              Create a formal insurance appeal for {overchargeErrors.length} overcharged procedure(s)
            </p>
          </div>

          {!appealLetter && (
            <button
              onClick={handleGenerateLetter}
              disabled={isGenerating}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isGenerating
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }`}
            >
              {isGenerating ? 'Generating...' : 'Generate Letter'}
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-medium">Generation Error</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        )}

        {appealLetter && (
          <div className="space-y-6">

            {/* Letter Preview - Formal Legal Document Style */}
            <div className="bg-white shadow-xl rounded-lg border-0 p-12 max-w-3xl mx-auto">
              {/* Action Bar - Floating at top-right */}
              <div className="flex justify-end gap-2 mb-8">
                <button
                  onClick={handleCopyToClipboard}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {copySuccess ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="px-6 py-2 text-sm bg-zinc-900 text-white rounded-full hover:bg-zinc-800 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </button>
              </div>

              {/* Letterhead Section */}
              <div className="mb-8 pb-6 border-b border-zinc-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-sans font-bold uppercase tracking-widest text-sm text-zinc-500 mb-2">
                      Appeal Letter
                    </h3>
                    <p className="text-xs text-zinc-400">Reference: {appealLetter.referenceNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">
                      {new Date(appealLetter.generatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Letter Content - Formal Legal Document Style */}
              <div className="font-serif text-base leading-relaxed text-zinc-900">
                <pre className="whitespace-pre-wrap font-serif text-base leading-relaxed text-zinc-900 font-normal">
                  {appealLetter.content}
                </pre>
              </div>

              {/* Signature Line */}
              <div className="mt-12 pt-8 border-t border-zinc-200">
                <div className="font-serif text-base text-zinc-900">
                  <div className="mb-4">Sincerely,</div>
                  <div className="mt-16 mb-2 border-b-2 border-zinc-900 w-64"></div>
                  <div className="text-sm text-zinc-600 italic">Signature</div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Appeal Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Procedures Disputed:</span>
                  <span className="ml-2 font-medium">{overchargeErrors.length}</span>
                </div>
                <div>
                  <span className="text-blue-700">Total Overcharge:</span>
                  <span className="ml-2 font-medium">
                    ${overchargeErrors.reduce((sum, error) => sum + (error.billedAmount - error.medicareRate), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppealLetterGenerator;
export type { BillingError, AppealLetterGeneratorProps };
