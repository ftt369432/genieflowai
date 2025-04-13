import { useContext, useEffect, useState } from 'react';
import { useAI } from './useAI';
import AIConnector from '../services/ai/aiConnector';
import { AIService } from '../services/ai/baseAIService';
import { AIContext } from '../contexts/AIContext';

/**
 * Provides access to the AIConnector instance for integrating AI features
 * across the application.
 */
export function useAIConnector() {
  const { sendMessage, isLoading, selectedModel } = useAI();
  const [connector, setConnector] = useState<AIConnector | null>(null);
  
  // Mock AIService for our connector (without requiring exact type implementation)
  const aiService: any = {
    getCompletion: async (prompt: string) => {
      return sendMessage(prompt, 'chat');
    },
    enhanceTask: async (task: any) => {
      // Add AI-generated improvements to the task
      const enhancedTask = { ...task };
      
      if (!task.tags || task.tags.length === 0) {
        const tagsPrompt = `Suggest 2-3 tags for this task: ${task.title}. ${task.description || ''}`;
        try {
          const tagsResult = await sendMessage(tagsPrompt, 'chat');
          enhancedTask.tags = tagsResult.split(',').map((tag: string) => tag.trim());
        } catch (error) {
          console.error('Error generating tags:', error);
        }
      }
      
      return enhancedTask;
    },
    estimateTaskDuration: async (description: string) => {
      const prompt = `Estimate how long this task would take in minutes: "${description}". Reply with just a number.`;
      try {
        const result = await sendMessage(prompt, 'chat');
        const minutes = parseInt(result.trim());
        return isNaN(minutes) ? 30 : minutes;
      } catch (error) {
        console.error('Error estimating duration:', error);
        return 30; // Default to 30 minutes
      }
    },
    optimizeTaskSchedule: async (tasks: any[]) => {
      // This would be a more complex AI call to optimize task scheduling
      // Simplified implementation for now
      return tasks;
    }
  };
  
  useEffect(() => {
    // Initialize our connector with the AI service
    const aiConnector = AIConnector.getInstance(aiService);
    setConnector(aiConnector);
  }, []);
  
  return {
    connector,
    isLoading,
    selectedModel,
    
    // Convenience methods for common operations
    analyzeEmail: async (email: any) => {
      if (!connector) return null;
      return connector.analyzeEmail(email);
    },
    
    extractTasksFromEmail: async (email: any) => {
      if (!connector) return [];
      return connector.extractTasksFromEmail(email);
    },
    
    enhanceTask: async (task: any) => {
      if (!connector) return task;
      return connector.enhanceTask(task);
    },
    
    searchKnowledgeBase: async (query: string, assistantId?: string) => {
      if (!connector) return [];
      return connector.searchKnowledgeBase(query, assistantId);
    },
    
    chatWithAssistant: async (assistantId: string, query: string, history: any[] = []) => {
      if (!connector) return { message: "AI connector not initialized", relevantDocuments: [] };
      return connector.chatWithAssistantKnowledge(assistantId, query, history);
    },
    
    convertTaskToEmail: async (task: any) => {
      if (!connector) return null;
      return connector.convertTaskToEmail(task);
    }
  };
} 