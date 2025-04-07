import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { AIAssistant, AIFolder } from '../types/ai';

interface AssistantState {
  assistants: AIAssistant[];
  
  // CRUD operations
  addAssistant: (assistant: Omit<AIAssistant, 'id'>) => AIAssistant;
  updateAssistant: (id: string, updates: Partial<AIAssistant>) => void;
  removeAssistant: (id: string) => void;
  getAssistantById: (id: string) => AIAssistant | undefined;
  
  // Knowledge base operations
  assignFolderToAssistant: (assistantId: string, folderId: string) => void;
  removeFolderFromAssistant: (assistantId: string, folderId: string) => void;
  getAssistantFolders: (assistantId: string) => string[];
}

export const useAssistantStore = create<AssistantState>()(
  persist(
    (set, get) => ({
      assistants: [],
      
      addAssistant: (assistantData) => {
        const assistant: AIAssistant = {
          id: nanoid(),
          ...assistantData,
        };
        set((state) => ({
          assistants: [...state.assistants, assistant]
        }));
        return assistant;
      },
      
      updateAssistant: (id, updates) => {
        set((state) => ({
          assistants: state.assistants.map(assistant => 
            assistant.id === id ? { ...assistant, ...updates } : assistant
          )
        }));
      },
      
      removeAssistant: (id) => {
        set((state) => ({
          assistants: state.assistants.filter(assistant => assistant.id !== id)
        }));
      },
      
      getAssistantById: (id) => {
        return get().assistants.find(assistant => assistant.id === id);
      },
      
      assignFolderToAssistant: (assistantId, folderId) => {
        set((state) => ({
          assistants: state.assistants.map(assistant => {
            if (assistant.id === assistantId) {
              // Initialize knowledgeBase array if it doesn't exist
              const knowledgeBase = assistant.knowledgeBase || [];
              // Check if the folder is already assigned
              const folderAlreadyAssigned = knowledgeBase.some(
                folder => folder.id === folderId
              );
              
              if (folderAlreadyAssigned) {
                return assistant;
              }
              
              return {
                ...assistant,
                // Add the folder ID to the knowledge base
                // Note: This adds just the folder ID, the actual folder
                // will be fetched from knowledgeBaseStore when needed
                knowledgeBase: [...knowledgeBase, { id: folderId } as AIFolder]
              };
            }
            return assistant;
          })
        }));
      },
      
      removeFolderFromAssistant: (assistantId, folderId) => {
        set((state) => ({
          assistants: state.assistants.map(assistant => {
            if (assistant.id === assistantId && assistant.knowledgeBase) {
              return {
                ...assistant,
                knowledgeBase: assistant.knowledgeBase.filter(
                  folder => folder.id !== folderId
                )
              };
            }
            return assistant;
          })
        }));
      },
      
      getAssistantFolders: (assistantId) => {
        const assistant = get().getAssistantById(assistantId);
        if (!assistant || !assistant.knowledgeBase) {
          return [];
        }
        return assistant.knowledgeBase.map(folder => folder.id);
      }
    }),
    {
      name: 'assistant-store',
    }
  )
); 