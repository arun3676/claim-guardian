'use client';

import React, { useState } from 'react';

interface BillingErrorCardProps {
  cptCode: string;
  billedAmount: number;
  medicareRate: number;
  procedure?: string;
}

interface AppealLetter {
  content: string;
  referenceNumber: string;
  generatedAt: string;
}

const BillingErrorCard: React.FC<BillingErrorCardProps> = ({
  cptCode,
  billedAmount,
  medicareRate,
  procedure
}) => {
  const [isGeneratingAppeal, setIsGeneratingAppeal] = useState(false);
  const [appealError, setAppealError] = useState<string | null>(null);
  const [appealLetter, setAppealLetter] = useState<AppealLetter | null>(null);
  const [showLetter, setShowLetter] = useState(false);

  // Calculate overcharge percentage
  const overchargePercentage = ((billedAmount - medicareRate) / medicareRate) * 100;
  const isHighOvercharge = overchargePercentage > 20;
  const overchargeAmount = billedAmount - medicareRate;

  const handleGenerateAppeal = async () => {
    setIsGeneratingAppeal(true);
    setAppealError(null);
    setAppealLetter(null);

    try {
      const referenceNumber = `APPEAL_${cptCode}_${Date.now()}`;
      const denialReason = `Overcharged ${overchargePercentage.toFixed(1)}% ($${overchargeAmount.toFixed(2)}) above Medicare rate`;
      const supportingFacts = `CPT ${cptCode}${procedure ? ` - ${procedure}` : ''}: Billed $${billedAmount.toFixed(2)}, Medicare rate $${medicareRate.toFixed(2)}, Overcharge: $${overchargeAmount.toFixed(2)} (${overchargePercentage.toFixed(1)}%)`;

      const response = await fetch('/api/mcp/claimguardian/generate_appeal_letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_name: 'Patient', // Generic placeholder for HIPAA compliance
          claim_number: referenceNumber,
          denial_reason: denialReason,
          procedure: procedure || `CPT ${cptCode}`,
          supporting_facts: supportingFacts
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate appeal letter');
      }

      const data = await response.json();
      setAppealLetter({
        content: data.appeal_letter,
        referenceNumber: data.claim_number,
        generatedAt: data.generated_at
      });
      setShowLetter(true);
    } catch (error) {
      setAppealError(error instanceof Error ? error.message : 'Failed to generate appeal letter. Please try again.');
    } finally {
      setIsGeneratingAppeal(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!appealLetter) return;

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups for this website to download PDF');
        return;
      }

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
      printWindow.onload = () => {
        printWindow.print();
      };
    } catch (err) {
      alert('Failed to generate PDF. Please try copying to clipboard instead.');
    }
  };

  const handleCopyToClipboard = async () => {
    if (!appealLetter) return;
    try {
      await navigator.clipboard.writeText(appealLetter.content);
      alert('Appeal letter copied to clipboard!');
    } catch (err) {
      alert('Failed to copy to clipboard');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              CPT Code: {cptCode}
            </h3>
            {procedure && (
              <p className="text-sm text-gray-600 mt-1">{procedure}</p>
            )}
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            isHighOvercharge
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {isHighOvercharge ? 'High Priority' : 'Review Needed'}
          </span>
        </div>

        {/* Billing Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Billed Amount</p>
            <p className="text-xl font-bold text-gray-900">
              ${billedAmount.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Medicare Rate</p>
            <p className="text-xl font-bold text-green-600">
              ${medicareRate.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Overcharge Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Overcharge</span>
            <span className={`text-lg font-bold ${
              isHighOvercharge ? 'text-red-600' : 'text-orange-600'
            }`}>
              {overchargePercentage.toFixed(1)}%
            </span>
          </div>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                isHighOvercharge ? 'bg-red-500' : 'bg-orange-500'
              }`}
              style={{ width: `${Math.min(overchargePercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Error Message */}
        {appealError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{appealError}</p>
          </div>
        )}

        {/* Action Button */}
        {!appealLetter && (
          <button
            onClick={handleGenerateAppeal}
            disabled={isGeneratingAppeal}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isGeneratingAppeal
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {isGeneratingAppeal ? 'Generating Appeal...' : 'Generate Appeal Letter'}
          </button>
        )}

        {/* Appeal Letter Preview */}
        {appealLetter && (
          <div className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-semibold text-gray-900">Appeal Letter Generated</h4>
              <button
                onClick={() => setShowLetter(!showLetter)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showLetter ? 'Hide' : 'Show'} Letter
              </button>
            </div>

            {showLetter && (
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
                    Copy
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingErrorCard;
