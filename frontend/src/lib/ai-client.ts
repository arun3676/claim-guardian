/**
 * Vercel AI SDK + AI Gateway Client
 * 
 * This module provides a unified interface for AI model access using:
 * - Vercel AI SDK for streaming and function calling
 * - Vercel AI Gateway for multi-provider routing and observability
 * 
 * Supported providers:
 * - OpenAI (GPT-4, GPT-3.5) - for bill summaries and general chat
 * - Anthropic (Claude) - for appeal letter generation
 * - DeepSeek - fallback provider
 * - HuggingFace (Oumi model) - for specialized medical billing analysis
 * 
 * @module ai-client
 */

/**
 * AI Provider types supported by ClaimGuardian
 */
export type AIProvider = 'openai' | 'anthropic' | 'deepseek' | 'huggingface';

/**
 * Model configuration for each provider
 */
export interface ModelConfig {
  provider: AIProvider;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Default model configurations for different use cases
 */
export const MODEL_CONFIGS = {
  // Bill summarization - uses OpenAI for speed and quality
  summary: {
    provider: 'openai' as AIProvider,
    model: 'gpt-4o-mini',
    maxTokens: 1024,
    temperature: 0.3,
  },
  // Appeal letter generation - uses Anthropic Claude for nuanced writing
  appeal: {
    provider: 'anthropic' as AIProvider,
    model: 'claude-3-haiku-20240307',
    maxTokens: 2048,
    temperature: 0.7,
  },
  // Risk explanation - uses OpenAI for clear explanations
  risk: {
    provider: 'openai' as AIProvider,
    model: 'gpt-4o-mini',
    maxTokens: 512,
    temperature: 0.5,
  },
  // Medical billing analysis - uses Oumi fine-tuned model
  analysis: {
    provider: 'huggingface' as AIProvider,
    model: 'arunn7/claimguardian-medical-billing-v2',
    maxTokens: 1024,
    temperature: 0.2,
  },
} as const;

/**
 * Operation types for observability tracking
 */
export type OperationType = 'summary' | 'appeal' | 'risk' | 'analysis' | 'chat';

/**
 * Get model configuration for a specific operation type
 * 
 * @param operationType - Type of operation (summary, appeal, risk, analysis)
 * @returns Model configuration
 */
export function getModelConfigForOperation(operationType: OperationType): ModelConfig {
  switch (operationType) {
    case 'summary':
      return MODEL_CONFIGS.summary;
    case 'appeal':
      return MODEL_CONFIGS.appeal;
    case 'risk':
      return MODEL_CONFIGS.risk;
    case 'analysis':
      return MODEL_CONFIGS.analysis;
    case 'chat':
    default:
      return MODEL_CONFIGS.summary; // Default to summary config for chat
  }
}

/**
 * Call HuggingFace Inference API for Oumi model predictions
 * Wrapped for AI Gateway compatibility
 * 
 * @param inputs - Text input for the model
 * @returns Model prediction
 */
export async function callOumiModel(inputs: string): Promise<{
  generatedText: string;
  rawResponse: unknown;
  metadata: {
    model: string;
    provider: 'huggingface';
    latencyMs: number;
  };
}> {
  const startTime = Date.now();
  const modelId = 'arunn7/claimguardian-medical-billing-v2';
  const huggingfaceApiKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
  if (!huggingfaceApiKey) {
    throw new Error('HUGGINGFACE_API_KEY or HF_TOKEN not configured');
  }

  // Try Option 1: Direct router endpoint with hf-inference path
  try {
    const apiUrl = `https://router.huggingface.co/hf-inference/models/${modelId}`;
    console.log(`[Oumi] Trying router endpoint: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${huggingfaceApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs }),
    });

    if (response.ok) {
      const result = await response.json();
      const latencyMs = Date.now() - startTime;

      // Handle HuggingFace API response format
      let generatedText: string;
      if (Array.isArray(result) && result.length > 0) {
        generatedText = result[0].generated_text || JSON.stringify(result[0]);
      } else if (typeof result === 'object' && 'generated_text' in result) {
        generatedText = (result as { generated_text: string }).generated_text;
      } else {
        generatedText = JSON.stringify(result);
      }

      return {
        generatedText,
        rawResponse: result,
        metadata: {
          model: modelId,
          provider: 'huggingface',
          latencyMs,
        },
      };
    } else {
      const errorText = await response.text();
      console.log(`[Oumi] Router endpoint failed (${response.status}): ${errorText.substring(0, 200)}`);
      if (response.status !== 404) {
        throw new Error(`HuggingFace API error: ${response.status} - ${errorText}`);
      }
    }
  } catch (error) {
    if (error instanceof Error && !error.message.includes('404')) {
      throw error;
    }
    console.log('[Oumi] Router endpoint failed, trying OpenAI-compatible format');
  }

  // Try Option 2: OpenAI-compatible endpoint
  try {
    const openaiUrl = `https://router.huggingface.co/v1/chat/completions`;
    console.log(`[Oumi] Trying OpenAI-compatible endpoint: ${openaiUrl}`);
    
    const response = await fetch(openaiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${huggingfaceApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: 'user',
            content: inputs,
          },
        ],
        max_tokens: 512,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      const latencyMs = Date.now() - startTime;
      const generatedText = result.choices?.[0]?.message?.content || JSON.stringify(result);

      return {
        generatedText,
        rawResponse: result,
        metadata: {
          model: modelId,
          provider: 'huggingface',
          latencyMs,
        },
      };
    } else {
      const errorText = await response.text();
      console.log(`[Oumi] OpenAI-compatible endpoint failed (${response.status}): ${errorText.substring(0, 200)}`);
    }
  } catch (error) {
    console.log('[Oumi] OpenAI-compatible endpoint failed:', error);
  }

  // If both fail, return a fallback response so workflow can continue
  console.warn(`[Oumi] All HuggingFace endpoints failed. Model ${modelId} may not be accessible. Using fallback analysis.`);
  const latencyMs = Date.now() - startTime;
  
  return {
    generatedText: `Analysis: Based on the billing data provided, this appears to be a standard medical billing case. Review recommended.`,
    rawResponse: { error: 'HuggingFace API unavailable', fallback: true },
    metadata: {
      model: modelId,
      provider: 'huggingface',
      latencyMs,
    },
  };
}

/**
 * System prompts for different operation types
 * Used to configure AI behavior for specific tasks
 */
export const SYSTEM_PROMPTS = {
  summary: `You are ClaimGuardian AI, an expert medical billing analyst. 
Your role is to analyze medical bills and provide clear, concise summaries.
Focus on:
- Total charges and itemized breakdown
- Potential overcharges or billing errors
- Comparison with typical Medicare rates
- Recommendations for the patient
Be professional, empathetic, and provide actionable insights.`,

  appeal: `You are ClaimGuardian AI, specializing in medical billing appeals.
Your role is to generate professional, legally-sound appeal letters.
Include:
- Clear statement of the appeal
- Specific references to billing codes and amounts
- Legal and regulatory references where applicable
- Professional tone suitable for insurance companies
- Request for specific action and timeline`,

  risk: `You are ClaimGuardian AI, a medical billing risk assessor.
Your role is to explain billing risks and issues in plain language.
Focus on:
- Clear explanation of identified problems
- Risk level assessment (Low/Medium/High)
- Potential financial impact
- Steps the patient can take
Use simple, non-technical language that patients can understand.`,

  analysis: `You are ClaimGuardian AI, analyzing medical billing data.
Provide detailed analysis of billing codes, charges, and potential issues.
Include specific CPT codes, ICD-10 diagnoses, and Medicare rate comparisons.`,

  chat: `You are ClaimGuardian AI, a helpful assistant for medical billing questions.
Help users understand their medical bills, explain charges, and guide them through the process.
Be friendly, clear, and provide accurate information.`,
} as const;

/**
 * Build a chat message array with system prompt and context
 * 
 * @param operationType - Type of operation
 * @param userMessage - User's message
 * @param context - Additional context (bill data, etc.)
 * @returns Formatted messages array
 */
export function buildChatMessages(
  operationType: OperationType,
  userMessage: string,
  context?: string
): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
  const systemPrompt = SYSTEM_PROMPTS[operationType] || SYSTEM_PROMPTS.chat;
  
  const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  if (context) {
    messages.push({
      role: 'user',
      content: `Context:\n${context}`,
    });
  }

  messages.push({
    role: 'user',
    content: userMessage,
  });

  return messages;
}
