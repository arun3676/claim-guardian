/**
 * Billing Parser Module
 * 
 * Parses extracted PDF text into structured billing data.
 * Uses regex patterns to identify CPT codes, charges, dates, etc.
 * 
 * This module is designed to work with the Cline MCP server
 * for medical billing analysis.
 */

export interface ParsedBillingItem {
  cptCode: string;
  description?: string;
  charge: number;
  quantity?: number;
  dateOfService?: string;
  modifier?: string;
}

export interface ParsedBillingData {
  success: boolean;
  patientInfo?: {
    name?: string;
    dob?: string;
    accountNumber?: string;
    insuranceId?: string;
  };
  providerInfo?: {
    name?: string;
    npi?: string;
    address?: string;
  };
  serviceDate?: string;
  procedures: ParsedBillingItem[];
  totalBilled: number;
  totalAdjustments?: number;
  patientResponsibility?: number;
  insurancePaid?: number;
  diagnosisCodes: string[];
  rawText?: string;
  parseWarnings: string[];
}

// CPT Code pattern: 5 digits, optionally followed by modifier
const CPT_CODE_PATTERN = /\b(\d{5})(?:-([A-Z0-9]{2}))?\b/g;

// ICD-10 Code pattern: Letter + 2 digits + optional decimal and more chars
const ICD10_PATTERN = /\b([A-Z]\d{2}(?:\.\d{1,4})?)\b/g;

// Currency pattern: $X,XXX.XX or X,XXX.XX
const CURRENCY_PATTERN = /\$?\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g;

// Date patterns: MM/DD/YYYY, YYYY-MM-DD, etc.
const DATE_PATTERN = /\b(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})\b/g;

// Patient name pattern (common formats)
const PATIENT_NAME_PATTERN = /(?:patient|name|pt)[\s:]+([A-Za-z]+(?:\s+[A-Za-z]+)+)/i;

