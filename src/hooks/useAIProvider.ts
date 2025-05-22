import { useCallback, useState } from 'react';
import type { AIModel } from '../types/ai';
import { geminiSimplifiedService } from '../services/gemini-simplified';
import { getEnv } from '../config/env';

// Define and Export the part type for multimodal input
export type MultimodalPart = {text: string} | {inlineData: {mimeType: string, data: string}};

// Define default model for Gemini
const defaultGeminiModel: AIModel = {
  id: 'gemini-1.5-flash',
  name: 'Gemini 1.5 Flash',
  provider: 'google',
  capabilities: ['chat', 'text-generation'],
  contextSize: 32000
};

export function useAIProvider() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Always use Google Gemini as the provider
  const defaultProvider = 'google';
  
  const sendMessage = useCallback(async (userInputParts: Array<MultimodalPart>, options?: { modelId?: string, systemPrompt?: string }): Promise<string> => {
    console.log('[useAIProvider] sendMessage called. UserInputParts:', userInputParts, 'Options:', options);
    setIsLoading(true);
    setError(null);
    
    try {
      let finalParts: Array<MultimodalPart> = [];

      if (options?.systemPrompt) {
        console.log('[useAIProvider] Adding system prompt to parts:', options.systemPrompt);
        finalParts.push({text: options.systemPrompt});
      }
      
      // Add user input parts. If a system prompt was added, and the first user part is text,
      // prepend "User: " to it for clarity or structure as a new turn.
      // For now, we'll just add them. The Gemini API handles turns in a sequence of parts.
      userInputParts.forEach(part => {
        finalParts.push(part);
      });
      console.log('[useAIProvider] Final parts before sending to service:', finalParts);

      if (finalParts.length === 0) {
         console.error('[useAIProvider] Attempted to send empty message parts.');
         throw new Error("Cannot send empty message parts.");
      }

      // Make sure at least one part is text if only a system prompt is present, or if only images are sent.
      // Some models might require at least one text part.
      // For now, assuming the caller (AIAssistantPage) will ensure valid part combinations.
      console.log('[useAIProvider] About to call geminiSimplifiedService.getCompletion. FinalParts:', finalParts);
      const response = await geminiSimplifiedService.getCompletion(finalParts, {
        // model option was removed previously as geminiSimplifiedService handles its default model
      });
      console.log('[useAIProvider] geminiSimplifiedService.getCompletion returned. Response:', response);
      return response;
    } catch (error) {
      console.error('[useAIProvider] Error in sendMessage:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      throw error;
    } finally {
      console.log('[useAIProvider] sendMessage finally block. Setting isLoading to false.');
      setIsLoading(false);
    }
  }, []);

  return {
    sendMessage,
    isLoading,
    error
  };
} 