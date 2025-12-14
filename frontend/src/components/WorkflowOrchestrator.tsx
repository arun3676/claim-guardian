'use client';

import React, { useState, useCallback } from 'react';
import PDFUpload from './PDFUpload';
import StreamingAnalysis from './StreamingAnalysis';

interface ExtractedData {
  billingData: {
    procedures: { cptCode: string; description?: string; charge: number }[];
    totalBilled: number;
    diagnosisCodes: string[];
  };
  mcpFormat: {
    procedures: string[];
    codes: string[];
    charges: number[];
    total_billed: number;
  };
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}

type WorkflowStep = 'upload' | 'extract' | 'analyze' | 'review' | 'complete';

export default function WorkflowOrchestrator() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleUploadComplete = useCallback(async (result: { 
    success: boolean; 
    blobUrl?: string; 
    fileName?: string; 
    error?: string 
  }) => {
    if (!result.success) {
      setError(result.error || 'Upload failed');
      return;
    }

    setError(null);
    setBlobUrl(result.blobUrl || null);
    setFileName(result.fileName || null);
    setCurrentStep('extract');

    // Automatically extract data
    setIsExtracting(true);
    try {
      const response = await fetch('/api/bills/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blobUrl: result.blobUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract billing data');
      }

      const data = await response.json();
      setExtractedData(data);
      setCurrentStep('analyze');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed');
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const handleAnalysisComplete = useCallback((analysis: string) => {
    setAnalysisResult(analysis);
    setCurrentStep('complete');
  }, []);

  const handleReset = () => {
    setCurrentStep('upload');
    setBlobUrl(null);
    setFileName(null);
    setExtractedData(null);
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Workflow Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800">Medical Bill Analysis Workflow</h2>
        <p className="text-slate-600 mt-2">
          Upload your bill and watch AI analyze it in real-time
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {(['upload', 'extract', 'analyze', 'complete'] as WorkflowStep[]).map((step, index) => {
          const isActive = step === currentStep;
          const isPast = ['upload', 'extract', 'analyze', 'complete'].indexOf(currentStep) > index;
          const labels: Record<WorkflowStep, string> = {
            upload: 'Upload PDF',
            extract: 'Extract Data',
            analyze: 'AI Analysis',
            review: 'Review',
            complete: 'Results',
          };
          
          return (
            <React.Fragment key={step}>
              <div className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all
                ${isActive 
                  ? 'bg-emerald-500 text-white' 
                  : isPast 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-slate-100 text-slate-400'
                }
              `}>
                {labels[step]}
              </div>
              {index < 3 && (
                <svg className={`w-4 h-4 ${isPast ? 'text-emerald-400' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-red-700 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Upload Step */}
      {currentStep === 'upload' && (
        <PDFUpload
          onUploadComplete={handleUploadComplete}
          disabled={false}
        />
      )}

      {/* Extraction Step */}
      {currentStep === 'extract' && isExtracting && (
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <svg className="animate-spin w-full h-full text-emerald-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Extracting Billing Data</h3>
          <p className="text-slate-600 mt-2">Reading {fileName}...</p>
        </div>
      )}

      {/* Extracted Data Preview */}
      {extractedData && currentStep === 'analyze' && (
        <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">Extracted Data</h3>
            <span className={`px-3 py-1 rounded-full text-sm ${
              extractedData.validation.valid 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-amber-100 text-amber-700'
            }`}>
              {extractedData.validation.valid ? 'Valid' : 'Needs Review'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-500">Total Billed</p>
              <p className="text-2xl font-bold text-slate-800">
                ${extractedData.billingData.totalBilled.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-500">Procedures Found</p>
              <p className="text-2xl font-bold text-slate-800">
                {extractedData.billingData.procedures.length}
              </p>
            </div>
          </div>

          {extractedData.validation.warnings.length > 0 && (
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-amber-700 font-medium text-sm">Warnings</p>
              <ul className="text-amber-600 text-sm mt-1 space-y-1">
                {extractedData.validation.warnings.map((w, i) => (
                  <li key={i}>• {w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Analysis Step */}
      {(currentStep === 'analyze' || currentStep === 'complete') && extractedData && (
        <StreamingAnalysis
          blobUrl={blobUrl || undefined}
          billingData={extractedData.mcpFormat}
          onComplete={handleAnalysisComplete}
          onError={(err) => setError(err)}
          autoStart={currentStep === 'analyze'}
        />
      )}

      {/* Completion Actions */}
      {currentStep === 'complete' && (
        <div className="flex justify-center gap-4">
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
          >
            Analyze Another Bill
          </button>
          <button
            onClick={() => {
              // Download the analysis
              const blob = new Blob([analysisResult || ''], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'bill-analysis.txt';
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
          >
            Download Analysis
          </button>
        </div>
      )}

      {/* Sponsor Integration Info */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-6">
        <h4 className="font-semibold text-slate-700 mb-4">Powered By</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center text-sm">
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="text-lg mb-1">📦</div>
            <span className="text-slate-600">Vercel Blob</span>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="text-lg mb-1">🔧</div>
            <span className="text-slate-600">Cline MCP</span>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="text-lg mb-1">🔄</div>
            <span className="text-slate-600">Kestra AI</span>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="text-lg mb-1">🧠</div>
            <span className="text-slate-600">Oumi Model</span>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="text-lg mb-1">⚡</div>
            <span className="text-slate-600">Vercel AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}

