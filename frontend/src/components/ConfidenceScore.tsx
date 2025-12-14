'use client';

import React from 'react';

interface ModelMetrics {
  accuracy: number;
  errorDetection: number;
  cptAccuracy: number;
  medicareMatch: number;
  overchargeDetection: number;
}

interface ConfidenceScoreProps {
  score: number; // 0-100
  modelType: 'generic' | 'oumi';
  metrics?: ModelMetrics;
  label?: string;
  showComparison?: boolean;
}

const GENERIC_METRICS: ModelMetrics = {
  accuracy: 65,
  errorDetection: 60,
  cptAccuracy: 75,
  medicareMatch: 70,
  overchargeDetection: 65,
};

const OUMI_METRICS: ModelMetrics = {
  accuracy: 96,
  errorDetection: 95,
  cptAccuracy: 98,
  medicareMatch: 97,
  overchargeDetection: 94,
};

export default function ConfidenceScore({
  score,
  modelType,
  metrics,
  label,
  showComparison = false,
}: ConfidenceScoreProps) {
  const displayMetrics = metrics || (modelType === 'oumi' ? OUMI_METRICS : GENERIC_METRICS);
  
  // Calculate color based on score
  const getScoreColor = (value: number) => {
    if (value >= 90) return { ring: 'text-emerald-500', bg: 'bg-emerald-500', light: 'bg-emerald-100' };
    if (value >= 75) return { ring: 'text-teal-500', bg: 'bg-teal-500', light: 'bg-teal-100' };
    if (value >= 60) return { ring: 'text-amber-500', bg: 'bg-amber-500', light: 'bg-amber-100' };
    return { ring: 'text-red-500', bg: 'bg-red-500', light: 'bg-red-100' };
  };

  const scoreColor = getScoreColor(score);

  // Circular progress calculation
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className={`px-6 py-4 ${modelType === 'oumi' ? 'bg-gradient-to-r from-purple-600 to-indigo-700' : 'bg-gradient-to-r from-slate-600 to-slate-700'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            {modelType === 'oumi' ? (
              <span className="text-xl">🧠</span>
            ) : (
              <span className="text-xl">🤖</span>
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold">
              {label || (modelType === 'oumi' ? 'Oumi Fine-Tuned Model' : 'Generic Model')}
            </h3>
            <p className="text-white/70 text-sm">
              {modelType === 'oumi' 
                ? 'GRPO Reinforcement Learning' 
                : 'Standard GPT Model'}
            </p>
          </div>
        </div>
      </div>

      {/* Circular Score Display */}
      <div className="p-6 flex justify-center">
        <div className="relative w-44 h-44">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="88"
              cy="88"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-slate-100"
            />
            {/* Progress circle */}
            <circle
              cx="88"
              cy="88"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeLinecap="round"
              className={scoreColor.ring}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset,
                transition: 'stroke-dashoffset 1s ease-out',
              }}
            />
          </svg>
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-slate-800">{score}%</span>
            <span className="text-sm text-slate-500">Confidence</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="px-6 pb-6">
        <h4 className="text-sm font-medium text-slate-600 mb-3">Performance Metrics</h4>
        <div className="space-y-3">
          {[
            { label: 'Error Detection', value: displayMetrics.errorDetection },
            { label: 'CPT Code Accuracy', value: displayMetrics.cptAccuracy },
            { label: 'Medicare Rate Match', value: displayMetrics.medicareMatch },
            { label: 'Overcharge Detection', value: displayMetrics.overchargeDetection },
          ].map((metric) => {
            const color = getScoreColor(metric.value);
            return (
              <div key={metric.label} className="flex items-center gap-3">
                <div className="w-32 text-sm text-slate-600">{metric.label}</div>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color.bg} transition-all duration-700`}
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
                <div className={`w-12 text-right text-sm font-medium ${
                  metric.value >= 90 ? 'text-emerald-600' :
                  metric.value >= 75 ? 'text-teal-600' :
                  metric.value >= 60 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {metric.value}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Model Badge */}
      <div className={`px-6 py-3 ${modelType === 'oumi' ? 'bg-purple-50' : 'bg-slate-50'} border-t border-slate-100`}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Model</span>
          <span className={`font-medium ${modelType === 'oumi' ? 'text-purple-700' : 'text-slate-700'}`}>
            {modelType === 'oumi' 
              ? 'arunn7/claimguardian-medical-billing-v2' 
              : 'GPT-4o-mini'}
          </span>
        </div>
      </div>
    </div>
  );
}

// Comparison component showing both models side by side
export function ModelComparison() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <ConfidenceScore
        score={65}
        modelType="generic"
        label="Generic Model Analysis"
      />
      <ConfidenceScore
        score={95}
        modelType="oumi"
        label="Oumi Fine-Tuned Analysis"
      />
    </div>
  );
}

// Animated improvement showcase
export function ImprovementShowcase() {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-6 text-white">
      <h3 className="text-xl font-bold mb-4">Why Use Our Fine-Tuned Model?</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Error Detection', generic: 60, oumi: 95 },
          { label: 'CPT Accuracy', generic: 75, oumi: 98 },
          { label: 'Medicare Match', generic: 70, oumi: 97 },
          { label: 'Overcharge', generic: 65, oumi: 94 },
        ].map((metric) => (
          <div key={metric.label} className="bg-white/10 rounded-xl p-4">
            <div className="text-sm text-white/70 mb-2">{metric.label}</div>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold text-emerald-300">
                +{metric.oumi - metric.generic}%
              </div>
            </div>
            <div className="text-xs text-white/50 mt-1">
              {metric.generic}% → {metric.oumi}%
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <div className="flex-1 h-px bg-white/20" />
        <span className="text-sm text-white/70">Trained on 95,138 medical records</span>
        <div className="flex-1 h-px bg-white/20" />
      </div>
    </div>
  );
}

