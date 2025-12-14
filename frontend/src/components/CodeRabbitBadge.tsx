'use client';

import React from 'react';
import Link from 'next/link';

/**
 * CodeRabbit Badge Component
 * 
 * Displays a badge linking to CodeRabbit integration page
 * Can be used in headers, footers, or README
 */

interface CodeRabbitBadgeProps {
  variant?: 'default' | 'compact' | 'inline';
  showStats?: boolean;
}

export default function CodeRabbitBadge({ 
  variant = 'default',
  showStats = false 
}: CodeRabbitBadgeProps) {
  if (variant === 'inline') {
    return (
      <Link
        href="/coderabbit"
        className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors text-sm font-medium"
      >
        <span>🐰</span>
        <span>CodeRabbit</span>
        {showStats && <span className="text-blue-500">19+ issues caught</span>}
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link
        href="/coderabbit"
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
      >
        <span className="text-xl">🐰</span>
        <span className="font-semibold">CodeRabbit</span>
        {showStats && (
          <span className="ml-2 px-2 py-1 bg-white/20 rounded text-sm">
            19+ issues caught
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href="/coderabbit"
      className="block p-6 bg-white border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all"
    >
      <div className="flex items-center gap-4 mb-3">
        <div className="text-4xl">🐰</div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">CodeRabbit Integration</h3>
          <p className="text-sm text-gray-600">AI-powered code reviews</p>
        </div>
      </div>
      
      {showStats && (
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
          <div>
            <div className="text-2xl font-bold text-blue-600">19+</div>
            <div className="text-xs text-gray-600">Issues Found</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">1</div>
            <div className="text-xs text-gray-600">Critical Bug</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">100%</div>
            <div className="text-xs text-gray-600">Response Rate</div>
          </div>
        </div>
      )}
      
      <div className="mt-4 text-sm text-blue-600 font-medium">
        View Integration →
      </div>
    </Link>
  );
}
