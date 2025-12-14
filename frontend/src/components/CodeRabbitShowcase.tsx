'use client';

import React from 'react';

/**
 * CodeRabbit Showcase Component
 * 
 * Displays CodeRabbit integration stats and impact
 * Shows code quality metrics, issues caught, and engineering practices
 */

interface CodeRabbitStat {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}

interface CodeRabbitIssue {
  severity: 'critical' | 'major' | 'minor' | 'trivial';
  category: string;
  count: number;
  description: string;
}

const stats: CodeRabbitStat[] = [
  {
    label: 'PRs Reviewed',
    value: '3+',
    icon: '📋',
    color: 'bg-blue-500'
  },
  {
    label: 'Issues Identified',
    value: '19+',
    icon: '🔍',
    color: 'bg-purple-500'
  },
  {
    label: 'Critical Bugs Prevented',
    value: '1',
    icon: '🛡️',
    color: 'bg-red-500'
  },
  {
    label: 'Response Rate',
    value: '100%',
    icon: '✅',
    color: 'bg-green-500'
  }
];

const issues: CodeRabbitIssue[] = [
  {
    severity: 'critical',
    category: 'React Hooks Bugs',
    count: 1,
    description: 'Stale closure bug that could cause infinite loops and memory leaks'
  },
  {
    severity: 'major',
    category: 'Security Issues',
    count: 10,
    description: 'Missing button type attributes preventing unintended form submissions'
  },
  {
    severity: 'minor',
    category: 'Accessibility',
    count: 5,
    description: 'SVG icons missing accessible labels for screen readers'
  },
  {
    severity: 'minor',
    category: 'UX Improvements',
    count: 3,
    description: 'State sync issues and retry capability suggestions'
  }
];

const examplePRs = [
  {
    number: 18,
    title: 'Frontend Workflow Components',
    url: 'https://github.com/arun3676/claim-guardian/pull/18',
    comments: 16,
    issues: 19,
    status: 'merged'
  }
];

export default function CodeRabbitShowcase() {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-300 text-red-800';
      case 'major': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'minor': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return '🔴 Critical';
      case 'major': return '🟠 Major';
      case 'minor': return '🟡 Minor';
      default: return '⚪ Trivial';
    }
  };

  return (
    <div className="w-full bg-slate-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-white rounded-full p-3 shadow-md">
            <div className="text-4xl">🐰</div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">
              Automated Code Assurance
            </h1>
            <p className="text-sm text-zinc-600 mt-1">
              AI-powered code reviews ensuring quality, security, and best practices
            </p>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="flex flex-wrap items-center gap-6 mb-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-zinc-900">23+</span>
            <span className="text-sm text-zinc-600">hours saved</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-zinc-900">1</span>
            <span className="text-sm text-zinc-600">critical bug prevented</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-zinc-900">19+</span>
            <span className="text-sm text-zinc-600">issues identified</span>
          </div>
        </div>

        {/* Issues as Badges */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          {issues.map((issue, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-zinc-200 shadow-sm"
            >
              <span className="text-sm">{getSeverityBadge(issue.severity)}</span>
              <span className="text-sm font-medium text-zinc-900">{issue.count}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
