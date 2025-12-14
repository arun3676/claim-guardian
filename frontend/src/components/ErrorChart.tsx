'use client';

import React from 'react';

interface BillingError {
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  amount: number;
  description: string;
  cptCode?: string;
}

interface ErrorChartProps {
  errors: BillingError[];
  totalBilled: number;
  totalOvercharge: number;
}

const SEVERITY_COLORS = {
  CRITICAL: { bg: 'bg-red-500', light: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  HIGH: { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  MEDIUM: { bg: 'bg-amber-500', light: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  LOW: { bg: 'bg-emerald-500', light: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
};

export default function ErrorChart({ errors, totalBilled, totalOvercharge }: ErrorChartProps) {
  // Group errors by severity
  const errorsBySeverity = errors.reduce((acc, error) => {
    acc[error.severity] = (acc[error.severity] || []).concat(error);
    return acc;
  }, {} as Record<string, BillingError[]>);

  // Calculate stats
  const severityCounts = {
    CRITICAL: errorsBySeverity.CRITICAL?.length || 0,
    HIGH: errorsBySeverity.HIGH?.length || 0,
    MEDIUM: errorsBySeverity.MEDIUM?.length || 0,
    LOW: errorsBySeverity.LOW?.length || 0,
  };

  const severityAmounts = {
    CRITICAL: errorsBySeverity.CRITICAL?.reduce((sum, e) => sum + e.amount, 0) || 0,
    HIGH: errorsBySeverity.HIGH?.reduce((sum, e) => sum + e.amount, 0) || 0,
    MEDIUM: errorsBySeverity.MEDIUM?.reduce((sum, e) => sum + e.amount, 0) || 0,
    LOW: errorsBySeverity.LOW?.reduce((sum, e) => sum + e.amount, 0) || 0,
  };

  const overchargePercentage = totalBilled > 0 ? (totalOvercharge / totalBilled) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
        <h3 className="text-white font-semibold text-lg">Error Breakdown</h3>
        <p className="text-slate-400 text-sm mt-1">
          {errors.length} errors detected totaling ${totalOvercharge.toLocaleString()}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50">
        {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((severity) => {
          const colors = SEVERITY_COLORS[severity];
          return (
            <div key={severity} className={`${colors.light} ${colors.border} border rounded-xl p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
                <span className={`text-sm font-medium ${colors.text}`}>{severity}</span>
              </div>
              <div className={`text-2xl font-bold ${colors.text}`}>
                {severityCounts[severity]}
              </div>
              <div className="text-sm text-slate-500">
                ${severityAmounts[severity].toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Bar Chart */}
      <div className="px-6 py-4 border-t border-slate-100">
        <h4 className="text-sm font-medium text-slate-600 mb-4">Overcharge Distribution</h4>
        <div className="space-y-3">
          {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((severity) => {
            const amount = severityAmounts[severity];
            const percentage = totalOvercharge > 0 ? (amount / totalOvercharge) * 100 : 0;
            const colors = SEVERITY_COLORS[severity];
            
            return (
              <div key={severity} className="flex items-center gap-4">
                <div className="w-20 text-sm text-slate-600">{severity}</div>
                <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colors.bg} transition-all duration-500 ease-out`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-24 text-right text-sm font-medium text-slate-700">
                  ${amount.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overcharge Gauge */}
      <div className="px-6 py-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-slate-600">Total Overcharge</h4>
          <span className={`text-sm font-medium ${
            overchargePercentage > 50 ? 'text-red-600' :
            overchargePercentage > 25 ? 'text-orange-600' :
            overchargePercentage > 10 ? 'text-amber-600' : 'text-emerald-600'
          }`}>
            {overchargePercentage.toFixed(1)}% of bill
          </span>
        </div>
        <div className="relative h-8 bg-slate-100 rounded-full overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 flex">
            <div className="w-1/4 bg-emerald-200" />
            <div className="w-1/4 bg-amber-200" />
            <div className="w-1/4 bg-orange-200" />
            <div className="w-1/4 bg-red-200" />
          </div>
          {/* Marker */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-slate-800 shadow-lg transition-all duration-500"
            style={{ left: `${Math.min(overchargePercentage, 100)}%` }}
          />
          {/* Labels */}
          <div className="absolute inset-0 flex items-center justify-around text-xs font-medium text-slate-600">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Error List */}
      {errors.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-100">
          <h4 className="text-sm font-medium text-slate-600 mb-4">Error Details</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {errors.map((error, index) => {
              const colors = SEVERITY_COLORS[error.severity];
              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 ${colors.light} ${colors.border} border rounded-lg`}
                >
                  <div className={`w-2 h-2 rounded-full ${colors.bg}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${colors.text}`}>{error.type}</div>
                    <div className="text-xs text-slate-500 truncate">{error.description}</div>
                  </div>
                  <div className={`text-sm font-semibold ${colors.text}`}>
                    ${error.amount.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Demo export with sample data
export function ErrorChartDemo() {
  const sampleErrors: BillingError[] = [
    { type: 'NCCI Edit Violation', severity: 'CRITICAL', amount: 450, description: 'EKG bundled into stress test', cptCode: '93000' },
    { type: 'Price Variance', severity: 'HIGH', amount: 1500, description: 'MRI charged 200% above average', cptCode: '70553' },
    { type: 'Upcoding', severity: 'MEDIUM', amount: 200, description: 'Level 5 E/M code may not be justified', cptCode: '99215' },
    { type: 'Duplicate Service', severity: 'LOW', amount: 50, description: 'Lab panel billed twice', cptCode: '80053' },
  ];

  return (
    <ErrorChart
      errors={sampleErrors}
      totalBilled={5000}
      totalOvercharge={2200}
    />
  );
}

