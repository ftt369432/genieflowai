import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAIStore } from '../store/aiStore';
import { useAIProvider } from '../hooks/useAIProvider';
import type { Message, AIModel } from '../types/ai';
import { ProfessionalModeService } from '../services/legalDoc/professionalModeService';
import { useSupabase } from '../providers/SupabaseProvider';

export interface AIConfig {
  professionalMode: boolean;
}

export interface AIContextType {
  messages: Message[];
  isLoading: boolean;
  selectedModel: AIModel;
  sendMessage: (message: string, mode: 'chat' | 'task' | 'email') => Promise<string>;
  setSelectedModel: (model: AIModel) => void;
  clearMessages: () => void;
  startNewConversation: () => void;
  professionalMode: boolean;
  toggleProfessionalMode: () => void;
  professionalService: ProfessionalModeService | null;
}

export const AIContext = createContext<AIContextType>({
  messages: [],
  isLoading: false,
  selectedModel: { 
    id: 'gemini-2.0-flash', 
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    capabilities: ['chat', 'text-generation'],
    contextSize: 32000
  },
  sendMessage: async () => '',
  setSelectedModel: () => {},
  clearMessages: () => {},
  startNewConversation: () => {},
  professionalMode: false,
  toggleProfessionalMode: () => {},
  professionalService: null,
});

export function AIProvider({ children }: { children: React.ReactNode }) {
  const {
    messages,
    isLoading,
    selectedModel,
    addMessage,
    setLoading,
    setSelectedModel,
    clearMessages,
    startNewConversation,
    linkedDocs
  } = useAIStore();

  const { sendMessage: sendToAI } = useAIProvider();

  const [professionalMode, setProfessionalMode] = useState<boolean>(false);
  const [professionalService, setProfessionalService] = useState<ProfessionalModeService | null>(null);
  const { supabase, user } = useSupabase();

  useEffect(() => {
    if (!professionalService && supabase) {
      setProfessionalService(new ProfessionalModeService(supabase));
    }
  }, [professionalService, supabase]);

  const toggleProfessionalMode = useCallback(() => {
    setProfessionalMode(prev => !prev);
  }, []);

  const sendMessage = useCallback(async (message: string, mode: 'chat' | 'task' | 'email'): Promise<string> => {
    setLoading(true);
    
    // Create and add the user's message
    const userMessage: Message = {
      id: new Date().getTime().toString(),
      content: message,
      role: 'user',
      timestamp: new Date(),
    };
    
    // Add user message to the chat
    addMessage(userMessage);
    
    try {
      let enhancedMessage = message;
      if (professionalMode && professionalService && user) {
        enhancedMessage = await professionalService.enhancePrompt(
          user.id,
          message,
          messages,
          professionalMode
        );
      }
      
      // Call the AI service with the new signature
      const response = await sendToAI(enhancedMessage);
      
      // Create and add the AI response message
      const assistantMessage: Message = {
        id: (new Date().getTime() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date(),
        metadata: {
          model: selectedModel.id,
          provider: selectedModel.provider
        }
      };
      
      // Add assistant message to the chat
      addMessage(assistantMessage);
      
      return response;
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Create and add error message
      const errorMessage: Message = {
        id: (new Date().getTime() + 1).toString(),
        content: error instanceof Error 
          ? `Error: ${error.message}` 
          : 'An unknown error occurred',
        role: 'assistant',
        timestamp: new Date()
      };
      
      // Add error message to the chat
      addMessage(errorMessage);
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, sendToAI, professionalMode, professionalService, user, messages, selectedModel, addMessage]);

  return (
    <AIContext.Provider value={{
      messages,
      isLoading,
      selectedModel,
      sendMessage,
      setSelectedModel,
      clearMessages,
      startNewConversation,
      professionalMode,
      toggleProfessionalMode,
      professionalService,
    }}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
} 