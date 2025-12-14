'use client';

import React, { useState } from 'react';
import WorkflowOrchestrator from '../components/WorkflowOrchestrator';
import { ModelComparison, ImprovementShowcase } from '../components/ConfidenceScore';
import ComparisonMetrics, { QuickComparisonCard } from '../components/ComparisonMetrics';
import { ErrorChartDemo } from '../components/ErrorChart';

type TabType = 'workflow' | 'demo' | 'about';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('workflow');

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-cyan-600/10" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)',
        }} />
        
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full text-emerald-700 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              AssembleHack25 Submission
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                ClaimGuardian AI
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              AI-powered medical billing analysis helping patients detect errors 
              and win appeals using fine-tuned models and intelligent workflows.
            </p>

            {/* Sponsor Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              {[
                { name: 'Vercel', icon: '⚡', color: 'bg-black text-white' },
                { name: 'Cline MCP', icon: '🔧', color: 'bg-blue-600 text-white' },
                { name: 'Kestra AI', icon: '🔄', color: 'bg-purple-600 text-white' },
                { name: 'Oumi', icon: '🧠', color: 'bg-indigo-600 text-white' },
                { name: 'CodeRabbit', icon: '🐰', color: 'bg-orange-500 text-white' },
              ].map((sponsor) => (
                <span
                  key={sponsor.name}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${sponsor.color}`}
                >
                  <span>{sponsor.icon}</span>
                  {sponsor.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {[
              { id: 'workflow' as const, label: 'Analyze Bill', icon: '📊' },
              { id: 'demo' as const, label: 'Demo Components', icon: '🎨' },
              { id: 'about' as const, label: 'About', icon: 'ℹ️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-6 py-4 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? 'text-emerald-600 border-emerald-600'
                    : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {activeTab === 'workflow' && (
          <div className="space-y-12">
            {/* Workflow Orchestrator */}
            <WorkflowOrchestrator />
            
            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { label: 'Error Detection', value: '95%', desc: 'Accuracy with Oumi model' },
                { label: 'Processing Time', value: '<30s', desc: 'End-to-end analysis' },
                { label: 'Potential Savings', value: '$847', desc: 'Average per bill' },
                { label: 'Success Rate', value: '78%', desc: 'Appeal approval rate' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                  <div className="text-2xl font-bold text-emerald-600">{stat.value}</div>
                  <div className="text-sm font-medium text-slate-800">{stat.label}</div>
                  <div className="text-xs text-slate-500 mt-1">{stat.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'demo' && (
          <div className="space-y-12">
            {/* Model Comparison Section */}
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                Model Performance Comparison
              </h2>
              <p className="text-slate-600 mb-8">
                See how our Oumi fine-tuned model outperforms generic models on medical billing analysis.
              </p>
              <ComparisonMetrics showAnimation={true} />
            </section>

            {/* Improvement Showcase */}
            <section>
              <ImprovementShowcase />
            </section>

            {/* Error Chart Demo */}
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                Error Breakdown Visualization
              </h2>
              <p className="text-slate-600 mb-8">
                Visual representation of detected billing errors by severity and type.
              </p>
              <ErrorChartDemo />
            </section>

            {/* Confidence Scores Side by Side */}
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                Confidence Score Comparison
              </h2>
              <ModelComparison />
            </section>

            {/* Quick Card */}
            <section className="grid md:grid-cols-2 gap-6">
              <QuickComparisonCard />
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">End-to-End Workflow</h4>
                    <p className="text-emerald-100 text-sm">Fully integrated sponsor tech</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span>📄</span> PDF Upload → Vercel Blob
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🔧</span> Extract Data → Cline MCP
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🔄</span> Orchestrate → Kestra AI Agent
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🧠</span> Analyze → Oumi Model
                  </div>
                  <div className="flex items-center gap-2">
                    <span>⏸️</span> Review → Human-in-Loop
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📝</span> Generate → Appeal Letter
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Problem Statement */}
            <section className="bg-white rounded-2xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">The Problem</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Medical billing errors cost Americans over <strong>$100 billion annually</strong>. 
                Patients are overcharged, denied claims unfairly, and lack tools to fight back. 
                Studies show that <strong>80% of medical bills contain errors</strong>, yet most 
                patients pay without questioning.
              </p>
            </section>

            {/* Solution */}
            <section className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-100">
              <h2 className="text-2xl font-bold text-emerald-800 mb-4">Our Solution</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { icon: '🔍', title: 'Detect Errors', desc: 'AI analyzes bills for overcharges, upcoding, and unbundling' },
                  { icon: '📊', title: 'Compare Rates', desc: 'Compare charges against Medicare rates and fair market value' },
                  { icon: '📝', title: 'Generate Appeals', desc: 'Professional appeal letters with legal references' },
                  { icon: '⚡', title: 'Save Time', desc: 'Process bills 30-60x faster than manual methods' },
                ].map((feature) => (
                  <div key={feature.title} className="flex gap-4">
                    <div className="text-3xl">{feature.icon}</div>
                    <div>
                      <h3 className="font-semibold text-emerald-800">{feature.title}</h3>
                      <p className="text-sm text-emerald-700">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Tech Stack */}
            <section className="bg-white rounded-2xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Technology Integration</h2>
              <div className="space-y-4">
                {[
                  { 
                    name: 'Cline MCP', 
                    prize: '$5,000', 
                    desc: 'Custom MCP server with 8 medical billing tools built through CLI automation',
                    features: ['CPT Code Lookup', 'Error Detection', 'Appeal Generation', 'Medicare Rates']
                  },
                  { 
                    name: 'Kestra', 
                    prize: '$4,000', 
                    desc: 'AI Agent workflow with human-in-loop approval for billing analysis',
                    features: ['Data Summarization', 'Decision Making', 'Human Review', 'Multi-step Orchestration']
                  },
                  { 
                    name: 'Oumi', 
                    prize: '$3,000', 
                    desc: 'GRPO fine-tuned model for medical billing with 95% error detection accuracy',
                    features: ['GRPO Training', 'LLM-as-Judge', '95,138 Records', '8.75/10 Score']
                  },
                  { 
                    name: 'Vercel', 
                    prize: '$2,000', 
                    desc: 'Frontend deployment with AI SDK streaming and Blob storage',
                    features: ['Streaming UI', 'Blob Storage', 'Edge Functions', 'Observability']
                  },
                  { 
                    name: 'CodeRabbit', 
                    prize: '$1,000', 
                    desc: 'Automated PR reviews ensuring HIPAA compliance and code quality',
                    features: ['PR Reviews', 'HIPAA Checks', 'Security Audits', 'Documentation']
                  },
                ].map((tech) => (
                  <div key={tech.name} className="border border-slate-200 rounded-xl p-5 hover:border-emerald-300 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-slate-800">{tech.name}</h3>
                      <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                        {tech.prize}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{tech.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {tech.features.map((feature) => (
                        <span 
                          key={feature}
                          className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Workflow Diagram */}
            <section className="bg-slate-900 rounded-2xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-6">End-to-End Workflow</h2>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center">
                {[
                  { step: '1', label: 'Upload PDF', icon: '📄' },
                  { step: '2', label: 'Extract Data', icon: '🔧' },
                  { step: '3', label: 'AI Analysis', icon: '🧠' },
                  { step: '4', label: 'Human Review', icon: '⏸️' },
                  { step: '5', label: 'Generate Appeal', icon: '📝' },
                  { step: '6', label: 'Download', icon: '⬇️' },
                ].map((item, index) => (
                  <React.Fragment key={item.step}>
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-2xl mb-2">
                        {item.icon}
                      </div>
                      <div className="text-xs text-slate-400">Step {item.step}</div>
                      <div className="text-sm font-medium">{item.label}</div>
                    </div>
                    {index < 5 && (
                      <svg className="w-6 h-6 text-emerald-500 hidden md:block" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold mb-2">ClaimGuardian AI</h3>
              <p className="text-slate-400 text-sm">
                Built for AssembleHack25 | Fighting unfair medical bills with AI
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-400 text-sm">Powered by:</span>
              <div className="flex gap-2">
                {['Vercel', 'Cline', 'Kestra', 'Oumi', 'CodeRabbit'].map((tech) => (
                  <span key={tech} className="text-xs bg-slate-800 px-2 py-1 rounded">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
