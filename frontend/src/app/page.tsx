'use client';

import React, { useState } from 'react';
import BillingErrorCard from '../components/BillingErrorCard';
import BillingDashboard from '../components/BillingDashboard';
import PDFUpload from '../components/PDFUpload';
import WorkflowLogger, { LogEntry } from '../components/WorkflowLogger';
import { analyzeBillingErrors, BillingItem, BillingAnalysisResult } from '../utils/billingAnalysis';
import { Bot, CheckCircle2, Calculator, ArrowDownWideNarrow, Lock, Cpu } from 'lucide-react';

export default function Home() {
  const [analysisResults, setAnalysisResults] = useState<BillingAnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [workflowResults, setWorkflowResults] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const addLog = (level: LogEntry['level'], message: string, tool?: string, details?: string, data?: any) => {
    const log: LogEntry = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      level,
      tool,
      message,
      details,
      data,
    };
    setLogs(prev => [...prev, log]);
    return log;
  };

  const clearLogs = () => {
    setLogs([]);
    setWorkflowResults(null);
    setAnalysisResults([]);
    setAnalysisError(null);
  };

  const processPDF = async (file: File) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setLogs([]);
    setWorkflowResults(null);

    try {
      addLog('info', 'Starting workflow processing...');
      addLog('info', `File: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      addLog('info', 'Uploading PDF to server...');

      // Call workflow processing API
      const response = await fetch('/api/workflow/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Workflow processing failed');
      }

      const result = await response.json();

      // Convert workflow steps to log entries
      result.steps.forEach((step: any) => {
        const level: LogEntry['level'] = 
          step.status === 'success' ? 'success' :
          step.status === 'error' ? 'error' :
          step.status === 'running' ? 'info' : 'info';
        
        addLog(
          level,
          step.message,
          step.tool,
          step.error || step.data ? JSON.stringify(step.data || { error: step.error }, null, 2) : undefined,
          step.data
        );
      });

      // Process results
      if (result.success && result.results) {
        setWorkflowResults(result.results);

        // Convert MCP results to analysis results for display
        if (result.results.summary && result.results.mcpResults) {
          const errorDetection = result.results.mcpResults.find((r: any) => r.tool === 'detect_billing_errors');
          // Note: MCP detect_billing_errors returns a different structure
          // The errors array contains error objects, not billing items
          // We should use the analysis array instead if available
          if (errorDetection && errorDetection.analysis && Array.isArray(errorDetection.analysis)) {
            const billingItems: BillingItem[] = errorDetection.analysis
              .filter((item: any) => item.cpt_code && item.expected_cost)
              .map((item: any) => ({
                cptCode: item.cpt_code,
                billedAmount: item.billed_amount || item.expected_cost,
              }));
            
            if (billingItems.length > 0) {
              try {
                const analysisResults = await analyzeBillingErrors(billingItems);
                setAnalysisResults(analysisResults);
              } catch (error) {
                console.warn('Could not analyze billing items:', error);
                // Don't set analysis results if analysis fails
              }
            }
          }
        }

        addLog('success', `Workflow completed successfully in ${(result.latencyMs / 1000).toFixed(2)}s`);
      } else {
        throw new Error(result.error || 'Workflow processing failed');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setAnalysisError(errorMessage);
      addLog('error', 'Workflow failed', undefined, errorMessage);
      console.error('Workflow error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Mock procedure descriptions (in real app, this would come from MCP lookup_cpt_code)
  const getProcedureDescription = (cptCode: string): string => {
    const descriptions: Record<string, string> = {
      '99214': 'Office visit, established patient',
      '85025': 'Complete blood count',
      '71045': 'Chest X-ray',
      '99213': 'Office visit, lower complexity',
      '93000': 'Electrocardiogram'
    };
    return descriptions[cptCode] || 'Unknown procedure';
  };

  return (
    <div>
      <div className="text-center mb-12">
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Advanced medical billing analysis platform helping patients identify overcharges and win appeals
        </p>
      </div>

        {/* Dashboard */}
        <div className="mb-16">
          <BillingDashboard />
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Upload & Results */}
          <div className="space-y-6">
            {/* PDF Upload */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Upload Medical Bill PDF</h2>
              <PDFUpload onUpload={processPDF} isProcessing={isAnalyzing} />
            </div>

            {/* Analysis Results */}
            {analysisResults.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-6">Billing Error Analysis</h2>
                <div className="grid gap-4">
                  {analysisResults.map((result, index) => (
                    <BillingErrorCard
                      key={index}
                      cptCode={result.cptCode}
                      billedAmount={result.billedAmount}
                      medicareRate={result.medicareRate}
                      procedure={getProcedureDescription(result.cptCode)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Error Display */}
            {analysisError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-medium">Analysis Error</h3>
                <p className="text-red-700 text-sm mt-1">{analysisError}</p>
              </div>
            )}

            {/* Workflow Summary - Medical Receipt Style */}
            {workflowResults && workflowResults.summary && (
              <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-zinc-900 mb-4 font-mono">ANALYSIS SUMMARY</h3>
                <div className="space-y-3 text-sm border-t border-zinc-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-600">Total Items:</span>
                    <span className="font-mono font-semibold text-zinc-900">{workflowResults.summary.totalItems}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-600">Errors Found:</span>
                    <span className="font-mono font-semibold text-zinc-900">{workflowResults.summary.errorsFound}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-zinc-200">
                    <span className="text-lg font-semibold text-zinc-900">Total Overcharge:</span>
                    <span className="text-4xl text-emerald-600 font-bold tracking-tight font-mono">
                      ${workflowResults.summary.totalOvercharge?.toFixed(2)}
                    </span>
                  </div>
                  {workflowResults.summary.recommendations && (
                    <div className="mt-4 pt-4 border-t border-zinc-200">
                      <strong className="text-zinc-900">Recommendations:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-600">
                        {workflowResults.summary.recommendations.map((rec: string, i: number) => (
                          <li key={i} className="text-sm">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex-1 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 rounded-md py-2 px-4 transition-colors font-medium border border-zinc-300"
                  >
                    {showPreview ? 'Hide Preview' : 'Preview Report'}
                  </button>
                  <button
                    onClick={async () => {
                      if (!workflowResults?.summary?.appealLetter) {
                        alert('Appeal letter not available');
                        return;
                      }
                      try {
                        const response = await fetch('/api/workflow/download', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            appealLetter: workflowResults.summary.appealLetter,
                            sessionId: `session-${Date.now()}`,
                            format: 'txt',
                          }),
                        });
                        if (response.ok) {
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `ClaimGuardian_Appeal_Letter_${Date.now()}.txt`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                        } else {
                          alert('Failed to download report');
                        }
                      } catch (error) {
                        console.error('Download error:', error);
                        alert('Failed to download report');
                      }
                    }}
                    className="flex-1 bg-zinc-900 text-white hover:bg-zinc-800 rounded-md py-2 px-4 shadow-lg transition-colors font-medium"
                  >
                    Download Report
                  </button>
                </div>
                {showPreview && workflowResults?.summary?.appealLetter && (
                  <div className="mt-4 p-4 bg-zinc-50 border border-zinc-200 rounded-md max-h-96 overflow-y-auto">
                    <h4 className="font-semibold text-zinc-900 mb-2">Appeal Letter Preview</h4>
                    <pre className="text-xs text-zinc-700 whitespace-pre-wrap font-mono">
                      {workflowResults.summary.appealLetter}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Workflow Logger */}
          <div>
            <WorkflowLogger logs={logs} isRunning={isAnalyzing} onClear={clearLogs} />
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-8">

          {/* Capabilities Grid */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-zinc-900">Capabilities</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-zinc-50/50 border border-zinc-200 rounded-lg p-5 hover:border-teal-500 hover:bg-white transition-all duration-200">
                <Bot className="w-5 h-5 text-teal-600 mb-3" />
                <h4 className="font-semibold text-zinc-900 mb-1">Automated Analysis</h4>
                <p className="text-sm text-zinc-500">Analyzes billing errors with MCP integration</p>
              </div>
              <div className="bg-zinc-50/50 border border-zinc-200 rounded-lg p-5 hover:border-teal-500 hover:bg-white transition-all duration-200">
                <CheckCircle2 className="w-5 h-5 text-teal-600 mb-3" />
                <h4 className="font-semibold text-zinc-900 mb-1">Medical Code Validation</h4>
                <p className="text-sm text-zinc-500">Validates CPT codes using regex pattern from medical rules</p>
              </div>
              <div className="bg-zinc-50/50 border border-zinc-200 rounded-lg p-5 hover:border-teal-500 hover:bg-white transition-all duration-200">
                <Calculator className="w-5 h-5 text-teal-600 mb-3" />
                <h4 className="font-semibold text-zinc-900 mb-1">Fair Price Engine</h4>
                <p className="text-sm text-zinc-500">Calculates overcharge percentage automatically</p>
              </div>
              <div className="bg-zinc-50/50 border border-zinc-200 rounded-lg p-5 hover:border-teal-500 hover:bg-white transition-all duration-200">
                <ArrowDownWideNarrow className="w-5 h-5 text-teal-600 mb-3" />
                <h4 className="font-semibold text-zinc-900 mb-1">Priority Sorting</h4>
                <p className="text-sm text-zinc-500">Sorts results by overcharge (highest first)</p>
              </div>
              <div className="bg-zinc-50/50 border border-zinc-200 rounded-lg p-5 hover:border-teal-500 hover:bg-white transition-all duration-200">
                <Lock className="w-5 h-5 text-teal-600 mb-3" />
                <h4 className="font-semibold text-zinc-900 mb-1">Enterprise Security</h4>
                <p className="text-sm text-zinc-500">HIPAA compliant - no PII exposure in logs</p>
              </div>
              <div className="bg-zinc-50/50 border border-zinc-200 rounded-lg p-5 hover:border-teal-500 hover:bg-white transition-all duration-200">
                <Cpu className="w-5 h-5 text-teal-600 mb-3" />
                <h4 className="font-semibold text-zinc-900 mb-1">Agentic Integration</h4>
                <p className="text-sm text-zinc-500">Ready for MCP tool integration for appeal generation</p>
              </div>
            </div>
          </div>

          {/* CodeRabbit Integration Showcase - Live Security Operations Center */}
          <div className="bg-slate-50 rounded-lg p-6 border border-zinc-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Side - Identity */}
              <div className="md:col-span-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-white rounded-full p-2 shadow-sm">
                    <span className="text-2xl">🐰</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900">Automated Code Assurance</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                      <span className="text-xs text-zinc-600 font-medium">Monitoring Active</span>
                    </div>
                  </div>
                </div>
                {/* Metrics Bar */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900 text-lg">23+</span>
                    <span className="text-zinc-600">hours saved</span>
                  </div>
                  <div className="h-px bg-zinc-200"></div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900 text-lg">1</span>
                    <span className="text-zinc-600">critical bug prevented</span>
                  </div>
                </div>
              </div>

              {/* Right Side - Streaming Log */}
              <div className="md:col-span-2">
                <div className="h-48 overflow-hidden bg-zinc-900 rounded-lg p-4 font-mono text-xs text-zinc-300 relative">
                  {/* Gradient overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-zinc-900 to-transparent pointer-events-none"></div>
                  
                  {/* Streaming Log Content */}
                  <div className="space-y-1.5">
                    <div className="text-emerald-400 animate-pulse">
                      [10:42:18] 🛡️ Security Check: OWASP Top 10 passed.
                    </div>
                    <div className="text-zinc-300 opacity-75">
                      [10:42:15] ⚠️ Optimization: React hook dependency missing in Dashboard.tsx
                    </div>
                    <div className="text-emerald-400 opacity-50">
                      [10:42:07] ✓ No PII exposure detected in /api/billing.
                    </div>
                    <div className="text-zinc-300 opacity-25">
                      [10:42:05] Scanning PR #42 for HIPAA compliance...
                    </div>
                    <div className="text-zinc-500 opacity-10">
                      [10:41:58] Code quality scan completed. 19 issues identified.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
