'use client';

import React, { useState } from 'react';

// TypeScript interfaces for MCP tool responses
interface CPTLookupResponse {
  code: string;
  description: string;
  category: string;
}

interface ICD10LookupResponse {
  icd10_code: string;
  description: string;
  category: string;
}

interface MedicareRateResponse {
  code: string;
  rate: number;
  source: string;
  lastUpdated: string;
}

interface BillingError {
  type: string;
  severity: string;
  detail: string;
  savings?: number;
}

interface BillingAnalysisResponse {
  procedures_analyzed: number;
  total_billed: number;
  expected_total: number;
  variance: string;
  errors_found: number;
  errors: BillingError[];
  risk_level: string;
  analysis: Array<{
    procedure: string;
    expected_cost: number;
    cpt_code?: string;
    status: string;
  }>;
  recommendations: string[];
}

interface AppealLetterResponse {
  success: boolean;
  appeal_letter: string;
  claim_number: string;
  generated_at: string;
}

interface ToolResult {
  tool: string;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: Date;
}

/**
 * MCPToolDemo Component - Interactive demo for all ClaimGuardian MCP tools
 *
 * Features:
 * - Buttons to trigger each of the 5 MCP tools
 * - Real-time display of results from the MCP server
 * - Visual comparison of billed amounts vs Medicare rates
 * - Tailwind CSS styling for modern UI
 * - TypeScript support with proper type definitions
 * - JSDoc comments for documentation
 */
