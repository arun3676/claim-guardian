'use client';

import React, { useState, useEffect } from 'react';

interface Metric {
  name: string;
  generic: number;
  oumi: number;
  unit?: string;
}

interface ComparisonMetricsProps {
  showAnimation?: boolean;
}

const METRICS: Metric[] = [
  { name: 'Error Detection Rate', generic: 60, oumi: 95, unit: '%' },
  { name: 'CPT Code Accuracy', generic: 75, oumi: 98, unit: '%' },
  { name: 'Medicare Rate Match', generic: 70, oumi: 97, unit: '%' },
  { name: 'Overcharge Detection', generic: 65, oumi: 94, unit: '%' },
  { name: 'False Positive Rate', generic: 25, oumi: 3, unit: '%' },
  { name: 'Processing Speed', generic: 2.5, oumi: 1.2, unit: 's' },
];

export default function ComparisonMetrics({ showAnimation = true }: ComparisonMetricsProps) {
  const [animated, setAnimated] = useState(!showAnimation);

  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => setAnimated(true), 100);
      return () => clearTimeout(timer);
    }
  }, [showAnimation]);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-purple-900 to-slate-800 px-6 py-5">
        <h3 className="text-white font-semibold text-lg">Model Performance Comparison</h3>
        <p className="text-slate-300 text-sm mt-1">
          Generic GPT vs Oumi Fine-Tuned Model
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-8 py-4 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-400" />
          <span className="text-sm text-slate-600">Generic GPT</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-r from-purple-500 to-indigo-500" />
          <span className="text-sm text-slate-600">Oumi Fine-Tuned</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-6 space-y-6">
        {METRICS.map((metric, index) => {
          const isLowerBetter = metric.name.includes('False') || metric.name.includes('Speed');
          const improvement = isLowerBetter 
            ? ((metric.generic - metric.oumi) / metric.generic * 100)
            : ((metric.oumi - metric.generic) / metric.generic * 100);
          
          const genericWidth = isLowerBetter
            ? (metric.generic / Math.max(metric.generic, metric.oumi * 2)) * 100
            : (metric.generic / 100) * 100;
          
          const oumiWidth = isLowerBetter
            ? (metric.oumi / Math.max(metric.generic, metric.oumi * 2)) * 100
            : (metric.oumi / 100) * 100;

          return (
            <div key={metric.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">{metric.name}</span>
                <span className={`text-sm font-semibold ${
                  improvement > 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {improvement > 0 ? '+' : ''}{improvement.toFixed(0)}%
                </span>
              </div>
              
              {/* Generic Bar */}
              <div className="flex items-center gap-3">
                <div className="w-20 text-xs text-slate-500 text-right">Generic</div>
                <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden relative">
                  <div
                    className="h-full bg-slate-400 rounded-lg transition-all duration-1000 ease-out"
                    style={{ 
                      width: animated ? `${genericWidth}%` : '0%',
                      transitionDelay: `${index * 100}ms`
                    }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-600">
                    {metric.generic}{metric.unit}
                  </span>
                </div>
              </div>
              
              {/* Oumi Bar */}
              <div className="flex items-center gap-3">
                <div className="w-20 text-xs text-purple-600 text-right font-medium">Oumi</div>
                <div className="flex-1 h-6 bg-purple-50 rounded-lg overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg transition-all duration-1000 ease-out"
                    style={{ 
                      width: animated ? `${oumiWidth}%` : '0%',
                      transitionDelay: `${index * 100 + 50}ms`
                    }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-purple-700">
                    {metric.oumi}{metric.unit}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Stats */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-white">95,138</div>
            <div className="text-xs text-purple-200">Training Records</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">GRPO</div>
            <div className="text-xs text-purple-200">Training Method</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">8.75/10</div>
            <div className="text-xs text-purple-200">LLM Judge Score</div>
          </div>
        </div>
      </div>

      {/* Model Info */}
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Fine-tuned Model</span>
          <span className="font-mono text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
            arungenailab/claimguardian-medical-billing-v2
          </span>
        </div>
      </div>
    </div>
  );
}

// Summary card for quick display
export function QuickComparisonCard() {
  return (
    <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          <span className="text-2xl">🧠</span>
        </div>
        <div>
          <h4 className="font-semibold">Oumi Fine-Tuned Model</h4>
          <p className="text-purple-200 text-sm">Specialized for medical billing</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-2xl font-bold">+35%</div>
          <div className="text-xs text-purple-200">Error Detection</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-2xl font-bold">+23%</div>
          <div className="text-xs text-purple-200">CPT Accuracy</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-2xl font-bold">-88%</div>
          <div className="text-xs text-purple-200">False Positives</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-2xl font-bold">2x</div>
          <div className="text-xs text-purple-200">Faster</div>
        </div>
      </div>
    </div>
  );
}

