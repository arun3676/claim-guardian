'use client';

import React, { useState } from 'react';
import KestraWorkflowTrigger from '../../components/KestraWorkflowTrigger';

/**
 * Kestra Workflow Dashboard Page
 * 
 * Page for executing and monitoring Kestra workflows
 */
export default function KestraPage() {
  const [selectedWorkflow, setSelectedWorkflow] = useState(
    'claimguardian-ai-agent-summarizer'
  );
  const [billData, setBillData] = useState({
    patient: { name: 'John Doe', id: 'PAT-12345' },
    procedures: [
      {
        cpt_code: '70553',
        description: 'MRI brain with/without contrast',
        billed_amount: 5000,
        date: '2025-01-10',
      },
    ],
    diagnoses: [
      {
        icd10_code: 'G93.1',
        description: 'Anoxic brain damage',
      },
    ],
    total_billed: 5000,
    insurance: {
      company: 'BlueCross',
      policy_number: 'POL-98765',
    },
  });

  const workflows = [
    {
      id: 'claimguardian-ai-agent-summarizer',
      name: 'AI Agent Summarizer',
      description: 'Summarizes bills and makes decisions using AI Agent',
    },
    {
      id: 'claimguardian-webhook-trigger',
      name: 'Webhook Trigger',
      description: 'Webhook-triggered workflow for external integration',
    },
    {
      id: 'claimguardian-enhanced-agent',
      name: 'Enhanced AI Agent',
      description: 'Advanced AI Agent with system message and enhanced features',
    },
    {
      id: 'claimguardian-oumi-enhanced',
      name: 'Oumi Enhanced',
      description: 'Combines Oumi fine-tuned model with AI Agent',
    },
  ];

  const handleComplete = (results: any) => {
    console.log('Workflow completed:', results);
    alert('Workflow execution completed! Check the results below.');
  };

  const handleError = (error: string) => {
    console.error('Workflow error:', error);
    alert(`Error: ${error}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Kestra Workflow Dashboard</h1>

        {/* Workflow Selection */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Select Workflow</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflows.map((workflow) => (
              <button
                key={workflow.id}
                onClick={() => setSelectedWorkflow(workflow.id)}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  selectedWorkflow === workflow.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-semibold mb-1">{workflow.name}</h3>
                <p className="text-sm text-gray-600">{workflow.description}</p>
                <p className="text-xs text-gray-500 mt-2">ID: {workflow.id}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Bill Data Editor */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Bill Data</h2>
          <textarea
            value={JSON.stringify(billData, null, 2)}
            onChange={(e) => {
              try {
                setBillData(JSON.parse(e.target.value));
              } catch (err) {
                // Invalid JSON, ignore
              }
            }}
            className="w-full h-64 p-3 border border-gray-300 rounded font-mono text-sm"
            placeholder="Enter bill data as JSON"
          />
        </div>

        {/* Workflow Execution */}
        <KestraWorkflowTrigger
          workflowId={selectedWorkflow}
          billData={billData}
          onComplete={handleComplete}
          onError={handleError}
        />

        {/* Documentation */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Documentation</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>
              <strong>AI Agent Summarizer:</strong> Uses Kestra's built-in AI
              Agent to summarize bills and make decisions
            </li>
            <li>
              <strong>Webhook Trigger:</strong> Accepts HTTP POST requests for
              external system integration
            </li>
            <li>
              <strong>Enhanced AI Agent:</strong> Advanced features including
              system messages and structured decision-making
            </li>
            <li>
              <strong>Oumi Enhanced:</strong> Combines fine-tuned Oumi model
              with AI Agent for improved accuracy
            </li>
          </ul>
          <p className="mt-4 text-sm text-gray-600">
            For more information, see{' '}
            <a
              href="https://kestra.io/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Kestra Documentation
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

