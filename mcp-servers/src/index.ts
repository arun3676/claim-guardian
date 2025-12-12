#!/usr/bin/env node
/**
 * ClaimGuardian MCP Server v2.0 - ENHANCED
 * Custom Model Context Protocol server for medical billing automation
 * 
 * KEY DIFFERENTIATOR: Integrates with our fine-tuned Oumi model!
 * 
 * Built for AssembleHack25 - Cline Prize Submission ($5,000)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// =============================================================================
// CONFIGURATION - Your HuggingFace Model
// =============================================================================
const HF_MODEL_ID = "arunn7/claimguardian-medical-billing-v2";
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL_ID}`;

// =============================================================================
// CPT CODE DATABASE (Expanded with Real CMS Data)
// =============================================================================
const CPT_CODES: Record<string, { code: string; description: string; avgCost: number; category: string; rvu: number }> = {
  // Surgery - General
  "laparoscopic cholecystectomy": { code: "47562", description: "Laparoscopic cholecystectomy", avgCost: 15000, category: "Surgery", rvu: 10.38 },
  "appendectomy": { code: "44970", description: "Laparoscopic appendectomy", avgCost: 12000, category: "Surgery", rvu: 8.47 },
  "hernia repair": { code: "49650", description: "Laparoscopic inguinal hernia repair", avgCost: 8000, category: "Surgery", rvu: 7.22 },
  
  // Radiology - Imaging
  "mri brain": { code: "70553", description: "MRI brain with and without contrast", avgCost: 3500, category: "Radiology", rvu: 2.78 },
  "mri brain without contrast": { code: "70551", description: "MRI brain without contrast", avgCost: 2500, category: "Radiology", rvu: 1.92 },
  "mri brain with contrast": { code: "70552", description: "MRI brain with contrast", avgCost: 3000, category: "Radiology", rvu: 2.35 },
  "ct scan chest": { code: "71250", description: "CT thorax without contrast", avgCost: 1500, category: "Radiology", rvu: 1.28 },
  "ct scan chest with contrast": { code: "71260", description: "CT thorax with contrast", avgCost: 2000, category: "Radiology", rvu: 1.74 },
  "ct scan abdomen": { code: "74150", description: "CT abdomen without contrast", avgCost: 1800, category: "Radiology", rvu: 1.40 },
  "chest xray": { code: "71046", description: "Chest X-ray, 2 views", avgCost: 300, category: "Radiology", rvu: 0.22 },
  "mammogram": { code: "77067", description: "Screening mammography, bilateral", avgCost: 400, category: "Radiology", rvu: 1.09 },
  
  // Cardiology
  "echocardiogram": { code: "93306", description: "Echocardiography, complete", avgCost: 2000, category: "Cardiology", rvu: 1.50 },
  "ekg": { code: "93000", description: "Electrocardiogram, complete", avgCost: 150, category: "Cardiology", rvu: 0.17 },
  "stress test": { code: "93015", description: "Cardiovascular stress test", avgCost: 800, category: "Cardiology", rvu: 0.75 },
  "cardiac catheterization": { code: "93458", description: "Left heart catheterization", avgCost: 15000, category: "Cardiology", rvu: 6.86 },
  
  // Orthopedics
  "knee replacement": { code: "27447", description: "Total knee arthroplasty", avgCost: 50000, category: "Orthopedics", rvu: 20.72 },
  "hip replacement": { code: "27130", description: "Total hip arthroplasty", avgCost: 45000, category: "Orthopedics", rvu: 20.71 },
  "knee arthroscopy": { code: "29881", description: "Knee arthroscopy with meniscectomy", avgCost: 8000, category: "Orthopedics", rvu: 4.88 },
  "rotator cuff repair": { code: "23412", description: "Repair of rotator cuff", avgCost: 12000, category: "Orthopedics", rvu: 12.86 },
  
  // Gastroenterology
  "colonoscopy": { code: "45378", description: "Colonoscopy, diagnostic", avgCost: 3000, category: "Gastroenterology", rvu: 3.36 },
  "colonoscopy with biopsy": { code: "45380", description: "Colonoscopy with biopsy", avgCost: 3500, category: "Gastroenterology", rvu: 4.43 },
  "colonoscopy with polypectomy": { code: "45385", description: "Colonoscopy with polypectomy", avgCost: 4000, category: "Gastroenterology", rvu: 5.18 },
  "upper endoscopy": { code: "43239", description: "Upper GI endoscopy with biopsy", avgCost: 2500, category: "Gastroenterology", rvu: 2.89 },
  
  // E/M - Office Visits
  "office visit new patient level 3": { code: "99203", description: "Office visit, new patient, low complexity", avgCost: 200, category: "E/M", rvu: 1.60 },
  "office visit new patient level 4": { code: "99204", description: "Office visit, new patient, moderate complexity", avgCost: 300, category: "E/M", rvu: 2.60 },
  "office visit new patient level 5": { code: "99205", description: "Office visit, new patient, high complexity", avgCost: 400, category: "E/M", rvu: 3.50 },
  "office visit established level 3": { code: "99213", description: "Office visit, established, low complexity", avgCost: 120, category: "E/M", rvu: 1.30 },
  "office visit established level 4": { code: "99214", description: "Office visit, established, moderate complexity", avgCost: 180, category: "E/M", rvu: 1.92 },
  "office visit established level 5": { code: "99215", description: "Office visit, established, high complexity", avgCost: 250, category: "E/M", rvu: 2.80 },
  
  // Emergency
  "er visit level 3": { code: "99283", description: "Emergency department visit, moderate severity", avgCost: 500, category: "Emergency", rvu: 1.58 },
  "er visit level 4": { code: "99284", description: "Emergency department visit, high severity", avgCost: 800, category: "Emergency", rvu: 2.74 },
  "er visit level 5": { code: "99285", description: "Emergency department visit, critical", avgCost: 1200, category: "Emergency", rvu: 4.00 },
  
  // Laboratory
  "blood panel comprehensive": { code: "80053", description: "Comprehensive metabolic panel", avgCost: 50, category: "Laboratory", rvu: 0.00 },
  "cbc": { code: "85025", description: "Complete blood count with differential", avgCost: 30, category: "Laboratory", rvu: 0.00 },
  "lipid panel": { code: "80061", description: "Lipid panel", avgCost: 40, category: "Laboratory", rvu: 0.00 },
  "hemoglobin a1c": { code: "83036", description: "Hemoglobin A1c", avgCost: 35, category: "Laboratory", rvu: 0.00 },
  "thyroid panel": { code: "84443", description: "Thyroid stimulating hormone (TSH)", avgCost: 45, category: "Laboratory", rvu: 0.00 },
  "urinalysis": { code: "81003", description: "Urinalysis, automated", avgCost: 15, category: "Laboratory", rvu: 0.00 },
};

// =============================================================================
// ICD-10 CODE DATABASE (Expanded)
// =============================================================================
const ICD10_CODES: Record<string, { code: string; description: string; category: string }> = {
  // Endocrine
  "type 2 diabetes": { code: "E11.9", description: "Type 2 diabetes mellitus without complications", category: "Endocrine" },
  "type 1 diabetes": { code: "E10.9", description: "Type 1 diabetes mellitus without complications", category: "Endocrine" },
  "hypothyroidism": { code: "E03.9", description: "Hypothyroidism, unspecified", category: "Endocrine" },
  "hyperthyroidism": { code: "E05.90", description: "Thyrotoxicosis, unspecified", category: "Endocrine" },
  
  // Cardiovascular
  "hypertension": { code: "I10", description: "Essential (primary) hypertension", category: "Cardiovascular" },
  "heart failure": { code: "I50.9", description: "Heart failure, unspecified", category: "Cardiovascular" },
  "atrial fibrillation": { code: "I48.91", description: "Unspecified atrial fibrillation", category: "Cardiovascular" },
  "coronary artery disease": { code: "I25.10", description: "Atherosclerotic heart disease", category: "Cardiovascular" },
  "chest pain": { code: "R07.9", description: "Chest pain, unspecified", category: "Symptoms" },
  
  // Respiratory
  "asthma": { code: "J45.909", description: "Unspecified asthma, uncomplicated", category: "Respiratory" },
  "copd": { code: "J44.9", description: "Chronic obstructive pulmonary disease", category: "Respiratory" },
  "pneumonia": { code: "J18.9", description: "Pneumonia, unspecified organism", category: "Respiratory" },
  "bronchitis": { code: "J40", description: "Bronchitis, not specified as acute or chronic", category: "Respiratory" },
  
  // Musculoskeletal
  "back pain": { code: "M54.5", description: "Low back pain", category: "Musculoskeletal" },
  "osteoarthritis knee": { code: "M17.9", description: "Osteoarthritis of knee, unspecified", category: "Musculoskeletal" },
  "osteoarthritis hip": { code: "M16.9", description: "Osteoarthritis of hip, unspecified", category: "Musculoskeletal" },
  "osteoporosis": { code: "M81.0", description: "Age-related osteoporosis without fracture", category: "Musculoskeletal" },
  
  // Mental Health
  "anxiety": { code: "F41.9", description: "Anxiety disorder, unspecified", category: "Mental Health" },
  "depression": { code: "F32.9", description: "Major depressive disorder, single episode", category: "Mental Health" },
  "insomnia": { code: "G47.00", description: "Insomnia, unspecified", category: "Mental Health" },
  
  // GI
  "gerd": { code: "K21.0", description: "Gastro-esophageal reflux disease with esophagitis", category: "Gastrointestinal" },
  "appendicitis": { code: "K35.80", description: "Unspecified acute appendicitis", category: "Gastrointestinal" },
  "gallstones": { code: "K80.20", description: "Calculus of gallbladder without cholecystitis", category: "Gastrointestinal" },
  "ibs": { code: "K58.9", description: "Irritable bowel syndrome without diarrhea", category: "Gastrointestinal" },
};

// =============================================================================
// BILLING ERROR DETECTION RULES (CMS-Based)
// =============================================================================
interface BillingRule {
  id: string;
  name: string;
  description: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  check: (bill: BillAnalysis) => { violated: boolean; details: string };
}

interface BillAnalysis {
  procedures: string[];
  codes: string[];
  charges: number[];
  totalBilled: number;
  dateOfService?: string;
  placeOfService?: string;
}

const BILLING_RULES: BillingRule[] = [
  {
    id: "NCCI_EDIT",
    name: "NCCI Edit Violation",
    description: "Procedures that should not be billed together per CMS NCCI edits",
    severity: "Critical",
    check: (bill) => {
      // Example: 93000 (EKG) shouldn't be separately billed with 93015 (stress test)
      const hasEKG = bill.codes.includes("93000");
      const hasStressTest = bill.codes.includes("93015");
      if (hasEKG && hasStressTest) {
        return { violated: true, details: "EKG (93000) is bundled into stress test (93015) and should not be billed separately" };
      }
      return { violated: false, details: "" };
    }
  },
  {
    id: "DUPLICATE_SERVICE",
    name: "Duplicate Service",
    description: "Same service billed multiple times on same date",
    severity: "High",
    check: (bill) => {
      const duplicates = bill.codes.filter((code, index) => bill.codes.indexOf(code) !== index);
      if (duplicates.length > 0) {
        return { violated: true, details: `Duplicate codes found: ${duplicates.join(", ")}` };
      }
      return { violated: false, details: "" };
    }
  },
  {
    id: "UPCODING_DETECTION",
    name: "Potential Upcoding",
    description: "Billing for more expensive service than documented",
    severity: "Critical",
    check: (bill) => {
      // Check for level 5 E/M codes which require extensive documentation
      const highLevelEM = bill.codes.filter(c => ["99205", "99215", "99285"].includes(c));
      if (highLevelEM.length > 0) {
        return { violated: true, details: `High-level E/M code(s) ${highLevelEM.join(", ")} billed - verify documentation supports complexity level` };
      }
      return { violated: false, details: "" };
    }
  },
  {
    id: "PRICE_VARIANCE",
    name: "Excessive Price Variance",
    description: "Charge significantly above regional average",
    severity: "Medium",
    check: (bill) => {
      const alerts: string[] = [];
      bill.codes.forEach((code, index) => {
        const procedureEntry = Object.entries(CPT_CODES).find(([_, v]) => v.code === code);
        if (procedureEntry && bill.charges[index]) {
          const expected = procedureEntry[1].avgCost;
          const actual = bill.charges[index];
          const variance = ((actual - expected) / expected) * 100;
          if (variance > 100) {
            alerts.push(`${code}: Charged $${actual} vs average $${expected} (${variance.toFixed(0)}% above)`);
          }
        }
      });
      if (alerts.length > 0) {
        return { violated: true, details: alerts.join("; ") };
      }
      return { violated: false, details: "" };
    }
  },
  {
    id: "UNBUNDLING",
    name: "Potential Unbundling",
    description: "Services that should be bundled are billed separately",
    severity: "High",
    check: (bill) => {
      // Check for common unbundling patterns
      const hasColonoscopy = bill.codes.some(c => c.startsWith("4537") || c.startsWith("4538"));
      const hasSeparateBiopsy = bill.codes.includes("88305"); // Surgical pathology
      if (hasColonoscopy && hasSeparateBiopsy) {
        return { violated: true, details: "Biopsy during colonoscopy should use colonoscopy with biopsy code (45380), not separate pathology code" };
      }
      return { violated: false, details: "" };
    }
  }
];

// =============================================================================
// CLAIM VALIDATION LOGIC
// =============================================================================

// ========================================================================
// CODE FORMAT VALIDATION REGEXES
// ========================================================================
const CPT_CODE_REGEX = /^[0-9]{5}(-[A-Z0-9]{2})?$/;
const ICD10_CODE_REGEX = /^[A-Z][0-9]{2}\.?[0-9A-Z]{0,4}$/;
interface ValidationResult {
  valid: boolean;
  errors: string[];
  suggestions: string[];
  claimId: string;
  analysis: {
    validCodes: string[];
    invalidCodes: string[];
    appropriateMatches: number;
    totalChecks: number;
  };
}

function validateInsuranceClaim(claimId: string, cptCodes: string[], diagnosisCodes: string[]): ValidationResult {
  const errors: string[] = [];
  const suggestions: string[] = [];
  const validCodes: string[] = [];
  const invalidCodes: string[] = [];
  let appropriateMatches = 0;
  let totalChecks = 0;

  
  // Medical appropriateness mapping
  const medicalMappings: Record<string, string[]> = {
    // Diagnosis categories -> Appropriate procedure categories
    "Cardiovascular": ["Cardiology"],
    "Respiratory": ["Respiratory"],
    "Gastrointestinal": ["Gastroenterology"],
    "Musculoskeletal": ["Orthopedics"],
    "Endocrine": ["Endocrine"],
    "Mental Health": ["Mental Health"],
    "Symptoms": ["E/M", "Radiology"], // Symptoms can have broad procedures
  };

  // Validate CPT codes exist
  for (const cptCode of cptCodes) {
    // Validate format first
    if (!CPT_CODE_REGEX.test(cptCode)) {
      errors.push(`CPT code ${cptCode} has invalid format`);
      invalidCodes.push(cptCode);
      continue;
    }

    const procedure = Object.values(CPT_CODES).find(p => p.code === cptCode);
    if (!procedure) {
      errors.push(`CPT code ${cptCode} not found in database`);
      invalidCodes.push(cptCode);
    } else {
      validCodes.push(cptCode);
    }
  }

  // Validate ICD-10 codes exist
  const validDiagnoses: string[] = [];
  for (const icdCode of diagnosisCodes) {
    // Validate format first
    if (!ICD10_CODE_REGEX.test(icdCode)) {
      errors.push(`ICD-10 code ${icdCode} has invalid format`);
      continue;
    }

    const diagnosis = Object.values(ICD10_CODES).find(d => d.code === icdCode);
    if (!diagnosis) {
      errors.push(`ICD-10 code ${icdCode} not found in database`);
    } else {
      validDiagnoses.push(icdCode);
    }
  }

  // Cross-reference medical appropriateness
  for (const cptCode of validCodes) {
    const procedure = Object.values(CPT_CODES).find(p => p.code === cptCode);
    if (!procedure) continue;

    for (const icdCode of validDiagnoses) {
      const diagnosis = Object.values(ICD10_CODES).find(d => d.code === icdCode);
      if (!diagnosis) continue;

      totalChecks++;

      // Check if procedure category matches diagnosis category
      const appropriateCategories = medicalMappings[diagnosis.category] || [];
      if (appropriateCategories.includes(procedure.category)) {
        appropriateMatches++;
      } else {
        // Check for special cases
        let isAppropriate = false;

        // Radiology can be appropriate for many diagnoses
        if (procedure.category === "Radiology" && ["Cardiovascular", "Respiratory", "Gastrointestinal", "Musculoskeletal"].includes(diagnosis.category)) {
          isAppropriate = true;
        }

        // E/M visits can be appropriate for any diagnosis
        if (procedure.category === "E/M") {
          isAppropriate = true;
        }

        // Laboratory can be appropriate for many conditions
        if (procedure.category === "Laboratory" && ["Endocrine", "Cardiovascular", "Gastrointestinal"].includes(diagnosis.category)) {
          isAppropriate = true;
        }

        if (!isAppropriate) {
          errors.push(`CPT ${cptCode} (${procedure.category}) may not be medically appropriate for diagnosis ${icdCode} (${diagnosis.category})`);
          suggestions.push(`Consider if ${procedure.description} is truly indicated for ${diagnosis.description}`);
        } else {
          appropriateMatches++;
        }
      }
    }
  }

  // Check for missing primary diagnosis
  if (validDiagnoses.length === 0) {
    errors.push("No valid diagnosis codes found - claim requires at least one valid ICD-10 code");
  }

  // Check for missing procedures
  if (validCodes.length === 0) {
    errors.push("No valid procedure codes found - claim requires at least one valid CPT code");
  }

  // Generate suggestions for invalid codes
  if (invalidCodes.length > 0) {
    suggestions.push("Verify CPT codes against current AMA CPT manual");
    suggestions.push("Check for updated procedure codes if services were recent");
  }

  // Overall validity
  const valid = errors.length === 0 && validCodes.length > 0 && validDiagnoses.length > 0;

  return {
    valid,
    errors,
    suggestions,
    claimId,
    analysis: {
      validCodes,
      invalidCodes,
      appropriateMatches,
      totalChecks
    }
  };
}

// =============================================================================
// HELPER: Call HuggingFace Model
// =============================================================================
async function callOumiModel(prompt: string, hfToken?: string): Promise<string> {
  if (!hfToken) {
    return "Model inference requires HuggingFace API token. Set HF_TOKEN environment variable.";
  }

  try {
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${hfToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: `### Instruction:\n${prompt}\n\n### Response:\n`,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.7,
          do_sample: true
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return `Model API error: ${error}`;
    }

    const result = await response.json();
    if (Array.isArray(result) && result[0]?.generated_text) {
      const fullText = result[0].generated_text;
      const responseStart = fullText.indexOf("### Response:");
      if (responseStart !== -1) {
        return fullText.substring(responseStart + 14).trim();
      }
      return fullText;
    }
    return JSON.stringify(result);
  } catch (error) {
    return `Error calling model: ${error}`;
  }
}

// =============================================================================
// MCP SERVER INITIALIZATION
// =============================================================================
const server = new McpServer({
  name: "claimguardian-mcp",
  version: "2.0.0",
});

// Get HF token from environment
const HF_TOKEN = process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN;

// =============================================================================
// TOOL 1: CPT Code Lookup (Enhanced with RVU)
// =============================================================================
server.tool(
  "lookup_cpt_code",
  "Look up CPT (procedure) codes for medical procedures. Returns billing code, description, average cost, category, and RVU (Relative Value Units).",
  {
    procedure: z.string().describe("The medical procedure to look up"),
  },
  async ({ procedure }) => {
    const procedureLower = procedure.toLowerCase();
    
    // Fuzzy search for best match
    let bestMatch = null;
    let bestScore = 0;
    
    for (const [key, value] of Object.entries(CPT_CODES)) {
      const keyWords = key.split(' ');
      const procWords = procedureLower.split(' ');
      let score = 0;
      
      for (const word of procWords) {
        if (keyWords.some(kw => kw.includes(word) || word.includes(kw))) {
          score++;
        }
      }
      
      if (score > bestScore || (score === bestScore && key.includes(procedureLower))) {
        bestScore = score;
        bestMatch = { key, ...value };
      }
    }
    
    if (bestMatch && bestScore > 0) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            cpt_code: bestMatch.code,
            description: bestMatch.description,
            average_cost: `$${bestMatch.avgCost.toLocaleString()}`,
            category: bestMatch.category,
            rvu: bestMatch.rvu,
            medicare_rate_estimate: `$${(bestMatch.rvu * 33.89).toFixed(2)}`, // 2024 conversion factor
            recommendation: "Verify this code matches the exact procedure performed and documentation supports medical necessity.",
            matched_procedure: bestMatch.key
          }, null, 2)
        }]
      };
    }
    
    // Fallback: Try AI model for unknown procedures
    const aiResponse = await callOumiModel(
      `Patient underwent ${procedure}. What is the correct CPT code?`,
      HF_TOKEN
    );
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: false,
          searched_for: procedure,
          message: "No exact match in database.",
          ai_suggestion: aiResponse,
          available_categories: [...new Set(Object.values(CPT_CODES).map(c => c.category))],
          tip: "Try more specific terms like 'mri brain with contrast' or 'colonoscopy with biopsy'"
        }, null, 2)
      }]
    };
  }
);

// =============================================================================
// TOOL 2: ICD-10 Diagnosis Code Lookup (Enhanced)
// =============================================================================
server.tool(
  "lookup_icd10_code",
  "Look up ICD-10 diagnosis codes for medical conditions.",
  {
    diagnosis: z.string().describe("The medical diagnosis or condition to look up"),
  },
  async ({ diagnosis }) => {
    // LOG: Tool was actually called!
    console.error(`[MCP TOOL CALLED] lookup_icd10_code called with diagnosis: "${diagnosis}"`);
    console.error(`[MCP DEBUG] Full arguments received:`, JSON.stringify({ diagnosis }, null, 2));
    
    // Handle case where task_progress might be passed (Cline sometimes adds extra args)
    let cleanDiagnosis: string;
    if (typeof diagnosis === 'string') {
      cleanDiagnosis = diagnosis;
    } else if (typeof diagnosis === 'object' && diagnosis !== null && 'diagnosis' in diagnosis) {
      cleanDiagnosis = String((diagnosis as { diagnosis: string }).diagnosis);
    } else {
      cleanDiagnosis = String(diagnosis);
    }
    
    const diagnosisLower = cleanDiagnosis.toLowerCase().trim();
    
    // First, check for exact match
    if (ICD10_CODES[diagnosisLower]) {
      const timestamp = new Date().toISOString();
      const toolCallId = `MCP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.error(`[MCP TOOL RESULT] Exact match found: ${ICD10_CODES[diagnosisLower].code}`);
      console.error(`[MCP TOOL CALL ID] ${toolCallId}`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            icd10_code: ICD10_CODES[diagnosisLower].code,
            description: ICD10_CODES[diagnosisLower].description,
            category: ICD10_CODES[diagnosisLower].category,
            matched_term: diagnosisLower,
            match_type: "exact",
            _mcp_tool_called: true,
            _tool_call_id: toolCallId,
            _timestamp: timestamp,
            _server_version: "2.0.0"
          }, null, 2)
        }]
      };
    }
    
    // Check for acronym match (e.g., "copd" in "chronic obstructive pulmonary disease")
    for (const [key, value] of Object.entries(ICD10_CODES)) {
      if (key.length <= 10 && diagnosisLower.includes(key)) {
        const timestamp = new Date().toISOString();
        const toolCallId = `MCP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.error(`[MCP TOOL RESULT] Acronym match found: ${value.code} (${key})`);
        console.error(`[MCP TOOL CALL ID] ${toolCallId}`);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              icd10_code: value.code,
              description: value.description,
              category: value.category,
              matched_term: key,
              match_type: "acronym",
              _mcp_tool_called: true,
              _tool_call_id: toolCallId,
              _timestamp: timestamp,
              _server_version: "2.0.0"
            }, null, 2)
          }]
        };
      }
    }
    
    // Improved fuzzy matching with better scoring
    let bestMatch = null;
    let bestScore = 0;
    
    for (const [key, value] of Object.entries(ICD10_CODES)) {
      const keyLower = key.toLowerCase();
      const keyWords = keyLower.split(/[\s-]+/).filter((w: string) => w.length > 2); // Filter out short words
      const diagWords = diagnosisLower.split(/[\s-]+/).filter((w: string) => w.length > 2);
      
      // Skip common words that don't help matching
      const skipWords = ['disease', 'disorder', 'syndrome', 'chronic', 'acute', 'unspecified'];
      const relevantKeyWords = keyWords.filter((w: string) => !skipWords.includes(w));
      const relevantDiagWords = diagWords.filter((w: string) => !skipWords.includes(w));
      
      let score = 0;
      let exactMatches = 0;
      
      // Check for exact word matches (higher weight)
      for (const diagWord of relevantDiagWords) {
        if (relevantKeyWords.includes(diagWord)) {
          exactMatches++;
          score += 3; // Higher weight for exact matches
        } else if (keyLower.includes(diagWord) || diagWord.includes(keyLower)) {
          score += 1; // Lower weight for substring matches
        }
      }
      
      // Bonus if query contains the key as substring (e.g., "copd" in "chronic obstructive pulmonary disease")
      if (diagnosisLower.includes(keyLower) && keyLower.length <= 15) {
        score += 5;
      }
      
      // Require at least one exact match for short keys, or multiple word matches
      const minThreshold = keyWords.length <= 2 ? 1 : Math.ceil(keyWords.length * 0.5);
      
      if (score > bestScore && (exactMatches >= minThreshold || score >= 5)) {
        bestScore = score;
        bestMatch = { key, ...value };
      }
    }
    
    if (bestMatch && bestScore > 0) {
      console.error(`[MCP TOOL RESULT] Found match: ${bestMatch.code} for "${diagnosis}"`);
      const timestamp = new Date().toISOString();
      const toolCallId = `MCP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.error(`[MCP TOOL CALL ID] ${toolCallId}`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            icd10_code: bestMatch.code,
            description: bestMatch.description,
            category: bestMatch.category,
            matched_term: bestMatch.key,
            match_type: "fuzzy",
            _mcp_tool_called: true,
            _tool_call_id: toolCallId,
            _timestamp: timestamp,
            _server_version: "2.0.0",
            documentation_requirements: [
              "Clinical findings supporting diagnosis",
              "Relevant test results or imaging",
              "Treatment plan addressing condition",
              "Follow-up care documentation"
            ]
          }, null, 2)
        }]
      };
    }
    
    console.error(`[MCP TOOL RESULT] No match found, using AI fallback for "${cleanDiagnosis}"`);
    
    const timestamp = new Date().toISOString();
    const toolCallId = `MCP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.error(`[MCP TOOL CALL ID] ${toolCallId}`);
    
    // Fallback to AI
    const aiResponse = await callOumiModel(
      `Patient diagnosed with ${cleanDiagnosis}. Assign the ICD-10 code.`,
      HF_TOKEN
    );
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: false,
          searched_for: cleanDiagnosis,
          message: "No exact match in database.",
          ai_suggestion: aiResponse,
          available_categories: [...new Set(Object.values(ICD10_CODES).map(c => c.category))],
          _mcp_tool_called: true,
          _tool_call_id: toolCallId,
          _timestamp: timestamp,
          _server_version: "2.0.0"
        }, null, 2)
      }]
    };
  }
);

// =============================================================================
// TOOL 3: AI-Powered Billing Error Detection (THE DIFFERENTIATOR!)
// =============================================================================
server.tool(
  "detect_billing_errors",
  "AI-powered analysis of medical bills for billing errors using CMS rules and our trained ClaimGuardian model. Checks for NCCI edits, upcoding, unbundling, duplicates, and price anomalies.",
  {
    procedures: z.array(z.string()).describe("List of procedures on the bill"),
    codes: z.array(z.string()).optional().describe("CPT codes if known"),
    charges: z.array(z.number()).optional().describe("Charges for each procedure"),
    total_billed: z.number().describe("Total amount billed"),
    additional_context: z.string().optional().describe("Any additional bill details"),
  },
  async ({ procedures, codes = [], charges = [], total_billed, additional_context }) => {
    // Build bill analysis object
    const bill: BillAnalysis = {
      procedures,
      codes: codes.length > 0 ? codes : procedures.map(p => {
        const match = Object.entries(CPT_CODES).find(([key]) => 
          p.toLowerCase().includes(key) || key.includes(p.toLowerCase())
        );
        return match ? match[1].code : "UNKNOWN";
      }),
      charges,
      totalBilled: total_billed
    };
    
    // Run all billing rules
    const violations: Array<{
      rule: string;
      severity: string;
      description: string;
      details: string;
      action_required: string;
    }> = [];
    
    for (const rule of BILLING_RULES) {
      const result = rule.check(bill);
      if (result.violated) {
        violations.push({
          rule: rule.name,
          severity: rule.severity,
          description: rule.description,
          details: result.details,
          action_required: rule.severity === "Critical" 
            ? "Request itemized bill and dispute immediately"
            : rule.severity === "High"
            ? "Contact billing department for explanation"
            : "Review and monitor"
        });
      }
    }
    
    // Calculate expected total
    let expectedTotal = 0;
    bill.codes.forEach(code => {
      const proc = Object.values(CPT_CODES).find(p => p.code === code);
      if (proc) expectedTotal += proc.avgCost;
    });
    
    // Get AI analysis
    const aiAnalysisPrompt = `Review this medical bill for errors:
Procedures: ${procedures.join(", ")}
Total billed: $${total_billed}
${additional_context ? `Additional info: ${additional_context}` : ""}
Check for billing errors.`;
    
    const aiAnalysis = await callOumiModel(aiAnalysisPrompt, HF_TOKEN);
    
    // Calculate risk score
    const riskScore = violations.reduce((score, v) => {
      return score + (v.severity === "Critical" ? 40 : v.severity === "High" ? 25 : v.severity === "Medium" ? 10 : 5);
    }, 0);
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          analysis_timestamp: new Date().toISOString(),
          bill_summary: {
            procedures_analyzed: procedures.length,
            codes_identified: bill.codes,
            total_billed: `$${total_billed.toLocaleString()}`,
            expected_range: `$${(expectedTotal * 0.8).toLocaleString()} - $${(expectedTotal * 1.5).toLocaleString()}`,
            variance: expectedTotal > 0 ? `${(((total_billed - expectedTotal) / expectedTotal) * 100).toFixed(1)}%` : "Unable to calculate"
          },
          risk_assessment: {
            score: Math.min(riskScore, 100),
            level: riskScore >= 50 ? "HIGH" : riskScore >= 25 ? "MEDIUM" : "LOW",
            recommendation: riskScore >= 50 
              ? "DISPUTE RECOMMENDED - Multiple billing concerns identified"
              : riskScore >= 25 
              ? "REVIEW RECOMMENDED - Some concerns warrant attention"
              : "LOW RISK - Bill appears reasonable"
          },
          violations_found: violations,
          ai_model_analysis: aiAnalysis,
          next_steps: violations.length > 0 ? [
            "1. Request itemized bill with all CPT codes",
            "2. Request medical records for date of service",
            "3. Compare charges to Medicare rates (use our lookup tool)",
            "4. File formal dispute if errors confirmed",
            "5. Contact state insurance commissioner if unresolved"
          ] : [
            "Bill appears reasonable, but always verify charges against your EOB"
          ]
        }, null, 2)
      }]
    };
  }
);

// =============================================================================
// TOOL 4: Appeal Letter Generator (Enhanced with Legal References)
// =============================================================================
server.tool(
  "generate_appeal_letter",
  "Generate a comprehensive, legally-referenced insurance appeal letter for denied claims.",
  {
    patient_name: z.string().describe("Patient's full name"),
    claim_number: z.string().describe("Insurance claim or reference number"),
    insurance_company: z.string().describe("Name of the insurance company"),
    denial_reason: z.string().describe("Reason given for claim denial"),
    procedure_description: z.string().describe("Description of the medical procedure/service"),
    procedure_code: z.string().optional().describe("CPT code for the procedure"),
    diagnosis: z.string().optional().describe("Medical diagnosis"),
    supporting_facts: z.string().describe("Medical facts supporting why the claim should be approved"),
    appeal_level: z.enum(["first", "second", "external"]).optional().describe("Level of appeal"),
  },
  async ({ patient_name, claim_number, insurance_company, denial_reason, procedure_description, procedure_code, diagnosis, supporting_facts, appeal_level = "first" }) => {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 30);
    const deadline = deadlineDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Get procedure info if code provided
    let procedureInfo = "";
    if (procedure_code) {
      const proc = Object.values(CPT_CODES).find(p => p.code === procedure_code);
      if (proc) {
        procedureInfo = `\nPROCEDURE DETAILS:\n- CPT Code: ${procedure_code}\n- Standard Description: ${proc.description}\n- Category: ${proc.category}\n- Medicare RVU: ${proc.rvu}\n`;
      }
    }
    
    const appealTypeText = appeal_level === "external" 
      ? "EXTERNAL REVIEW REQUEST" 
      : appeal_level === "second" 
      ? "SECOND LEVEL APPEAL"
      : "FIRST LEVEL APPEAL";
    
    const legalReference = appeal_level === "external"
      ? `This request for external review is made pursuant to the Patient Protection and Affordable Care Act (ACA), 
Section 2719, which guarantees the right to external review for denied claims. Under 45 CFR § 147.136, 
you are required to comply with this request within 45 days (or 72 hours for urgent claims).`
      : `This appeal is submitted pursuant to ERISA Section 503 (29 U.S.C. § 1133) and Department of Labor 
regulations at 29 CFR § 2560.503-1, which require full and fair review of denied claims. Under these 
regulations, you must provide a written decision within 30 days (or 72 hours for urgent claims).`;
    
    const appealLetter = `
================================================================================
${appealTypeText} - MEDICAL CLAIM DENIAL
================================================================================

Date: ${today}
Via: Certified Mail, Return Receipt Requested

${insurance_company}
Appeals Department
[ADDRESS - Please fill in from your EOB]

Re: ${appealTypeText}
    Claim Number: ${claim_number}
    Patient: ${patient_name}
    Date of Service: [Please fill in]
    
--------------------------------------------------------------------------------

Dear Appeals Review Committee:

I am writing to formally appeal the denial of the above-referenced claim. Your denial 
letter dated [DATE] cited the following reason: "${denial_reason}"

I respectfully but firmly disagree with this denial for the reasons detailed below.

PROCEDURE IN QUESTION:
${procedure_description}
${procedureInfo}
${diagnosis ? `\nDIAGNOSIS: ${diagnosis}` : ""}

--------------------------------------------------------------------------------
GROUNDS FOR APPEAL
--------------------------------------------------------------------------------

${supporting_facts}

--------------------------------------------------------------------------------
MEDICAL NECESSITY ARGUMENT
--------------------------------------------------------------------------------

The procedure in question meets all standard criteria for medical necessity:

1. The service was appropriate for the patient's symptoms and diagnosis
2. The service was provided in accordance with accepted standards of medical practice
3. The service was not primarily for the convenience of the patient or provider
4. The service was the most appropriate level of care that could safely be provided

${procedure_code ? `The CPT code ${procedure_code} is the correct code for this service as defined by the 
American Medical Association's Current Procedural Terminology guidelines.` : ""}

--------------------------------------------------------------------------------
LEGAL REQUIREMENTS
--------------------------------------------------------------------------------

${legalReference}

Please note that under applicable law:
• You must provide a decision in writing within the required timeframe
• The decision must include specific reasons for any continued denial
• I have the right to request all documents relevant to my claim
• I have the right to an external review if this internal appeal is denied

--------------------------------------------------------------------------------
REQUESTED ACTION
--------------------------------------------------------------------------------

Based on the clinical evidence and legal requirements outlined above, I request that you:

1. Reverse the denial and approve the claim for payment
2. Process payment according to my policy benefits within 30 days
3. If you uphold the denial, provide:
   a. Specific clinical criteria used in making this decision
   b. Names and credentials of all reviewers
   c. All documents, records, and information relevant to the claim
   d. Instructions for requesting external review

--------------------------------------------------------------------------------
DEADLINE AND ESCALATION
--------------------------------------------------------------------------------

I expect your written response by ${deadline}. If I do not receive a response by this 
date, or if this appeal is denied without adequate justification, I will:

• File a complaint with the State Insurance Commissioner
• Request an external Independent Review Organization (IRO) review
• Consider all available legal remedies

Thank you for your prompt attention to this matter.

Respectfully submitted,



_______________________________________
${patient_name}
[Address]
[Phone]
[Email]

================================================================================
ENCLOSURES:
[ ] Copy of denial letter
[ ] Medical records for date of service
[ ] Physician's letter of medical necessity
[ ] Relevant clinical guidelines/studies
[ ] Copy of insurance policy/certificate of coverage
================================================================================

cc: State Insurance Commissioner
    Treating Physician
    [Attorney, if applicable]
`;

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: true,
          appeal_level: appeal_level,
          letter_generated: true,
          appeal_letter: appealLetter,
          key_deadlines: {
            your_deadline_to_appeal: "Usually 180 days from denial",
            insurer_response_deadline: appeal_level === "external" ? "45 days" : "30 days",
            urgent_claim_deadline: "72 hours"
          },
          checklist: [
            "☐ Fill in insurance company address from your EOB",
            "☐ Add date of denial letter",
            "☐ Add date of service",
            "☐ Attach copy of denial letter",
            "☐ Attach relevant medical records",
            "☐ Get letter of medical necessity from your doctor",
            "☐ Make copies of everything before sending",
            "☐ Send via certified mail with return receipt",
            "☐ Keep tracking number and delivery confirmation"
          ],
          legal_citations: {
            ERISA: "29 U.S.C. § 1133 - Claim and Appeal Procedures",
            ACA: "42 U.S.C. § 300gg-19 - Appeals Process",
            CFR: "29 CFR § 2560.503-1 - Claims Procedure Regulations"
          }
        }, null, 2)
      }]
    };
  }
);

// =============================================================================
// TOOL 5: Medicare Rate Calculator
// =============================================================================
server.tool(
  "calculate_medicare_rate",
  "Calculate the Medicare reimbursement rate for a procedure. Useful for comparing hospital charges to fair market value.",
  {
    procedure_or_code: z.string().describe("CPT code or procedure name"),
    facility_type: z.enum(["hospital_outpatient", "physician_office", "asc"]).optional().describe("Type of facility"),
  },
  async ({ procedure_or_code, facility_type = "physician_office" }) => {
    // Find the procedure
    let procedureInfo = Object.values(CPT_CODES).find(p => p.code === procedure_or_code);
    
    if (!procedureInfo) {
      const match = Object.entries(CPT_CODES).find(([key]) => 
        procedure_or_code.toLowerCase().includes(key) || key.includes(procedure_or_code.toLowerCase())
      );
      if (match) {
        procedureInfo = match[1];
      }
    }
    
    if (!procedureInfo) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            message: `Could not find procedure: ${procedure_or_code}`,
            tip: "Try using the CPT code directly (e.g., '70553') or common procedure names"
          }, null, 2)
        }]
      };
    }
    
    // 2024 Medicare conversion factor: $33.89
    const conversionFactor = 33.89;
    const baseRate = procedureInfo.rvu * conversionFactor;
    
    // Facility adjustments
    const facilityMultiplier = facility_type === "hospital_outpatient" ? 1.8 : facility_type === "asc" ? 1.2 : 1.0;
    const adjustedRate = baseRate * facilityMultiplier;
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: true,
          procedure: procedureInfo.description,
          cpt_code: procedureInfo.code,
          category: procedureInfo.category,
          rvu: procedureInfo.rvu,
          medicare_calculations: {
            conversion_factor_2024: `$${conversionFactor}`,
            base_physician_rate: `$${baseRate.toFixed(2)}`,
            facility_type: facility_type,
            facility_adjusted_rate: `$${adjustedRate.toFixed(2)}`
          },
          fair_price_range: {
            low: `$${(adjustedRate * 1.0).toFixed(2)}`,
            average: `$${(adjustedRate * 2.0).toFixed(2)}`,
            high: `$${(adjustedRate * 3.5).toFixed(2)}`,
            your_bill_comparison: `If billed over $${(adjustedRate * 4).toFixed(2)}, consider disputing`
          },
          typical_commercial_insurance_rate: `$${(adjustedRate * 1.5).toFixed(2)} - $${(adjustedRate * 2.5).toFixed(2)}`,
          negotiation_tip: `Medicare pays $${adjustedRate.toFixed(2)} for this procedure. Use this as leverage when negotiating with the billing department.`
        }, null, 2)
      }]
    };
  }
);

// =============================================================================
// TOOL 6: Comprehensive Bill Analysis Report
// =============================================================================
server.tool(
  "generate_bill_report",
  "Generate a comprehensive analysis report for a medical bill, suitable for disputing or understanding charges.",
  {
    procedures: z.array(z.object({
      name: z.string(),
      code: z.string().optional(),
      charge: z.number()
    })).describe("List of procedures with charges"),
    insurance_paid: z.number().optional().describe("Amount insurance paid"),
    patient_responsibility: z.number().optional().describe("Amount patient owes"),
    facility_name: z.string().optional().describe("Name of the hospital/clinic"),
  },
  async ({ procedures, insurance_paid, patient_responsibility, facility_name }) => {
    const totalBilled = procedures.reduce((sum, p) => sum + p.charge, 0);
    
    // Analyze each procedure
    const procedureAnalysis = procedures.map(proc => {
      const cptMatch = proc.code 
        ? Object.values(CPT_CODES).find(c => c.code === proc.code)
        : Object.entries(CPT_CODES).find(([key]) => 
            proc.name.toLowerCase().includes(key) || key.includes(proc.name.toLowerCase())
          )?.[1];
      
      const expectedCost = cptMatch?.avgCost || null;
      const variance = expectedCost ? ((proc.charge - expectedCost) / expectedCost * 100) : null;
      const medicareRate = cptMatch ? cptMatch.rvu * 33.89 : null;
      
      return {
        procedure: proc.name,
        cpt_code: proc.code || cptMatch?.code || "Unknown",
        your_charge: `$${proc.charge.toLocaleString()}`,
        average_cost: expectedCost ? `$${expectedCost.toLocaleString()}` : "Unknown",
        medicare_rate: medicareRate ? `$${medicareRate.toFixed(2)}` : "Unknown",
        variance_from_average: variance ? `${variance > 0 ? "+" : ""}${variance.toFixed(0)}%` : "Unknown",
        flag: variance && variance > 100 ? "⚠️ OVERCHARGE ALERT" : variance && variance > 50 ? "⚡ Above Average" : "✓ Reasonable"
      };
    });
    
    // Calculate totals
    const totalExpected = procedureAnalysis.reduce((sum, p) => {
      const avg = p.average_cost !== "Unknown" ? parseFloat(p.average_cost.replace(/[$,]/g, '')) : 0;
      return sum + avg;
    }, 0);
    
    const flaggedItems = procedureAnalysis.filter(p => p.flag.includes("OVERCHARGE") || p.flag.includes("Above"));
    
    const report = {
      report_generated: new Date().toISOString(),
      facility: facility_name || "Not specified",
      
      financial_summary: {
        total_billed: `$${totalBilled.toLocaleString()}`,
        insurance_paid: insurance_paid ? `$${insurance_paid.toLocaleString()}` : "Not specified",
        your_responsibility: patient_responsibility ? `$${patient_responsibility.toLocaleString()}` : "Not specified",
        expected_total: `$${totalExpected.toLocaleString()}`,
        potential_overcharge: totalExpected > 0 ? `$${Math.max(0, totalBilled - totalExpected * 1.5).toLocaleString()}` : "Unable to calculate"
      },
      
      procedure_breakdown: procedureAnalysis,
      
      flags_and_alerts: {
        items_flagged: flaggedItems.length,
        flagged_procedures: flaggedItems.map(p => p.procedure),
        total_overcharge_estimate: flaggedItems.reduce((sum, p) => {
          if (p.average_cost !== "Unknown") {
            const charge = parseFloat(p.your_charge.replace(/[$,]/g, ''));
            const avg = parseFloat(p.average_cost.replace(/[$,]/g, ''));
            return sum + Math.max(0, charge - avg * 1.5);
          }
          return sum;
        }, 0)
      },
      
      recommended_actions: flaggedItems.length > 0 ? [
        "1. Request itemized bill with full CPT code descriptions",
        "2. Request Explanation of Benefits (EOB) from insurance",
        "3. Compare charges to Medicare rates using our calculator tool",
        "4. Call billing department and ask for cash pay discount",
        "5. Request financial assistance application",
        "6. Consider formal dispute for flagged items",
        "7. Contact patient advocate if hospital has one"
      ] : [
        "Charges appear reasonable compared to averages",
        "Still request itemized bill for your records",
        "Check EOB to ensure insurance processed correctly"
      ],
      
      negotiation_scripts: {
        opening: `"I received a bill for $${totalBilled.toLocaleString()} and I'd like to discuss the charges."`,
        comparison: `"I've researched that Medicare pays about $${(totalExpected * 0.7).toFixed(2)} for these procedures. Can you explain why my charges are significantly higher?"`,
        discount_request: `"What discounts are available? I'm able to pay $${(totalBilled * 0.4).toFixed(2)} today if we can settle this."`,
        hardship: `"I'm experiencing financial hardship. Do you have a charity care program or payment plan options?"`
      }
    };
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify(report, null, 2)
      }]
    };
  }
);

// =============================================================================
// TOOL 7: Insurance Claim Validation
// =============================================================================
server.tool(
  "validate_insurance_claim",
  "Validate an insurance claim by cross-referencing CPT procedure codes with ICD-10 diagnosis codes for medical appropriateness.",
  {
    claimId: z.string().describe("Unique identifier for the insurance claim"),
    cptCodes: z.array(z.string()).describe("List of CPT procedure codes on the claim"),
    diagnosisCodes: z.array(z.string()).describe("List of ICD-10 diagnosis codes for the patient"),
  },
  async ({ claimId, cptCodes, diagnosisCodes }) => {
    const result = validateInsuranceClaim(claimId, cptCodes, diagnosisCodes);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          validation_timestamp: new Date().toISOString(),
          claim_validation: result,
          summary: {
            status: result.valid ? "VALID" : "INVALID",
            error_count: result.errors.length,
            suggestion_count: result.suggestions.length,
            appropriateness_score: result.analysis.totalChecks > 0
              ? `${((result.analysis.appropriateMatches / result.analysis.totalChecks) * 100).toFixed(1)}%`
              : "N/A"
          },
          next_steps: result.valid ? [
            "Claim appears medically appropriate",
            "Proceed with billing submission",
            "Ensure all documentation supports codes used"
          ] : [
            "Review and correct identified issues",
            "Verify medical necessity documentation",
            "Consider consulting with coding specialist",
            "May need to revise procedure or diagnosis codes"
          ]
        }, null, 2)
      }]
    };
  }
);

// =============================================================================
// START THE SERVER
// =============================================================================
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ClaimGuardian MCP Server v2.0 running");
  console.error(`HuggingFace Model: ${HF_MODEL_ID}`);
  console.error(`HF Token: ${HF_TOKEN ? "Configured" : "Not set - AI features limited"}`);
  console.error(`Available tools: lookup_cpt_code, lookup_icd10_code, detect_billing_errors, generate_appeal_letter, calculate_medicare_rate, generate_bill_report, validate_insurance_claim`);
}

main().catch(console.error);
