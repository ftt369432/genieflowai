import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { AIAssistant, AIFolder } from '../types/ai';
import { templateAssistants } from '../data/templateAssistants';

interface AssistantState {
  assistants: AIAssistant[];
  selectedAssistant: AIAssistant | null;
  isLoading: boolean;
  error: string | null;
  setAssistants: (assistants: AIAssistant[]) => void;
  setSelectedAssistant: (assistant: AIAssistant | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // CRUD operations
  addAssistant: (assistant: Omit<AIAssistant, 'id'>) => AIAssistant;
  updateAssistant: (id: string, updates: Partial<AIAssistant>) => void;
  removeAssistant: (id: string) => void;
  getAssistantById: (id: string) => AIAssistant | undefined;
  
  // Knowledge base operations
  assignFolderToAssistant: (assistantId: string, folderId: string) => void;
  removeFolderFromAssistant: (assistantId: string, folderId: string) => void;
  getAssistantFolders: (assistantId: string) => string[];
  
  // Template operations
  addTemplateAssistants: () => void;
}

export const useAssistantStore = create<AssistantState>()(
  persist(
    (set, get) => ({
      assistants: [],
      selectedAssistant: null,
      isLoading: false,
      error: null,
      setAssistants: (assistants) => set({ assistants }),
      setSelectedAssistant: (assistant) => set({ selectedAssistant: assistant }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      addAssistant: (assistantData) => {
        const assistant: AIAssistant = {
          id: nanoid(),
          ...assistantData,
          createdAt: assistantData.createdAt || new Date(),
          updatedAt: assistantData.updatedAt || new Date(),
        };
        set((state) => ({
          assistants: [...state.assistants, assistant]
        }));
        return assistant;
      },
      
      updateAssistant: (id, updates) => {
        set((state) => ({
          assistants: state.assistants.map(assistant => 
            assistant.id === id ? { ...assistant, ...updates, updatedAt: new Date() } : assistant
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
                knowledgeBase: [...knowledgeBase, { id: folderId } as AIFolder],
                updatedAt: new Date()
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
                ),
                updatedAt: new Date()
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
      },
      
      addTemplateAssistants: () => {
        const { assistants } = get();
        
        // Only add templates if there are no assistants yet
        if (assistants.length === 0) {
          // Add each template assistant
          templateAssistants.forEach(template => {
            const now = new Date();
            get().addAssistant({
              ...template,
              createdAt: now,
              updatedAt: now,
              isActive: true,
            } as Omit<AIAssistant, 'id'>);
          });
          
          console.log('Added template assistants');
        }
      }
    }),
    {
      name: 'assistant-store',
      onRehydrateStorage: () => (state) => {
        // Initialize with template assistants when the store is rehydrated
        if (state) {
          setTimeout(() => {
            state.addTemplateAssistants();
          }, 100);
        }
      }
    }
  )
); 