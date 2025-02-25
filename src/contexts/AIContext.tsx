import React, { createContext, useContext, useCallback } from 'react';
import { useAIStore } from '../store/aiStore';
import { useAIProvider } from '../hooks/useAIProvider';
import type { Message, AIModel } from '../types/ai';

interface AIContextType {
  messages: Message[];
  isLoading: boolean;
  selectedModel: AIModel;
  sendMessage: (content: string) => Promise<void>;
  setSelectedModel: (model: AIModel) => void;
  clearMessages: () => void;
  startNewConversation: () => void;
}

const AIContext = createContext<AIContextType | null>(null);

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

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setLoading(true);
    try {
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        role: 'user',
        timestamp: new Date(),
        documents: linkedDocs.map(doc => ({
          id: doc.id,
          title: doc.title,
          excerpt: doc.content.slice(0, 200) + '...',
          type: doc.type,
          relevance: 1
        }))
      };
      addMessage(userMessage);

      // Get AI response with context from documents
      const response = await sendToAI(
        content,
        selectedModel,
        linkedDocs
      );

      // Add AI message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date()
      };
      addMessage(aiMessage);
      setLinkedDocs([]); // Clear linked docs after sending
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, something went wrong. Please try again.',
        role: 'error',
        timestamp: new Date()
      };
      addMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [addMessage, isLoading, selectedModel, sendToAI, setLoading, linkedDocs]);

  return (
    <AIContext.Provider value={{
      messages,
      isLoading,
      selectedModel,
      sendMessage,
      setSelectedModel,
      clearMessages,
      startNewConversation
    }}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
} 