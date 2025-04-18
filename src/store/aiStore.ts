import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Message, AIModel } from '../types/ai';

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface AIDocument {
  id: string;
  name: string;
  type: string;
  content: string;
  timestamp: Date;
}

interface AIState {
  messages: Message[];
  isLoading: boolean;
  selectedModel: AIModel;
  linkedDocs: Array<{
    id: string;
    title: string;
    content: string;
    type: string;
  }>;
  conversationHistory: Conversation[];
  documents: AIDocument[];
  addMessage: (message: Message) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
  saveConversation: (title?: string) => void;
  deleteConversation: (id: string) => void;
  loadConversation: (id: string) => void;
  setSelectedModel: (model: AIModel) => void;
  addDocument: (doc: AIDocument) => void;
  removeDocument: (id: string) => void;
  startNewConversation: () => void;
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,
      selectedModel: {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        provider: 'google',
        capabilities: ['chat', 'text-generation'],
        contextSize: 32000
      },
      linkedDocs: [],
      conversationHistory: [],
      documents: [],

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message]
        })),

      setLoading: (loading) =>
        set({ isLoading: loading }),

      clearMessages: () =>
        set({ messages: [] }),

      saveConversation: (title) =>
        set((state) => {
          const newConversation: Conversation = {
            id: Date.now().toString(),
            title: title || `Conversation ${state.conversationHistory.length + 1}`,
            messages: state.messages,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          return {
            conversationHistory: [newConversation, ...state.conversationHistory]
          };
        }),

      deleteConversation: (id) =>
        set((state) => ({
          conversationHistory: state.conversationHistory.filter(
            (conv) => conv.id !== id
          )
        })),

      loadConversation: (id) =>
        set((state) => {
          const conversation = state.conversationHistory.find(
            (conv) => conv.id === id
          );
          return conversation
            ? { messages: conversation.messages }
            : state;
        }),

      setSelectedModel: (model) =>
        set({ selectedModel: model }),

      addDocument: (doc) => set((state) => ({ 
        documents: [...state.documents, doc] 
      })),

      removeDocument: (id) => set((state) => ({
        documents: state.documents.filter(d => d.id !== id)
      })),

      startNewConversation: () =>
        set({ messages: [], linkedDocs: [], conversationHistory: [], documents: [] })
    }),
    {
      name: 'ai-storage',
      partialize: (state) => ({
        conversationHistory: state.conversationHistory,
        selectedModel: state.selectedModel,
        documents: state.documents
      })
    }
  )
);