const MCPToolDemo: React.FC = () => {
  // State for form inputs
  const [cptInput, setCptInput] = useState('');
  const [icd10Input, setIcd10Input] = useState('');
  const [medicareInput, setMedicareInput] = useState('');
  const [proceduresInput, setProceduresInput] = useState('');
  const [totalBilledInput, setTotalBilledInput] = useState('');
  const [appealForm, setAppealForm] = useState({
    patientName: '',
    claimNumber: '',
    denialReason: '',
    procedure: '',
    supportingFacts: ''
  });

  // State for results and loading
  const [results, setResults] = useState<ToolResult[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  /**
   * Generic function to call MCP API endpoints
   * @param endpoint - The API endpoint path
   * @param payload - The request payload
   * @param toolName - Name of the tool for result tracking
   */
  const callMCPTool = async (endpoint: string, payload: any, toolName: string) => {
    setLoading(toolName);
    try {
      const response = await fetch(`/api/mcp/claimguardian/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API call failed');
      }

      const result: ToolResult = {
        tool: toolName,
        success: true,
        data,
        timestamp: new Date()
      };

      setResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
    } catch (error) {
      const result: ToolResult = {
        tool: toolName,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
      setResults(prev => [result, ...prev.slice(0, 9)]);
    } finally {
      setLoading(null);
    }
  };

  /**
   * Handle CPT code lookup
   */
  const handleCPTLookup = () => {
    if (!cptInput.trim()) return;
    callMCPTool('lookup_cpt_code', { procedure: cptInput }, 'CPT Code Lookup');
  };

  /**
   * Handle ICD-10 code lookup
   */
  const handleICD10Lookup = () => {
    if (!icd10Input.trim()) return;
    callMCPTool('lookup_icd10_code', { diagnosis: icd10Input }, 'ICD-10 Code Lookup');
  };

  /**
   * Handle Medicare rate calculation
   */
  const handleMedicareRate = () => {
    if (!medicareInput.trim()) return;
    callMCPTool('calculate_medicare_rate', { procedure: medicareInput }, 'Medicare Rate Calculator');
  };

  /**
   * Handle billing error detection
   */
  const handleBillingErrorDetection = () => {
    const procedures = proceduresInput.split(',').map(p => p.trim()).filter(p => p);
    const totalBilled = parseFloat(totalBilledInput);

    if (procedures.length === 0 || isNaN(totalBilled)) return;

    callMCPTool('detect_billing_errors', {
      procedures,
      total_billed: totalBilled
    }, 'Billing Error Detection');
  };

  /**
   * Handle appeal letter generation
   */
  const handleAppealLetterGeneration = () => {
    const { patientName, claimNumber, denialReason, procedure, supportingFacts } = appealForm;
    if (!patientName || !claimNumber || !denialReason || !procedure || !supportingFacts) return;

    callMCPTool('generate_appeal_letter', {
      patient_name: patientName,
      claim_number: claimNumber,
      denial_reason: denialReason,
      procedure,
      supporting_facts: supportingFacts
    }, 'Appeal Letter Generator');
  };

  /**
   * Format currency values
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  /**
   * Get severity color for billing errors
   */
  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  /**
   * Get risk level color
   */
  const getRiskColor = (risk: string): string => {
    switch (risk.toLowerCase()) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ClaimGuardian MCP Tools Demo
        </h1>
        <p className="text-gray-600">
          Interactive demonstration of all ClaimGuardian medical billing analysis tools
        </p>
      </div>

      {/* Tool Buttons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* CPT Code Lookup */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">CPT Code Lookup</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Enter procedure (e.g., MRI brain)"
              value={cptInput}
              onChange={(e) => setCptInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCPTLookup}
              disabled={loading === 'CPT Code Lookup' || !cptInput.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading === 'CPT Code Lookup' ? 'Looking up...' : 'Lookup CPT Code'}
            </button>
          </div>
        </div>

        {/* ICD-10 Code Lookup */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ICD-10 Code Lookup</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Enter diagnosis (e.g., diabetes)"
              value={icd10Input}
              onChange={(e) => setIcd10Input(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleICD10Lookup}
              disabled={loading === 'ICD-10 Code Lookup' || !icd10Input.trim()}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading === 'ICD-10 Code Lookup' ? 'Looking up...' : 'Lookup ICD-10 Code'}
            </button>
          </div>
        </div>

        {/* Medicare Rate Calculator */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Medicare Rate Calculator</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Enter procedure"
              value={medicareInput}
              onChange={(e) => setMedicareInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleMedicareRate}
              disabled={loading === 'Medicare Rate Calculator' || !medicareInput.trim()}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading === 'Medicare Rate Calculator' ? 'Calculating...' : 'Calculate Medicare Rate'}
            </button>
          </div>
        </div>

        {/* Billing Error Detection */}
        <div className="bg-white rounded-lg shadow-md p-6 md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Error Detection</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Procedures (comma-separated)"
                value={proceduresInput}
                onChange={(e) => setProceduresInput(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Total billed amount"
                value={totalBilledInput}
                onChange={(e) => setTotalBilledInput(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleBillingErrorDetection}
              disabled={loading === 'Billing Error Detection' || !proceduresInput.trim() || !totalBilledInput}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading === 'Billing Error Detection' ? 'Analyzing...' : 'Detect Billing Errors'}
            </button>
          </div>
        </div>

        {/* Appeal Letter Generator */}
        <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Appeal Letter Generator</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Patient name"
              value={appealForm.patientName}
              onChange={(e) => setAppealForm(prev => ({ ...prev, patientName: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Claim number"
              value={appealForm.claimNumber}
              onChange={(e) => setAppealForm(prev => ({ ...prev, claimNumber: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Procedure"
              value={appealForm.procedure}
              onChange={(e) => setAppealForm(prev => ({ ...prev, procedure: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Denial reason"
              value={appealForm.denialReason}
              onChange={(e) => setAppealForm(prev => ({ ...prev, denialReason: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
            />
            <textarea
              placeholder="Supporting facts"
              value={appealForm.supportingFacts}
              onChange={(e) => setAppealForm(prev => ({ ...prev, supportingFacts: e.target.value }))}
              rows={3}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-3"
            />
          </div>
          <button
            onClick={handleAppealLetterGeneration}
            disabled={loading === 'Appeal Letter Generator' || !Object.values(appealForm).every(v => v.trim())}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading === 'Appeal Letter Generator' ? 'Generating...' : 'Generate Appeal Letter'}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Tool Results</h2>
          <div className="space-y-6">
            {results.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900">{result.tool}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {result.success ? 'Success' : 'Error'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {result.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {result.success ? (
                  <div className="space-y-4">
                    {/* CPT Lookup Result */}
                    {result.tool === 'CPT Code Lookup' && result.data && (
                      <div className="bg-blue-50 p-4 rounded-md">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium text-gray-700">CPT Code:</span>
                            <span className="ml-2 text-blue-600 font-mono">{result.data.code}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Category:</span>
                            <span className="ml-2 text-gray-600">{result.data.category}</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <span className="font-medium text-gray-700">Description:</span>
                          <p className="mt-1 text-gray-600">{result.data.description}</p>
                        </div>
                      </div>
                    )}

                    {/* ICD-10 Lookup Result */}
                    {result.tool === 'ICD-10 Code Lookup' && result.data && (
                      <div className="bg-green-50 p-4 rounded-md">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium text-gray-700">ICD-10 Code:</span>
                            <span className="ml-2 text-green-600 font-mono">{result.data.icd10_code}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Category:</span>
                            <span className="ml-2 text-gray-600">{result.data.category}</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <span className="font-medium text-gray-700">Description:</span>
                          <p className="mt-1 text-gray-600">{result.data.description}</p>
                        </div>
                      </div>
                    )}

                    {/* Medicare Rate Result */}
                    {result.tool === 'Medicare Rate Calculator' && result.data && (
                      <div className="bg-purple-50 p-4 rounded-md">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <span className="font-medium text-gray-700">CPT Code:</span>
                            <span className="ml-2 text-purple-600 font-mono">{result.data.code}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Medicare Rate:</span>
                            <span className="ml-2 text-purple-600 font-bold">{formatCurrency(result.data.rate)}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Source:</span>
                            <span className="ml-2 text-gray-600">{result.data.source}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Billing Error Detection Result */}
                    {result.tool === 'Billing Error Detection' && result.data && (
                      <div className="space-y-4">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-gray-50 p-3 rounded-md text-center">
                            <div className="text-2xl font-bold text-gray-900">{result.data.procedures_analyzed}</div>
                            <div className="text-sm text-gray-600">Procedures Analyzed</div>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-md text-center">
                            <div className="text-2xl font-bold text-blue-600">{formatCurrency(result.data.total_billed)}</div>
                            <div className="text-sm text-gray-600">Total Billed</div>
                          </div>
                          <div className="bg-green-50 p-3 rounded-md text-center">
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(result.data.expected_total)}</div>
                            <div className="text-sm text-gray-600">Expected Total</div>
                          </div>
                          <div className={`p-3 rounded-md text-center ${getRiskColor(result.data.risk_level)}`}>
                            <div className="text-2xl font-bold text-white">{result.data.risk_level}</div>
                            <div className="text-sm text-white opacity-90">Risk Level</div>
                          </div>
                        </div>

                        {/* Visual Comparison */}
                        <div className="bg-gray-50 p-4 rounded-md">
                          <h4 className="font-medium text-gray-900 mb-3">Bill Analysis Summary</h4>
                          <div className="flex items-center space-x-4">
                            <div className="flex-1">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Expected Cost</span>
                                <span>{formatCurrency(result.data.expected_total)}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                  className="bg-green-500 h-3 rounded-full"
                                  style={{
                                    width: result.data.expected_total > result.data.total_billed
                                      ? '100%'
                                      : `${(result.data.expected_total / result.data.total_billed) * 100}%`
                                  }}
                                ></div>
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Actual Billed</span>
                                <span>{formatCurrency(result.data.total_billed)}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                  className={`h-3 rounded-full ${
                                    result.data.total_billed > result.data.expected_total ? 'bg-red-500' : 'bg-green-500'
                                  }`}
                                  style={{
                                    width: result.data.total_billed < result.data.expected_total
                                      ? `${(result.data.total_billed / result.data.expected_total) * 100}%`
                                      : '100%'
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 text-center">
                            <span className={`font-medium ${
                              result.data.variance.includes('-') ? 'text-green-600' : 'text-red-600'
                            }`}>
                              Variance: {result.data.variance}
                            </span>
                          </div>
                        </div>

                        {/* Errors */}
                        {result.data.errors && result.data.errors.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Detected Issues ({result.data.errors_found})</h4>
                            <div className="space-y-2">
                              {result.data.errors.map((error: BillingError, idx: number) => (
                                <div key={idx} className={`p-3 rounded-md ${getSeverityColor(error.severity)}`}>
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{error.type}</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      error.severity === 'HIGH' ? 'bg-red-200 text-red-800' :
                                      error.severity === 'MEDIUM' ? 'bg-yellow-200 text-yellow-800' :
                                      'bg-blue-200 text-blue-800'
                                    }`}>
                                      {error.severity}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-sm">{error.detail}</p>
                                  {error.savings && (
                                    <p className="mt-1 text-sm font-medium">
                                      Potential Savings: {formatCurrency(error.savings)}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommendations */}
                        {result.data.recommendations && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Recommendations</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                              {result.data.recommendations.map((rec: string, idx: number) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Appeal Letter Result */}
                    {result.tool === 'Appeal Letter Generator' && result.data && (
                      <div className="bg-indigo-50 p-4 rounded-md">
                        <div className="mb-3">
                          <span className="font-medium text-gray-700">Claim Number:</span>
                          <span className="ml-2 text-indigo-600">{result.data.claim_number}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Appeal Letter:</span>
                          <div className="mt-2 bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                            {result.data.appeal_letter}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-50 p-4 rounded-md">
                    <p className="text-red-600">{result.error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MCPToolDemo;
