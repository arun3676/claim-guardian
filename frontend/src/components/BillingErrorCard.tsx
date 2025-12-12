'use client';

import React, { useState } from 'react';

interface BillingErrorCardProps {
  cptCode: string;
  billedAmount: number;
  medicareRate: number;
  procedure?: string;
}

const BillingErrorCard: React.FC<BillingErrorCardProps> = ({
  cptCode,
  billedAmount,
  medicareRate,
  procedure
}) => {
  const [isGeneratingAppeal, setIsGeneratingAppeal] = useState(false);
  const [appealError, setAppealError] = useState<string | null>(null);

  // Calculate overcharge percentage
  const overchargePercentage = ((billedAmount - medicareRate) / medicareRate) * 100;
  const isHighOvercharge = overchargePercentage > 20;

  const handleGenerateAppeal = async () => {
    setIsGeneratingAppeal(true);
    setAppealError(null);

    try {
      // Use MCP tool to generate appeal letter
      // Note: In a real implementation, this would call the MCP tool
      // For now, we'll simulate the call structure

      // Simulate MCP tool call - in production this would use:
      // const result = await useMcpTool('claimguardian', 'generate_appeal_letter', {
      //   patient_name: 'Patient Name', // Would come from context
      //   claim_number: 'CLAIM123',
      //   denial_reason: `Overcharged ${overchargePercentage.toFixed(1)}% above Medicare rate`,
      //   procedure: procedure || cptCode,
      //   supporting_facts: `CPT ${cptCode}: Billed $${billedAmount}, Medicare rate $${medicareRate}`
      // });

      alert(`Appeal letter would be generated for CPT ${cptCode} with ${overchargePercentage.toFixed(1)}% overcharge`);
    } catch (error) {
      setAppealError('Failed to generate appeal letter. Please try again.');
    } finally {
      setIsGeneratingAppeal(false);
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
      </div>
    </div>
  );
};

export default BillingErrorCard;
