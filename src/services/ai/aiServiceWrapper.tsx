import React, { createContext, useContext, useEffect, useState } from 'react';
import { AIService, createAIService } from './aiService';
import { useSupabase } from '../../providers/SupabaseProvider';

// Create context for the AIService
const AIServiceContext = createContext<AIService | null>(null);

// Provider component to make AIService available throughout the app
export const AIServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [aiService] = useState(() => createAIService());
  const { supabase } = useSupabase();
  
  // Initialize with Supabase client when available
  useEffect(() => {
    if (supabase) {
      aiService.setSupabaseClient(supabase);
    }
  }, [supabase, aiService]);
  
  return (
    <AIServiceContext.Provider value={aiService}>
      {children}
    </AIServiceContext.Provider>
  );
};

// Hook to use AIService in components
export const useAIService = () => {
  const aiService = useContext(AIServiceContext);
  if (!aiService) {
    throw new Error('useAIService must be used within an AIServiceProvider');
  }
  return aiService;
}; 