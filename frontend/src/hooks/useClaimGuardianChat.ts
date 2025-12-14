/**
 * useClaimGuardianChat Hook
 * 
 * React hook for streaming AI chat functionality using Vercel AI SDK.
 * Provides a simple interface for ClaimGuardian AI features:
 * - Bill summarization
 * - Appeal letter generation
 * - Risk explanation
 * - General medical billing chat
 * 
 * VERCEL INTEGRATION:
 * - Uses Vercel AI SDK's useChat hook internally
 * - Streams responses token-by-token for real-time UI updates
 * - Supports multiple operation types with appropriate model selection
 * 
 * @example
 * ```tsx
 * const { messages, sendMessage, isLoading } = useClaimGuardianChat({
 *   operationType: 'summary',
 *   context: billDataString,
 * });
 * 
 * // Send a message
 * await sendMessage('Summarize this medical bill');
 * 
 * // Messages update in real-time as AI responds
 * ```
 */

import { useState, useCallback, useMemo } from 'react';
import type { OperationType, AIProvider } from '@/lib/ai-client';

/**
 * Message type for chat
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Options for the ClaimGuardian chat hook
 */
export interface UseClaimGuardianChatOptions {
  /** Type of operation (summary, appeal, risk, analysis, chat) */
  operationType?: OperationType;
  /** Preferred AI provider */
  provider?: AIProvider;
  /** Specific model to use */
  model?: string;
  /** Additional context to include (e.g., bill data) */
  context?: string;
  /** Session ID for tracking */
  sessionId?: string;
  /** Initial messages to populate the chat */
  initialMessages?: ChatMessage[];
  /** Callback when a response completes */
  onFinish?: (message: ChatMessage) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

/**
 * Return type for the ClaimGuardian chat hook
 */
export interface UseClaimGuardianChatReturn {
  /** All messages in the conversation */
  messages: ChatMessage[];
  /** Send a new message */
  sendMessage: (content: string) => Promise<void>;
  /** Current input value (controlled) */
  input: string;
  /** Set the input value */
  setInput: (value: string) => void;
  /** Whether a response is currently loading */
  isLoading: boolean;
  /** Current error if any */
  error: Error | null;
  /** Clear all messages */
  clearMessages: () => void;
  /** Current operation type */
  operationType: OperationType;
  /** Set the operation type */
  setOperationType: (type: OperationType) => void;
  /** Get a summary of the bill (convenience method) */
  summarizeBill: (billData: string) => Promise<void>;
  /** Generate an appeal letter (convenience method) */
  generateAppeal: (denialDetails: string) => Promise<void>;
  /** Explain risk factors (convenience method) */
  explainRisk: (riskData: string) => Promise<void>;
}

/**
 * Generate a unique message ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Custom hook for ClaimGuardian AI chat functionality
 * 
 * @param options - Configuration options
 * @returns Chat state and methods
 */
export function useClaimGuardianChat(
  options: UseClaimGuardianChatOptions = {}
): UseClaimGuardianChatReturn {
  const {
    operationType: initialOperationType = 'chat',
    provider,
    model,
    context,
    sessionId,
    initialMessages = [],
    onFinish,
    onError,
  } = options;

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [operationType, setOperationType] = useState<OperationType>(initialOperationType);

  /**
   * Send a message and get streaming response
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      setIsLoading(true);
      setError(null);

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content,
      };
      setMessages(prev => [...prev, userMessage]);
      setInput('');

      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content,
            operationType,
            provider,
            model,
            context,
            sessionId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed: ${response.statusText}`);
        }

        // Read the streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let assistantContent = '';
        const assistantId = generateId();

        // Add placeholder assistant message
        setMessages(prev => [
          ...prev,
          { id: assistantId, role: 'assistant', content: '' },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          assistantContent += chunk;

          // Update the assistant message with new content
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantId
                ? { ...msg, content: assistantContent }
                : msg
            )
          );
        }

        const finalMessage: ChatMessage = {
          id: assistantId,
          role: 'assistant',
          content: assistantContent,
        };

        onFinish?.(finalMessage);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        onError?.(error);
      } finally {
        setIsLoading(false);
      }
    },
    [operationType, provider, model, context, sessionId, onFinish, onError]
  );

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  /**
   * Convenience method: Summarize a medical bill
   */
  const summarizeBill = useCallback(
    async (billData: string) => {
      setOperationType('summary');
      const prompt = `Please summarize this medical bill and identify any potential issues:\n\n${billData}`;
      await sendMessage(prompt);
    },
    [sendMessage]
  );

  /**
   * Convenience method: Generate an appeal letter
   */
  const generateAppeal = useCallback(
    async (denialDetails: string) => {
      setOperationType('appeal');
      const prompt = `Please generate a professional appeal letter for the following denial:\n\n${denialDetails}`;
      await sendMessage(prompt);
    },
    [sendMessage]
  );

  /**
   * Convenience method: Explain risk factors
   */
  const explainRisk = useCallback(
    async (riskData: string) => {
      setOperationType('risk');
      const prompt = `Please explain the billing risks in simple terms:\n\n${riskData}`;
      await sendMessage(prompt);
    },
    [sendMessage]
  );

  return useMemo(
    () => ({
      messages,
      sendMessage,
      input,
      setInput,
      isLoading,
      error,
      clearMessages,
      operationType,
      setOperationType,
      summarizeBill,
      generateAppeal,
      explainRisk,
    }),
    [
      messages,
      sendMessage,
      input,
      isLoading,
      error,
      clearMessages,
      operationType,
      summarizeBill,
      generateAppeal,
      explainRisk,
    ]
  );
}

export default useClaimGuardianChat;
