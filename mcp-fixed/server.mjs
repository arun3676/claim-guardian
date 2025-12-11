#!/usr/bin/env node
/**
 * ClaimGuardian MCP Server - Fixed for Cline Compatibility
 * Uses correct MCP SDK patterns for tool registration
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// =============================================================================
// DATA
// =============================================================================
const CPT_CODES = {
  "mri brain": { code: "70553", description: "MRI brain with and without contrast", avgCost: 3500, rvu: 2.78 },
  "mri": { code: "70553", description: "MRI brain with and without contrast", avgCost: 3500, rvu: 2.78 },
  "colonoscopy": { code: "45378", description: "Colonoscopy, diagnostic", avgCost: 3000, rvu: 3.36 },
  "knee replacement": { code: "27447", description: "Total knee arthroplasty", avgCost: 50000, rvu: 20.72 },
  "ct scan": { code: "71250", description: "CT thorax without contrast", avgCost: 1500, rvu: 1.28 },
  "ct chest": { code: "71250", description: "CT thorax without contrast", avgCost: 1500, rvu: 1.28 },
  "echocardiogram": { code: "93306", description: "Echocardiography, complete", avgCost: 2000, rvu: 1.50 },
  "echo": { code: "93306", description: "Echocardiography, complete", avgCost: 2000, rvu: 1.50 },
  "ekg": { code: "93000", description: "Electrocardiogram", avgCost: 150, rvu: 0.17 },
  "ecg": { code: "93000", description: "Electrocardiogram", avgCost: 150, rvu: 0.17 },
  "chest xray": { code: "71046", description: "Chest X-ray, 2 views", avgCost: 300, rvu: 0.22 },
  "x-ray": { code: "71046", description: "Chest X-ray, 2 views", avgCost: 300, rvu: 0.22 },
  "appendectomy": { code: "44970", description: "Laparoscopic appendectomy", avgCost: 12000, rvu: 8.47 },
  "hip replacement": { code: "27130", description: "Total hip arthroplasty", avgCost: 45000, rvu: 20.71 },
  "cholecystectomy": { code: "47562", description: "Laparoscopic cholecystectomy", avgCost: 15000, rvu: 10.38 },
  "gallbladder": { code: "47562", description: "Laparoscopic cholecystectomy", avgCost: 15000, rvu: 10.38 },
};

const ICD10_CODES = {
  "diabetes": { code: "E11.9", description: "Type 2 diabetes mellitus without complications" },
  "type 2 diabetes": { code: "E11.9", description: "Type 2 diabetes mellitus without complications" },
  "hypertension": { code: "I10", description: "Essential (primary) hypertension" },
  "high blood pressure": { code: "I10", description: "Essential (primary) hypertension" },
  "copd": { code: "J44.9", description: "Chronic obstructive pulmonary disease" },
  "chronic obstructive pulmonary disease": { code: "J44.9", description: "Chronic obstructive pulmonary disease" },
  "asthma": { code: "J45.909", description: "Unspecified asthma, uncomplicated" },
  "chest pain": { code: "R07.9", description: "Chest pain, unspecified" },
  "back pain": { code: "M54.5", description: "Low back pain" },
  "anxiety": { code: "F41.9", description: "Anxiety disorder, unspecified" },
  "depression": { code: "F32.9", description: "Major depressive disorder, single episode" },
  "heart failure": { code: "I50.9", description: "Heart failure, unspecified" },
  "atrial fibrillation": { code: "I48.91", description: "Unspecified atrial fibrillation" },
  "afib": { code: "I48.91", description: "Unspecified atrial fibrillation" },
};

// =============================================================================
// TOOL HANDLERS
// =============================================================================
function lookupCptCode(procedure) {
  const procLower = procedure.toLowerCase();
  for (const [key, value] of Object.entries(CPT_CODES)) {
    if (procLower.includes(key) || key.includes(procLower)) {
      return {
        success: true,
        cpt_code: value.code,
        description: value.description,
        average_cost: `$${value.avgCost.toLocaleString()}`,
        rvu: value.rvu,
        medicare_rate: `$${(value.rvu * 33.89).toFixed(2)}`,
      };
    }
  }
  return {
    success: false,
    message: `No CPT code found for "${procedure}"`,
    available_procedures: Object.keys(CPT_CODES).slice(0, 10),
  };
}

function lookupIcd10Code(diagnosis) {
  const diagLower = diagnosis.toLowerCase();
  for (const [key, value] of Object.entries(ICD10_CODES)) {
    if (diagLower.includes(key) || key.includes(diagLower)) {
      return {
        success: true,
        icd10_code: value.code,
        description: value.description,
      };
    }
  }
  return {
    success: false,
    message: `No ICD-10 code found for "${diagnosis}"`,
    available_diagnoses: Object.keys(ICD10_CODES).slice(0, 10),
  };
}

function calculateMedicareRate(procedure) {
  const procLower = procedure.toLowerCase();
  for (const [key, value] of Object.entries(CPT_CODES)) {
    if (procLower.includes(key) || key.includes(procLower)) {
      const rate = value.rvu * 33.89;
      return {
        success: true,
        procedure: value.description,
        cpt_code: value.code,
        rvu: value.rvu,
        medicare_rate: `$${rate.toFixed(2)}`,
        fair_price_range: {
          low: `$${rate.toFixed(0)}`,
          average: `$${(rate * 2).toFixed(0)}`,
          high: `$${(rate * 3.5).toFixed(0)}`,
        },
        negotiation_tip: `If charged over $${(rate * 4).toFixed(0)}, negotiate down`,
      };
    }
  }
  return { success: false, message: `Procedure not found: ${procedure}` };
}

function detectBillingErrors(procedures, totalBilled) {
  let expectedTotal = 0;
  const analysis = [];
  
  for (const proc of procedures) {
    const procLower = proc.toLowerCase();
    let found = false;
    for (const [key, value] of Object.entries(CPT_CODES)) {
      if (procLower.includes(key) || key.includes(procLower)) {
        expectedTotal += value.avgCost;
        analysis.push({ procedure: proc, expected: value.avgCost, code: value.code });
        found = true;
        break;
      }
    }
    if (!found) {
      analysis.push({ procedure: proc, expected: "unknown", code: "not found" });
    }
  }
  
  const errors = [];
  if (expectedTotal > 0 && totalBilled > expectedTotal * 2) {
    errors.push({
      type: "OVERCHARGE",
      severity: "HIGH",
      detail: `Billed $${totalBilled} but expected ~$${expectedTotal}`,
    });
  }
  
  return {
    procedures_analyzed: procedures.length,
    total_billed: `$${totalBilled}`,
    expected_total: `$${expectedTotal}`,
    variance: expectedTotal > 0 ? `${((totalBilled - expectedTotal) / expectedTotal * 100).toFixed(0)}%` : "unknown",
    errors_found: errors.length,
    errors: errors,
    risk_level: errors.length > 0 ? "HIGH" : "LOW",
    analysis: analysis,
  };
}

function generateAppealLetter(patientName, claimNumber, denialReason, procedure, supportingFacts) {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  
  return {
    success: true,
    letter: `
APPEAL LETTER - CLAIM DENIAL

Date: ${today}
Claim Number: ${claimNumber}
Patient: ${patientName}

Dear Appeals Department:

I am writing to formally appeal the denial of claim ${claimNumber}.

DENIAL REASON CITED: "${denialReason}"

PROCEDURE: ${procedure}

GROUNDS FOR APPEAL:
${supportingFacts}

Under ERISA Section 503 (29 U.S.C. § 1133), I request:
1. Reversal of the denial
2. Payment per my policy benefits
3. Written explanation if denied again

Please respond within 30 days as required by law.

Sincerely,
${patientName}
`,
    tips: [
      "Send via certified mail with return receipt",
      "Keep copies of everything",
      "Include supporting medical records",
      "Request peer-to-peer review with your doctor",
    ],
  };
}

// =============================================================================
// SERVER SETUP
// =============================================================================
const server = new Server(
  {
    name: "claimguardian",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "lookup_cpt_code",
        description: "Look up CPT (procedure) billing codes for medical procedures. Returns code, description, average cost, and Medicare rate.",
        inputSchema: {
          type: "object",
          properties: {
            procedure: {
              type: "string",
              description: "The medical procedure to look up (e.g., 'MRI brain', 'colonoscopy', 'knee replacement')",
            },
          },
          required: ["procedure"],
        },
      },
      {
        name: "lookup_icd10_code",
        description: "Look up ICD-10 diagnosis codes for medical conditions. Returns the billing code and description.",
        inputSchema: {
          type: "object",
          properties: {
            diagnosis: {
              type: "string",
              description: "The diagnosis or condition to look up (e.g., 'diabetes', 'hypertension', 'COPD')",
            },
          },
          required: ["diagnosis"],
        },
      },
      {
        name: "calculate_medicare_rate",
        description: "Calculate the Medicare reimbursement rate for a procedure. Useful for negotiating bills.",
        inputSchema: {
          type: "object",
          properties: {
            procedure: {
              type: "string",
              description: "The procedure to calculate Medicare rate for",
            },
          },
          required: ["procedure"],
        },
      },
      {
        name: "detect_billing_errors",
        description: "Analyze a medical bill for common billing errors like overcharging.",
        inputSchema: {
          type: "object",
          properties: {
            procedures: {
              type: "array",
              items: { type: "string" },
              description: "List of procedures on the bill",
            },
            total_billed: {
              type: "number",
              description: "Total amount billed in dollars",
            },
          },
          required: ["procedures", "total_billed"],
        },
      },
      {
        name: "generate_appeal_letter",
        description: "Generate a formal insurance appeal letter for denied claims.",
        inputSchema: {
          type: "object",
          properties: {
            patient_name: { type: "string", description: "Patient's name" },
            claim_number: { type: "string", description: "Claim number" },
            denial_reason: { type: "string", description: "Reason for denial" },
            procedure: { type: "string", description: "The procedure that was denied" },
            supporting_facts: { type: "string", description: "Facts supporting the appeal" },
          },
          required: ["patient_name", "claim_number", "denial_reason", "procedure", "supporting_facts"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      case "lookup_cpt_code":
        result = lookupCptCode(args.procedure);
        break;
      case "lookup_icd10_code":
        result = lookupIcd10Code(args.diagnosis);
        break;
      case "calculate_medicare_rate":
        result = calculateMedicareRate(args.procedure);
        break;
      case "detect_billing_errors":
        result = detectBillingErrors(args.procedures, args.total_billed);
        break;
      case "generate_appeal_letter":
        result = generateAppealLetter(
          args.patient_name,
          args.claim_number,
          args.denial_reason,
          args.procedure,
          args.supporting_facts
        );
        break;
      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ClaimGuardian MCP Server running!");
}

main().catch(console.error);
