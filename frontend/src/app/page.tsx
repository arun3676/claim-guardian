'use client';

import React, { useState, useEffect } from 'react';
import BillingErrorCard from '../components/BillingErrorCard';
import BillingDashboard from '../components/BillingDashboard';
import { analyzeBillingErrors, BillingItem, BillingAnalysisResult } from '../utils/billingAnalysis';

export default function Home() {
  const [analysisResults, setAnalysisResults] = useState<BillingAnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Sample billing data for demonstration
  const sampleBillingItems: BillingItem[] = [
    { cptCode: '99214', billedAmount: 250.00 },
    { cptCode: '85025', billedAmount: 75.00 },
    { cptCode: '71045', billedAmount: 180.00 },
    { cptCode: '99213', billedAmount: 120.00 },
    { cptCode: '93000', billedAmount: 50.00 }
  ];

  useEffect(() => {
    const runAnalysis = async () => {
      try {
        setIsAnalyzing(true);
        setAnalysisError(null);
        const results = await analyzeBillingErrors(sampleBillingItems);
        setAnalysisResults(results);
      } catch (error) {
        setAnalysisError(error instanceof Error ? error.message : 'Analysis failed');
        console.error('Billing analysis error:', error);
      } finally {
        setIsAnalyzing(false);
      }
    };

    runAnalysis();
  }, []);

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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            ClaimGuardian AI
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Advanced medical billing analysis platform helping patients identify overcharges and win appeals
          </p>
        </div>

        {/* Dashboard */}
        <div className="mb-16">
          <BillingDashboard />
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-6">Billing Error Analysis</h2>

            {isAnalyzing && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Analyzing billing data...</p>
              </div>
            )}

            {analysisError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="text-red-800 font-medium">Analysis Error</h3>
                <p className="text-red-700 text-sm mt-1">{analysisError}</p>
              </div>
            )}

            {!isAnalyzing && !analysisError && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
            )}
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Features</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• <strong>billingAnalysis.ts utility:</strong> Analyzes billing errors with MCP integration</li>
              <li>• Validates CPT codes using regex pattern from medical rules</li>
              <li>• Calculates overcharge percentage automatically</li>
              <li>• Sorts results by overcharge (highest first)</li>
              <li>• Flags high priority overcharges ({'>'}20%) in red</li>
              <li>• Displays CPT codes, billed amounts, and Medicare rates</li>
              <li>• Includes loading states and error handling</li>
              <li>• Ready for MCP tool integration for appeal generation</li>
              <li>• HIPAA compliant - no PII exposure in logs</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
