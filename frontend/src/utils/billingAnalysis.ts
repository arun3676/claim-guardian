/**
 * Utility functions for medical billing analysis
 * Following ClaimGuardian medical billing rules and HIPAA compliance
 */

// CPT code validation regex from medical billing rules
const CPT_CODE_REGEX = /^[0-9]{5}(-[A-Z0-9]{2})?$/;

/**
 * Input interface for billing items to be analyzed
 */
export interface BillingItem {
  /** CPT procedure code (must match ^[0-9]{5}(-[A-Z0-9]{2})?$) */
  cptCode: string;
  /** Amount billed by healthcare provider */
  billedAmount: number;
}

/**
 * Result interface for billing analysis
 */
export interface BillingAnalysisResult extends BillingItem {
  /** Medicare reimbursement rate for this CPT code */
  medicareRate: number;
  /** Overcharge percentage ((billed - medicare) / medicare * 100) */
  overchargePercentage: number;
  /** High priority flag for overcharges > 20% */
  isHighPriority: boolean;
}

/**
 * Analyzes billing items for overcharges compared to Medicare rates
 *
 * @param items - Array of billing items with CPT codes and billed amounts
 * @returns Promise resolving to sorted analysis results (highest overcharge first)
 *
 * @throws Error if any CPT code is invalid or if MCP tool calls fail
 *
 * @example
 * ```typescript
 * const items = [
 *   { cptCode: '99214', billedAmount: 250.00 },
 *   { cptCode: '85025', billedAmount: 75.00 }
 * ];
 * const results = await analyzeBillingErrors(items);
 * console.log(results[0].overchargePercentage); // Highest overcharge first
 * ```
 */
export async function analyzeBillingErrors(items: BillingItem[]): Promise<BillingAnalysisResult[]> {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Items array must be non-empty');
  }

  const results: BillingAnalysisResult[] = [];

  for (const item of items) {
    // Validate input
    if (!item.cptCode || typeof item.cptCode !== 'string') {
      throw new Error(`Invalid CPT code: ${item.cptCode}`);
    }

    if (!CPT_CODE_REGEX.test(item.cptCode)) {
      throw new Error(`CPT code ${item.cptCode} does not match required format ^[0-9]{5}(-[A-Z0-9]{2})?$`);
    }

    if (typeof item.billedAmount !== 'number' || item.billedAmount < 0) {
      throw new Error(`Invalid billed amount for CPT ${item.cptCode}: ${item.billedAmount}`);
    }

    try {
      // Get Medicare rate using MCP tool
      // Note: In production, this would use the actual MCP tool
      // const medicareResult = await useMcpTool('claimguardian', 'calculate_medicare_rate', {
      //   procedure: item.cptCode
      // });
      // const medicareRate = medicareResult.rate;

      // For now, simulate MCP call with sample rates
      const medicareRate = await getMockMedicareRate(item.cptCode);

      // Calculate overcharge percentage
      const overchargePercentage = ((item.billedAmount - medicareRate) / medicareRate) * 100;

      // Flag high priority overcharges (>20%)
      const isHighPriority = overchargePercentage > 20;

      results.push({
        ...item,
        medicareRate,
        overchargePercentage,
        isHighPriority
      });

    } catch (error) {
      // Log anonymized error for HIPAA compliance - no sensitive billing data exposed
      console.log(`Bill analysis error for CPT ${item.cptCode.substring(0, 3)}XXX`);
      throw new Error(`Failed to get Medicare rate for CPT ${item.cptCode}`);
    }
  }

  // Sort by overcharge percentage (highest first)
  return results.sort((a, b) => b.overchargePercentage - a.overchargePercentage);
}

/**
 * Mock function to simulate Medicare rate lookup
 * In production, this would be replaced with actual MCP tool call
 *
 * @param cptCode - CPT code to look up
 * @returns Promise resolving to Medicare rate
 */
async function getMockMedicareRate(cptCode: string): Promise<number> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Mock rates for common CPT codes
  const mockRates: Record<string, number> = {
    '99214': 110.00,  // Office visit, established patient
    '85025': 25.00,   // Complete blood count
    '71045': 140.00,  // Chest X-ray
    '99213': 76.00,   // Office visit, lower complexity
    '93000': 25.00,   // Electrocardiogram
    '90686': 150.00,  // Flu vaccine
    '80053': 45.00,   // Comprehensive metabolic panel
    '83735': 15.00,   // Magnesium level
    '84443': 30.00,   // Thyroid stimulating hormone
    '85610': 8.00     // Prothrombin time
  };

  const rate = mockRates[cptCode];
  if (!rate) {
    throw new Error(`No Medicare rate found for CPT ${cptCode}`);
  }

  return rate;
}
