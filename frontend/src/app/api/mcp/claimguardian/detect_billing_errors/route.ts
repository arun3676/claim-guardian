import { NextRequest, NextResponse } from 'next/server';

// Mock procedure cost database - in production this would use actual MCP tool
const PROCEDURE_COSTS: Record<string, { cost: number; cptCode: string; description: string }> = {
  'mri brain': { cost: 3500, cptCode: '70553', description: 'MRI brain with and without contrast' },
  'mri': { cost: 3500, cptCode: '70553', description: 'MRI brain with and without contrast' },
  'colonoscopy': { cost: 3000, cptCode: '45378', description: 'Colonoscopy, diagnostic' },
  'knee replacement': { cost: 50000, cptCode: '27447', description: 'Total knee arthroplasty' },
  'ct scan': { cost: 1500, cptCode: '71250', description: 'CT thorax without contrast' },
  'ct chest': { cost: 1500, cptCode: '71250', description: 'CT thorax without contrast' },
  'echocardiogram': { cost: 2000, cptCode: '93306', description: 'Echocardiography, complete' },
  'echo': { cost: 2000, cptCode: '93306', description: 'Echocardiography, complete' },
  'ekg': { cost: 150, cptCode: '93000', description: 'Electrocardiogram' },
  'ecg': { cost: 150, cptCode: '93000', description: 'Electrocardiogram' },
  'chest xray': { cost: 300, cptCode: '71046', description: 'Chest X-ray, 2 views' },
  'x-ray': { cost: 300, cptCode: '71046', description: 'Chest X-ray, 2 views' },
  'appendectomy': { cost: 12000, cptCode: '44970', description: 'Laparoscopic appendectomy' },
  'hip replacement': { cost: 45000, cptCode: '27130', description: 'Total hip arthroplasty' },
  'cholecystectomy': { cost: 15000, cptCode: '47562', description: 'Laparoscopic cholecystectomy' },
  'gallbladder': { cost: 15000, cptCode: '47562', description: 'Laparoscopic cholecystectomy' },
  'office visit': { cost: 200, cptCode: '99214', description: 'Office visit, established patient' },
  'lab work': { cost: 150, cptCode: '80053', description: 'Comprehensive metabolic panel' },
  'blood work': { cost: 150, cptCode: '80053', description: 'Comprehensive metabolic panel' },
};

interface BillingError {
  type: 'OVERCHARGE' | 'UNDERCHARGE' | 'MISSING_CODE' | 'DUPLICATE_BILLING';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  detail: string;
  savings?: number;
}

interface ProcedureAnalysis {
  procedure: string;
  expected_cost: number;
  billed_amount?: number;
  cpt_code?: string;
  status: 'FOUND' | 'NOT_FOUND' | 'ESTIMATED';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { procedures, total_billed } = body;

    if (!Array.isArray(procedures) || typeof total_billed !== 'number') {
      return NextResponse.json(
        {
          error: 'Procedures must be an array of strings and total_billed must be a number'
        },
        { status: 400 }
      );
    }

    // Analyze each procedure
    const analysis: ProcedureAnalysis[] = [];
    let totalExpectedCost = 0;
    const errors: BillingError[] = [];

    for (const procedure of procedures) {
      if (typeof procedure !== 'string') continue;

      const procLower = procedure.toLowerCase().trim();
      let found = false;

      // Try to match procedure to known costs
      for (const [key, value] of Object.entries(PROCEDURE_COSTS)) {
        if (procLower.includes(key) || key.includes(procLower)) {
          analysis.push({
            procedure,
            expected_cost: value.cost,
            cpt_code: value.cptCode,
            status: 'FOUND'
          });
          totalExpectedCost += value.cost;
          found = true;
          break;
        }
      }

      if (!found) {
        // Estimate cost for unknown procedures
        const estimatedCost = 500; // Default estimate
        analysis.push({
          procedure,
          expected_cost: estimatedCost,
          status: 'ESTIMATED'
        });
        totalExpectedCost += estimatedCost;
        errors.push({
          type: 'MISSING_CODE',
          severity: 'LOW',
          detail: `Unknown procedure "${procedure}" - cost estimated`
        });
      }
    }

    // Check for overcharging
    const overchargeThreshold = 1.2; // 20% over expected
    if (totalExpectedCost > 0 && total_billed > totalExpectedCost * overchargeThreshold) {
      const overchargeAmount = total_billed - totalExpectedCost;
      const overchargePercentage = ((total_billed - totalExpectedCost) / totalExpectedCost) * 100;

      errors.push({
        type: 'OVERCHARGE',
        severity: overchargePercentage > 50 ? 'HIGH' : 'MEDIUM',
        detail: `Total billed $${total_billed.toLocaleString()} vs expected $${totalExpectedCost.toLocaleString()} (${overchargePercentage.toFixed(1)}% overcharge)`,
        savings: overchargeAmount
      });
    }

    // Check for potential duplicate billing
    const uniqueProcedures = new Set(procedures.map(p => p.toLowerCase().trim()));
    if (procedures.length > uniqueProcedures.size) {
      errors.push({
        type: 'DUPLICATE_BILLING',
        severity: 'MEDIUM',
        detail: 'Potential duplicate procedure billing detected'
      });
    }

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (errors.some(e => e.severity === 'HIGH')) {
      riskLevel = 'HIGH';
    } else if (errors.some(e => e.severity === 'MEDIUM')) {
      riskLevel = 'MEDIUM';
    }

    return NextResponse.json({
      procedures_analyzed: procedures.length,
      total_billed: total_billed,
      expected_total: totalExpectedCost,
      variance: totalExpectedCost > 0
        ? `${(((total_billed - totalExpectedCost) / totalExpectedCost) * 100).toFixed(1)}%`
        : 'unknown',
      errors_found: errors.length,
      errors: errors,
      risk_level: riskLevel,
      analysis: analysis,
      recommendations: errors.length > 0 ? [
        'Review the bill with your healthcare provider',
        'Contact your insurance company for clarification',
        'Consider negotiating the charges',
        'Keep detailed records of all communications'
      ] : ['Bill appears reasonable - no immediate action needed']
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error during billing error detection' },
      { status: 500 }
    );
  }
}
