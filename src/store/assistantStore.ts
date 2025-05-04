import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { AIAssistant, AIFolder } from '../types/ai';

interface AssistantState {
  assistants: AIAssistant[];
  addAssistant: (assistant: Omit<AIAssistant, 'id'>) => AIAssistant;
  updateAssistant: (id: string, updates: Partial<AIAssistant>) => void;
  removeAssistant: (id: string) => void;
  getAssistantById: (id: string) => AIAssistant | undefined;
  assignFolderToAssistant: (assistantId: string, folderId: string) => void;
  removeFolderFromAssistant: (assistantId: string, folderId: string) => void;
  getAssistantFolders: (assistantId: string) => string[];
}

// Default assistants
const defaultAssistants: AIAssistant[] = [
  {
    id: 'researcher',
    name: 'Research Assistant',
    description: 'Deep analysis and academic research specialist',
    type: 'research',
    capabilities: ['Citation support', 'Academic writing', 'Literature review'],
    systemPrompt: `You are a research assistant focused on deep analysis and academic research. Help users:
- Find and analyze relevant academic sources
- Generate proper citations
- Structure research papers
- Review literature
- Identify research gaps`,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'coder',
    name: 'Code Assistant',
    description: 'Programming and development helper',
    type: 'building',
    capabilities: ['Code completion', 'Bug fixing', 'Code review', 'Best practices'],
    systemPrompt: `You are a coding assistant focused on helping with programming tasks. Help users:
- Write clean, efficient code
- Debug issues
- Review code for best practices
- Explain complex code concepts
- Suggest improvements`,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'writer',
    name: 'Writing Assistant',
    description: 'Creative and professional writing support',
    type: 'general',
    capabilities: ['Style suggestions', 'Grammar check', 'Content ideas', 'Editing'],
    systemPrompt: `You are a writing assistant focused on helping create and improve written content. Help users:
- Improve writing style and clarity
- Check grammar and structure
- Generate creative content ideas
- Edit and polish drafts
- Adapt tone for different audiences`,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'legal',
    name: 'Legal Assistant',
    description: 'Legal document and research specialist',
    type: 'work',
    capabilities: ['Document drafting', 'Case research', 'Legal citations', 'Compliance check'],
    systemPrompt: `You are a legal assistant specializing in California Workers Compensation law. Help users:
- Draft legal documents and petitions
- Research relevant case law
- Provide legal citations
- Check compliance requirements
- Explain legal concepts clearly`,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const useAssistantStore = create<AssistantState>()(
  persist(
    (set, get) => ({
      assistants: defaultAssistants,
      
      addAssistant: (assistantData) => {
        const assistant: AIAssistant = {
          id: nanoid(),
          ...assistantData,
          createdAt: new Date(),
          updatedAt: new Date()
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
          assistants: state.assistants.filter(a => a.id !== id)
        }));
      },

      getAssistantById: (id) => {
        return get().assistants.find(a => a.id === id);
      },

      assignFolderToAssistant: (assistantId, folderId) => {
        set((state) => ({
          assistants: state.assistants.map(assistant =>
            assistant.id === assistantId ? {
              ...assistant,
              linkedFolders: [...(assistant.linkedFolders || []), folderId],
              updatedAt: new Date()
            } : assistant
          )
        }));
      },

      removeFolderFromAssistant: (assistantId, folderId) => {
        set((state) => ({
          assistants: state.assistants.map(assistant =>
            assistant.id === assistantId ? {
              ...assistant,
              linkedFolders: (assistant.linkedFolders || []).filter(id => id !== folderId),
              updatedAt: new Date()
            } : assistant
          )
        }));
      },

      getAssistantFolders: (assistantId) => {
        const assistant = get().assistants.find(a => a.id === assistantId);
        return assistant?.linkedFolders || [];
      }
    }),
    {
      name: 'assistant-store'
    }
  )
);