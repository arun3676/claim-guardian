'use client';

import React, { useState, useEffect, useRef } from 'react';

interface StreamingAnalysisProps {
  blobUrl?: string;
  billingData?: {
    procedures: string[];
    codes: string[];
    charges: number[];
    total_billed: number;
  };
  onComplete?: (analysis: string) => void;
  onError?: (error: string) => void;
  autoStart?: boolean;
}

type AnalysisStep = 
  | 'idle'
  | 'extracting'
  | 'detecting'
  | 'assessing'
  | 'deciding'
  | 'reviewing'
  | 'generating'
  | 'complete';

const STEP_CONFIG: Record<AnalysisStep, { label: string; icon: string; color: string }> = {
  idle: { label: 'Ready', icon: '⏳', color: 'slate' },
  extracting: { label: 'Extracting Data', icon: '📄', color: 'blue' },
  detecting: { label: 'Detecting Errors', icon: '🔍', color: 'amber' },
  assessing: { label: 'Risk Assessment', icon: '📊', color: 'orange' },
  deciding: { label: 'AI Decision', icon: '🤖', color: 'purple' },
  reviewing: { label: 'Human Review', icon: '⏸️', color: 'pink' },
  generating: { label: 'Generating Appeal', icon: '📝', color: 'teal' },
  complete: { label: 'Complete', icon: '✅', color: 'emerald' },
};

export default function StreamingAnalysis({
  blobUrl,
  billingData,
  onComplete,
  onError,
  autoStart = false,
}: StreamingAnalysisProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [currentStep, setCurrentStep] = useState<AnalysisStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Parse the streamed text to determine current step
  useEffect(() => {
    if (streamedText.includes('STEP 7: SUMMARY') || streamedText.includes('✅ STEP 7')) {
      setCurrentStep('complete');
    } else if (streamedText.includes('STEP 6: APPEAL') || streamedText.includes('📝 STEP 6')) {
      setCurrentStep('generating');
    } else if (streamedText.includes('STEP 5: HUMAN') || streamedText.includes('⏸️ STEP 5')) {
      setCurrentStep('reviewing');
    } else if (streamedText.includes('STEP 4: AI AGENT') || streamedText.includes('🤖 STEP 4')) {
      setCurrentStep('deciding');
    } else if (streamedText.includes('STEP 3: RISK') || streamedText.includes('📈 STEP 3')) {
      setCurrentStep('assessing');
    } else if (streamedText.includes('STEP 2: ERROR') || streamedText.includes('🔍 STEP 2')) {
      setCurrentStep('detecting');
    } else if (streamedText.includes('STEP 1: EXTRACTION') || streamedText.includes('📊 STEP 1')) {
      setCurrentStep('extracting');
    }
  }, [streamedText]);

  // Auto-scroll to bottom as content streams
  useEffect(() => {
    if (textContainerRef.current) {
      textContainerRef.current.scrollTop = textContainerRef.current.scrollHeight;
    }
  }, [streamedText]);

  const startAnalysis = async () => {
    if (!blobUrl && !billingData) {
      setError('No billing data provided');
      onError?.('No billing data provided');
      return;
    }

    setIsStreaming(true);
    setStreamedText('');
    setCurrentStep('extracting');
    setError(null);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blobUrl,
          billingData,
          includeAppeal: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setStreamedText(fullText);
      }

      setIsStreaming(false);
      setCurrentStep('complete');
      onComplete?.(fullText);

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Intentional abort
      }
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      setIsStreaming(false);
      onError?.(errorMessage);
    }
  };

  const stopAnalysis = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  };

  useEffect(() => {
    if (autoStart && (blobUrl || billingData)) {
      startAnalysis();
    }
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [autoStart, blobUrl]);

  const stepConfig = STEP_CONFIG[currentStep];

  return (
    <div className="w-full space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between px-4">
        {(['extracting', 'detecting', 'assessing', 'deciding', 'reviewing', 'generating', 'complete'] as AnalysisStep[]).map((step, index) => {
          const config = STEP_CONFIG[step];
          const isActive = step === currentStep;
          const isPast = ['extracting', 'detecting', 'assessing', 'deciding', 'reviewing', 'generating', 'complete']
            .indexOf(currentStep) > index;
          
          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-lg
                  transition-all duration-300
                  ${isActive 
                    ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white scale-110 shadow-lg' 
                    : isPast 
                      ? 'bg-emerald-100 text-emerald-600' 
                      : 'bg-slate-100 text-slate-400'
                  }
                `}>
                  {config.icon}
                </div>
                <span className={`
                  text-xs mt-1 text-center max-w-[60px]
                  ${isActive ? 'text-emerald-600 font-medium' : 'text-slate-400'}
                `}>
                  {config.label}
                </span>
              </div>
              {index < 6 && (
                <div className={`
                  flex-1 h-0.5 mx-2
                  ${isPast ? 'bg-emerald-300' : 'bg-slate-200'}
                `} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Control Buttons */}
      <div className="flex justify-center gap-4">
        {!isStreaming ? (
          <button
            onClick={startAnalysis}
            disabled={!blobUrl && !billingData}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStep === 'complete' ? 'Run Again' : 'Start Analysis'}
          </button>
        ) : (
          <button
            onClick={stopAnalysis}
            className="px-6 py-3 bg-slate-600 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors"
          >
            Stop Analysis
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Streaming Output */}
      {(streamedText || isStreaming) && (
        <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700">
            <div className={`w-3 h-3 rounded-full ${isStreaming ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-slate-300 text-sm font-medium">
              {isStreaming ? 'ClaimGuardian AI is analyzing...' : 'Analysis Complete'}
            </span>
          </div>
          <div
            ref={textContainerRef}
            className="p-6 max-h-[500px] overflow-y-auto font-mono text-sm text-slate-100 whitespace-pre-wrap leading-relaxed"
            style={{
              background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
            }}
          >
            {streamedText || (
              <span className="text-slate-400 animate-pulse">
                Initializing analysis...
              </span>
            )}
            {isStreaming && (
              <span className="inline-block w-2 h-5 bg-emerald-400 ml-1 animate-pulse" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

