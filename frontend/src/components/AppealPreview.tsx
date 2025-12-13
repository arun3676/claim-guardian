'use client';

import React, { useState, useRef } from 'react';

interface AppealPreviewProps {
  appealLetter: string;
  patientName?: string;
  claimNumber?: string;
  insuranceCompany?: string;
  totalDisputed?: number;
  onDownload?: (format: 'txt' | 'pdf') => void;
  onEdit?: (editedLetter: string) => void;
}

export default function AppealPreview({
  appealLetter,
  patientName = 'Patient Name',
  claimNumber = 'CLM-XXXXX',
  insuranceCompany = 'Insurance Company',
  totalDisputed = 0,
  onDownload,
  onEdit,
}: AppealPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLetter, setEditedLetter] = useState(appealLetter);
  const letterRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedLetter || appealLetter);
      // Show toast or feedback
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadTxt = () => {
    const content = editedLetter || appealLetter;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appeal-letter-${claimNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onDownload?.('txt');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Appeal Letter - ${claimNumber}</title>
          <style>
            body { 
              font-family: 'Times New Roman', serif; 
              font-size: 12pt; 
              line-height: 1.6;
              max-width: 8.5in;
              margin: 1in auto;
              padding: 0 0.5in;
            }
            h1 { font-size: 14pt; }
            pre { white-space: pre-wrap; font-family: inherit; }
          </style>
        </head>
        <body>
          <pre>${editedLetter || appealLetter}</pre>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    onEdit?.(editedLetter);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedLetter(appealLetter);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-lg">Appeal Letter Preview</h3>
            <p className="text-slate-400 text-sm mt-1">
              Review and download your appeal letter
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Edit"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={handleCopy}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={handlePrint}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Print"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 text-slate-300 hover:text-white transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium"
                >
                  Save Changes
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-slate-500">Patient:</span>
            <span className="ml-2 text-slate-700 font-medium">{patientName}</span>
          </div>
          <div>
            <span className="text-slate-500">Claim:</span>
            <span className="ml-2 text-slate-700 font-medium">{claimNumber}</span>
          </div>
          <div>
            <span className="text-slate-500">Insurer:</span>
            <span className="ml-2 text-slate-700 font-medium">{insuranceCompany}</span>
          </div>
          {totalDisputed > 0 && (
            <div className="ml-auto">
              <span className="text-slate-500">Disputed Amount:</span>
              <span className="ml-2 text-emerald-600 font-semibold">
                ${totalDisputed.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Letter Content */}
      <div 
        ref={letterRef}
        className="p-8 max-h-[600px] overflow-y-auto"
        style={{ background: 'linear-gradient(to bottom, #fafafa, #f5f5f5)' }}
      >
        {isEditing ? (
          <textarea
            value={editedLetter}
            onChange={(e) => setEditedLetter(e.target.value)}
            className="w-full h-[500px] p-6 font-mono text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
          />
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 font-serif text-slate-800 leading-relaxed">
            <pre className="whitespace-pre-wrap font-inherit text-sm">
              {editedLetter || appealLetter}
            </pre>
          </div>
        )}
      </div>

      {/* Actions Footer */}
      <div className="bg-slate-100 px-6 py-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Review the letter carefully and fill in any placeholders before sending
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadTxt}
              className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download TXT
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 hover:shadow-xl transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Letter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