// Account number pattern
const ACCOUNT_PATTERN = /(?:account|acct|a\/c)[\s#:]+([A-Z0-9-]+)/i;

// NPI pattern (10 digits)
const NPI_PATTERN = /(?:npi|provider\s*id)[\s#:]*(\d{10})/i;

/**
 * Parse billing text into structured data
 */
export function parseBillingText(text: string): ParsedBillingData {
  const warnings: string[] = [];
  const procedures: ParsedBillingItem[] = [];
  const diagnosisCodes: string[] = [];
  
  // Extract CPT codes and try to associate charges
  const cptMatches = [...text.matchAll(CPT_CODE_PATTERN)];
  const currencyMatches = [...text.matchAll(CURRENCY_PATTERN)];
  const dateMatches = [...text.matchAll(DATE_PATTERN)];
  
  // Find diagnosis codes
  const icdMatches = [...text.matchAll(ICD10_PATTERN)];
  for (const match of icdMatches) {
    const code = match[1];
    // Filter out false positives (dates, etc.)
    if (!diagnosisCodes.includes(code) && !code.match(/^\d{2}\./)) {
      diagnosisCodes.push(code);
    }
  }
  
  // Parse CPT codes with charges
  const lines = text.split('\n');
  for (const line of lines) {
    const lineCptMatch = line.match(/\b(\d{5})(?:-([A-Z0-9]{2}))?\b/);
    if (lineCptMatch) {
      const cptCode = lineCptMatch[1];
      const modifier = lineCptMatch[2];
      
      // Try to find a charge on the same line
      const lineCurrencyMatches = [...line.matchAll(CURRENCY_PATTERN)];
      let charge = 0;
      
      // Usually the last currency value on a line is the charge
      if (lineCurrencyMatches.length > 0) {
        const lastMatch = lineCurrencyMatches[lineCurrencyMatches.length - 1];
        charge = parseFloat(lastMatch[1].replace(/,/g, ''));
      }
      
      // Extract description (text between code and charge)
      let description = '';
      const codeIndex = line.indexOf(lineCptMatch[0]);
      if (codeIndex >= 0) {
        const afterCode = line.substring(codeIndex + lineCptMatch[0].length);
        // Take text before the first number (likely the charge)
        const descMatch = afterCode.match(/^([^$\d]+)/);
        if (descMatch) {
          description = descMatch[1].trim().replace(/[^\w\s]/g, '').trim();
        }
      }
      
      procedures.push({
        cptCode,
        modifier,
        description: description || undefined,
        charge,
      });
    }
  }
  
  // If no CPT codes found in line-by-line, try bulk extraction
  if (procedures.length === 0 && cptMatches.length > 0) {
    warnings.push('CPT codes found but could not be associated with charges');
    for (const match of cptMatches) {
      procedures.push({
        cptCode: match[1],
        modifier: match[2],
        charge: 0, // Unknown charge
      });
    }
  }
  
  // Calculate total
  const totalBilled = procedures.reduce((sum, p) => sum + p.charge, 0);
  
  // Try to extract patient info
  const patientNameMatch = text.match(PATIENT_NAME_PATTERN);
  const accountMatch = text.match(ACCOUNT_PATTERN);
  
  // Try to extract provider info
  const npiMatch = text.match(NPI_PATTERN);
  
  // Get service date (first date found is often service date)
  const serviceDate = dateMatches.length > 0 ? dateMatches[0][1] : undefined;
  
  // Look for totals in the text
  const totalPattern = /(?:total|balance|amount\s*due)[\s:$]+(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i;
  const totalMatch = text.match(totalPattern);
  let extractedTotal = totalBilled;
  if (totalMatch) {
    extractedTotal = parseFloat(totalMatch[1].replace(/,/g, ''));
    if (extractedTotal !== totalBilled && totalBilled > 0) {
      warnings.push(`Calculated total ($${totalBilled}) differs from document total ($${extractedTotal})`);
    }
  }
  
  // Look for patient responsibility
  const patientResponsibilityPattern = /(?:patient\s*(?:responsibility|amount|due)|you\s*owe)[\s:$]+(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i;
  const patientRespMatch = text.match(patientResponsibilityPattern);
  const patientResponsibility = patientRespMatch 
    ? parseFloat(patientRespMatch[1].replace(/,/g, '')) 
    : undefined;
  
  // Look for insurance paid
  const insurancePaidPattern = /(?:insurance\s*paid|ins\s*payment|plan\s*paid)[\s:$]+(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i;
  const insurancePaidMatch = text.match(insurancePaidPattern);
  const insurancePaid = insurancePaidMatch 
    ? parseFloat(insurancePaidMatch[1].replace(/,/g, '')) 
    : undefined;
  
  if (procedures.length === 0) {
    warnings.push('No procedures with CPT codes could be extracted');
  }
  
  if (diagnosisCodes.length === 0) {
    warnings.push('No ICD-10 diagnosis codes found');
  }
  
  return {
    success: procedures.length > 0 || diagnosisCodes.length > 0,
    patientInfo: {
      name: patientNameMatch?.[1],
      accountNumber: accountMatch?.[1],
    },
    providerInfo: {
      npi: npiMatch?.[1],
    },
    serviceDate,
    procedures,
    totalBilled: extractedTotal || totalBilled,
    patientResponsibility,
    insurancePaid,
    diagnosisCodes,
    rawText: text,
    parseWarnings: warnings,
  };
}

/**
 * Validate parsed billing data
 */
export function validateBillingData(data: ParsedBillingData): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings = [...data.parseWarnings];
  
  // Check for procedures
  if (data.procedures.length === 0) {
    errors.push('No procedures found in billing data');
  }
  
  // Validate CPT codes (should be 5 digits)
  for (const proc of data.procedures) {
    if (!/^\d{5}$/.test(proc.cptCode)) {
      errors.push(`Invalid CPT code format: ${proc.cptCode}`);
    }
    if (proc.charge < 0) {
      errors.push(`Negative charge for CPT ${proc.cptCode}`);
    }
  }
  
  // Validate ICD-10 codes
  for (const code of data.diagnosisCodes) {
    if (!/^[A-Z]\d{2}(?:\.\d{1,4})?$/.test(code)) {
      warnings.push(`Potentially invalid ICD-10 code: ${code}`);
    }
  }
  
  // Check totals
  if (data.totalBilled <= 0) {
    warnings.push('Total billed amount is zero or negative');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Convert parsed billing data to MCP tool format
 */
export function toMCPFormat(data: ParsedBillingData): {
  procedures: string[];
  codes: string[];
  charges: number[];
  total_billed: number;
  diagnosis_codes: string[];
} {
  return {
    procedures: data.procedures.map(p => p.description || `Procedure ${p.cptCode}`),
    codes: data.procedures.map(p => p.cptCode),
    charges: data.procedures.map(p => p.charge),
    total_billed: data.totalBilled,
    diagnosis_codes: data.diagnosisCodes,
  };
}

/**
 * Convert parsed billing data to Kestra workflow format
 */
export function toKestraFormat(data: ParsedBillingData): {
  patient_name: string;
  procedure: string;
  billed_amount: number;
  insurance_company: string;
} {
  // Get primary procedure (highest charge)
  const primaryProcedure = data.procedures.reduce(
    (max, p) => p.charge > max.charge ? p : max,
    data.procedures[0] || { cptCode: 'Unknown', description: 'Unknown procedure', charge: 0 }
  );
  
  return {
    patient_name: data.patientInfo?.name || 'Patient',
    procedure: primaryProcedure.description || `CPT ${primaryProcedure.cptCode}`,
    billed_amount: data.totalBilled,
    insurance_company: 'Unknown Insurance', // Would need to be extracted or provided
  };
}

