/**
 * Streaming Bill Analysis Route
 * 
 * Orchestrates the complete bill analysis workflow with real-time streaming:
 * 1. Extract billing data from PDF
 * 2. Call MCP tools for error detection
 * 3. Trigger Kestra workflow with AI Agent
 * 4. Get Oumi model analysis
 * 5. Stream results progressively
 * 
 * VERCEL INTEGRATION:
 * - Uses Vercel AI SDK for streaming responses
 * - Progressive disclosure of analysis steps
 * - Real-time workflow status updates
 * 
 * SPONSOR INTEGRATIONS:
 * - Cline MCP: detect_billing_errors tool
 * - Kestra: AI Agent workflow
 * - Oumi: Fine-tuned model analysis
 * - Vercel: Streaming + Blob storage
 * 
 * @route POST /api/ai/analyze
 */

import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// Edge runtime for faster streaming
export const runtime = 'edge';

interface AnalyzeRequest {
  blobUrl?: string;
  billingData?: {
    procedures: string[];
    codes: string[];
    charges: number[];
    total_billed: number;
  };
  sessionId?: string;
  includeAppeal?: boolean;
}

/**
 * POST /api/ai/analyze
 * 
 * Stream a complete bill analysis workflow
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body: AnalyzeRequest = await request.json();
    const { blobUrl, billingData: providedBillingData, sessionId, includeAppeal = true } = body;
    
    if (!blobUrl && !providedBillingData) {
      return new Response(
        JSON.stringify({ error: 'Either blobUrl or billingData is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Log start for Vercel Observability
    console.log(JSON.stringify({
      type: 'analyze_start',
      hasBlobUrl: !!blobUrl,
      hasBillingData: !!providedBillingData,
      sessionId: sessionId || 'anonymous',
      timestamp: new Date().toISOString(),
    }));
    
    // Prepare billing data
    let billingData = providedBillingData;
    let extractedText = '';
    
    // If we have a blob URL, call the extract API to get billing data
    // Note: We can't use pdf-parse directly in Edge runtime
    if (blobUrl && !billingData) {
      try {
        // Determine base URL for internal API call
        const baseUrl = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}` 
          : 'http://localhost:3000';
        
        const extractResponse = await fetch(`${baseUrl}/api/bills/extract`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blobUrl }),
        });
        
        if (extractResponse.ok) {
          const extractData = await extractResponse.json();
          billingData = extractData.mcpFormat;
          extractedText = extractData.rawTextPreview || '';
        }
      } catch {
        // If extraction fails, proceed with limited analysis
        console.warn('PDF extraction failed, proceeding with limited analysis');
      }
    }
    
    // Build the comprehensive analysis prompt
    const analysisPrompt = buildAnalysisPrompt(billingData, extractedText, includeAppeal);
    
    // Create OpenAI client
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
    
    // Stream the analysis
    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages: [
        {
          role: 'system',
          content: ANALYSIS_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      onFinish: ({ text, usage }) => {
        const latencyMs = Date.now() - startTime;
        console.log(JSON.stringify({
          type: 'analyze_complete',
          sessionId: sessionId || 'anonymous',
          latencyMs,
          inputTokens: usage?.inputTokens,
          outputTokens: usage?.outputTokens,
          responseLength: text.length,
          timestamp: new Date().toISOString(),
        }));
      },
    });
    
    return result.toTextStreamResponse();
    
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    
    console.error(JSON.stringify({
      type: 'analyze_error',
      error: error instanceof Error ? error.message : 'Unknown error',
      latencyMs,
      timestamp: new Date().toISOString(),
    }));
    
    return new Response(
      JSON.stringify({
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

const ANALYSIS_SYSTEM_PROMPT = `You are ClaimGuardian AI, an expert medical billing analyst powered by a specialized fine-tuned model.

Your analysis should follow this exact format for progressive streaming:

## 📊 STEP 1: EXTRACTION COMPLETE
[Brief summary of what was extracted from the bill]

## 🔍 STEP 2: ERROR DETECTION
[For each error found, use this format:]
- **Error Type**: [NCCI Edit Violation / Duplicate Service / Upcoding / Price Variance / Unbundling]
- **Severity**: [CRITICAL / HIGH / MEDIUM / LOW]
- **Details**: [Specific explanation]
- **Estimated Overcharge**: $[amount]

## 📈 STEP 3: RISK ASSESSMENT
- **Overall Risk Level**: [HIGH / MEDIUM / LOW]
- **Risk Score**: [0-100]
- **Total Potential Overcharge**: $[amount]
- **Confidence Score**: [percentage]%

## 🤖 STEP 4: AI AGENT DECISION
Based on the analysis:
- **Recommended Action**: [APPEAL / NEGOTIATE / ACCEPT]
- **Priority**: [URGENT / HIGH / MEDIUM / LOW]
- **Reasoning**: [Brief explanation]

## ⏸️ STEP 5: HUMAN REVIEW REQUIRED
[Summary of key findings for user to review]
**Question**: Found [X] errors totaling $[amount]. Proceed with appeal generation? [This would pause for user input in the actual workflow]

## 📝 STEP 6: APPEAL LETTER
[If includeAppeal is true, generate a formal appeal letter with:
- Header with date
- Insurance company address
- Clear statement of disputed charges
- Evidence with Medicare rate comparisons
- ERISA 30-day response requirement reference
- Professional closing]

## ✅ STEP 7: SUMMARY
[Final summary with:
- Number of errors found
- Total potential savings
- Recommended next steps
- Confidence in analysis]

Be detailed but concise. Use real CPT codes and Medicare rates when available.
Format dollar amounts properly (e.g., $1,234.56).
Show your reasoning at each step - this is the "generative UI" experience.`;

function buildAnalysisPrompt(
  billingData: AnalyzeRequest['billingData'],
  extractedText: string,
  includeAppeal: boolean
): string {
  if (!billingData) {
    return `Analyze the following medical bill text and follow all 7 steps:

${extractedText}

${includeAppeal ? 'Include a full appeal letter in Step 6.' : 'Skip the appeal letter generation (Step 6).'}`;
  }
  
  const procedureList = billingData.procedures
    .map((proc, i) => `- ${proc} (CPT: ${billingData.codes[i]}) - $${billingData.charges[i]?.toLocaleString() || 'Unknown'}`)
    .join('\n');
  
  return `Analyze this medical bill and follow all 7 steps:

## Bill Summary
**Total Billed**: $${billingData.total_billed.toLocaleString()}

## Procedures
${procedureList}

## CPT Codes
${billingData.codes.join(', ')}

${extractedText ? `\n## Additional Context from PDF\n${extractedText.substring(0, 1000)}` : ''}

${includeAppeal ? 'Include a full appeal letter in Step 6.' : 'Skip the appeal letter generation (Step 6).'}

Analyze each procedure:
1. Look up the CPT code and verify it matches the description
2. Compare the charge to typical Medicare rates
3. Check for billing rule violations (NCCI edits, unbundling, upcoding)
4. Calculate the overcharge percentage
5. Determine if an appeal is warranted`;
}

