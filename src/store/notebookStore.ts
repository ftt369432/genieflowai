import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Notebook as NotebookType, NotebookSection, NotebookBlock } from '../types/notebook';
import { generateNotebookResponse, analyzeNotebook } from '../services/ai/notebookAI';

interface NotebookStore {
  notebooks: NotebookType[];
  activeNotebookId: string | null;
  activeNoteId: string | null;
  isLoading: boolean;
  error: string | null;
  selectedNotebook: NotebookType | null;
  
  // Actions
  createNotebook: (title: string, description: string, templateData?: { 
    sections?: any[]; 
    tags?: string[];
    metadata?: any;
  }) => Promise<void>;
  updateNotebook: (id: string, updates: Partial<NotebookType>) => Promise<void>;
  deleteNotebook: (id: string) => Promise<void>;
  selectNotebook: (id: string) => void;
  addSection: (notebookId: string, title: string) => Promise<void>;
  updateSection: (notebookId: string, sectionId: string, updates: Partial<NotebookSection>) => Promise<void>;
  deleteSection: (notebookId: string, sectionId: string) => Promise<void>;
  addBlock: (notebookId: string, sectionId: string, block: Omit<NotebookBlock, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBlock: (notebookId: string, sectionId: string, blockId: string, updates: Partial<NotebookBlock>) => Promise<void>;
  deleteBlock: (notebookId: string, sectionId: string, blockId: string) => Promise<void>;
  generateAIResponse: (notebookId: string, message: string, context?: { currentSection?: string; currentBlock?: string }) => Promise<void>;
  analyzeNotebook: (notebookId: string) => Promise<void>;
}

export const useNotebookStore = create<NotebookStore>()(
  persist(
    (set, get) => ({
      notebooks: [],
      activeNotebookId: null,
      activeNoteId: null,
      isLoading: false,
      error: null,
      selectedNotebook: null,
      
      createNotebook: async (title: string, description: string, templateData?: { 
        sections?: any[]; 
        tags?: string[];
        metadata?: any;
      }) => {
        set({ isLoading: true, error: null });
        try {
          const newNotebook: NotebookType = {
            id: crypto.randomUUID(),
            title,
            description,
            sections: templateData?.sections || [],
            tags: templateData?.tags || [],
            isFavorite: false,
            isArchived: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastModified: new Date(),
            ...(templateData?.metadata ? { metadata: templateData.metadata } : {})
          };
          
          set(state => ({
            notebooks: [...state.notebooks, newNotebook],
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to create notebook', isLoading: false });
        }
      },
      
      updateNotebook: async (id: string, updates: Partial<NotebookType>) => {
        set({ isLoading: true, error: null });
        try {
          set(state => ({
            notebooks: state.notebooks.map(notebook => 
              notebook.id === id 
                ? { ...notebook, ...updates, updatedAt: new Date(), lastModified: new Date() }
                : notebook
            ),
            selectedNotebook: state.selectedNotebook?.id === id
              ? { ...state.selectedNotebook, ...updates, updatedAt: new Date(), lastModified: new Date() }
              : state.selectedNotebook,
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update notebook', isLoading: false });
        }
      },
      
      deleteNotebook: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          set(state => ({
            notebooks: state.notebooks.filter(notebook => notebook.id !== id),
            activeNotebookId: state.activeNotebookId === id ? null : state.activeNotebookId,
            selectedNotebook: state.selectedNotebook?.id === id ? null : state.selectedNotebook,
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete notebook', isLoading: false });
        }
      },
      
      selectNotebook: (id: string) => {
        const notebook = get().notebooks.find(n => n.id === id);
        set({ selectedNotebook: notebook || null });
      },
      
      addSection: async (notebookId: string, title: string) => {
        set({ isLoading: true, error: null });
        try {
          const newSection: NotebookSection = {
            id: crypto.randomUUID(),
            title,
            blocks: [],
            order: get().notebooks.find(n => n.id === notebookId)?.sections.length || 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          set(state => ({
            notebooks: state.notebooks.map(notebook =>
              notebook.id === notebookId
                ? { ...notebook, sections: [...notebook.sections, newSection], updatedAt: new Date(), lastModified: new Date() }
                : notebook
            ),
            selectedNotebook: state.selectedNotebook?.id === notebookId
              ? { ...state.selectedNotebook, sections: [...state.selectedNotebook.sections, newSection], updatedAt: new Date(), lastModified: new Date() }
              : state.selectedNotebook,
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to add section', isLoading: false });
        }
      },
      
      updateSection: async (notebookId: string, sectionId: string, updates: Partial<NotebookSection>) => {
        set({ isLoading: true, error: null });
        try {
          set(state => ({
            notebooks: state.notebooks.map(notebook =>
              notebook.id === notebookId
                ? {
                    ...notebook,
                    sections: notebook.sections.map(section =>
                      section.id === sectionId
                        ? { ...section, ...updates, updatedAt: new Date() }
                        : section
                    ),
                    updatedAt: new Date(),
                    lastModified: new Date(),
                  }
                : notebook
            ),
            selectedNotebook: state.selectedNotebook?.id === notebookId
              ? {
                  ...state.selectedNotebook,
                  sections: state.selectedNotebook.sections.map(section =>
                    section.id === sectionId
                      ? { ...section, ...updates, updatedAt: new Date() }
                      : section
                  ),
                  updatedAt: new Date(),
                  lastModified: new Date(),
                }
              : state.selectedNotebook,
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update section', isLoading: false });
        }
      },
      
      deleteSection: async (notebookId: string, sectionId: string) => {
        set({ isLoading: true, error: null });
        try {
          set(state => ({
            notebooks: state.notebooks.map(notebook =>
              notebook.id === notebookId
                ? {
                    ...notebook,
                    sections: notebook.sections.filter(section => section.id !== sectionId),
                    updatedAt: new Date(),
                    lastModified: new Date(),
                  }
                : notebook
            ),
            selectedNotebook: state.selectedNotebook?.id === notebookId
              ? {
                  ...state.selectedNotebook,
                  sections: state.selectedNotebook.sections.filter(section => section.id !== sectionId),
                  updatedAt: new Date(),
                  lastModified: new Date(),
                }
              : state.selectedNotebook,
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete section', isLoading: false });
        }
      },
      
      addBlock: async (notebookId: string, sectionId: string, block: Omit<NotebookBlock, 'id' | 'createdAt' | 'updatedAt'>) => {
        set({ isLoading: true, error: null });
        try {
          const newBlock: NotebookBlock = {
            ...block,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          set(state => ({
            notebooks: state.notebooks.map(notebook =>
              notebook.id === notebookId
                ? {
                    ...notebook,
                    sections: notebook.sections.map(section =>
                      section.id === sectionId
                        ? { ...section, blocks: [...section.blocks, newBlock], updatedAt: new Date() }
                        : section
                    ),
                    updatedAt: new Date(),
                    lastModified: new Date(),
                  }
                : notebook
            ),
            selectedNotebook: state.selectedNotebook?.id === notebookId
              ? {
                  ...state.selectedNotebook,
                  sections: state.selectedNotebook.sections.map(section =>
                    section.id === sectionId
                      ? { ...section, blocks: [...section.blocks, newBlock], updatedAt: new Date() }
                      : section
                  ),
                  updatedAt: new Date(),
                  lastModified: new Date(),
                }
              : state.selectedNotebook,
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to add block', isLoading: false });
        }
      },
      
      updateBlock: async (notebookId: string, sectionId: string, blockId: string, updates: Partial<NotebookBlock>) => {
        set({ isLoading: true, error: null });
        try {
          set(state => ({
            notebooks: state.notebooks.map(notebook =>
              notebook.id === notebookId
                ? {
                    ...notebook,
                    sections: notebook.sections.map(section =>
                      section.id === sectionId
                        ? {
                            ...section,
                            blocks: section.blocks.map(block =>
                              block.id === blockId
                                ? { ...block, ...updates, updatedAt: new Date() }
                                : block
                            ),
                            updatedAt: new Date(),
                          }
                        : section
                    ),
                    updatedAt: new Date(),
                    lastModified: new Date(),
                  }
                : notebook
            ),
            selectedNotebook: state.selectedNotebook?.id === notebookId
              ? {
                  ...state.selectedNotebook,
                  sections: state.selectedNotebook.sections.map(section =>
                    section.id === sectionId
                      ? {
                          ...section,
                          blocks: section.blocks.map(block =>
                            block.id === blockId
                              ? { ...block, ...updates, updatedAt: new Date() }
                              : block
                          ),
                          updatedAt: new Date(),
                        }
                      : section
                  ),
                  updatedAt: new Date(),
                  lastModified: new Date(),
                }
              : state.selectedNotebook,
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update block', isLoading: false });
        }
      },
      
      deleteBlock: async (notebookId: string, sectionId: string, blockId: string) => {
        set({ isLoading: true, error: null });
        try {
          set(state => ({
            notebooks: state.notebooks.map(notebook =>
              notebook.id === notebookId
                ? {
                    ...notebook,
                    sections: notebook.sections.map(section =>
                      section.id === sectionId
                        ? {
                            ...section,
                            blocks: section.blocks.filter(block => block.id !== blockId),
                            updatedAt: new Date(),
                          }
                        : section
                    ),
                    updatedAt: new Date(),
                    lastModified: new Date(),
                  }
                : notebook
            ),
            selectedNotebook: state.selectedNotebook?.id === notebookId
              ? {
                  ...state.selectedNotebook,
                  sections: state.selectedNotebook.sections.map(section =>
                    section.id === sectionId
                      ? {
                          ...section,
                          blocks: section.blocks.filter(block => block.id !== blockId),
                          updatedAt: new Date(),
                        }
                      : section
                  ),
                  updatedAt: new Date(),
                  lastModified: new Date(),
                }
              : state.selectedNotebook,
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete block', isLoading: false });
        }
      },
      
      generateAIResponse: async (notebookId: string, message: string, context?: { currentSection?: string; currentBlock?: string }) => {
        set({ isLoading: true, error: null });
        try {
          const notebook = get().notebooks.find(n => n.id === notebookId);
          if (!notebook) throw new Error('Notebook not found');

          const response = await generateNotebookResponse(notebook, message, context);
          
          if (context?.currentSection) {
            await get().addBlock(notebookId, context.currentSection, {
              type: 'ai',
              content: response.content,
              metadata: response.metadata,
            });
          }

          set({ isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to generate AI response', isLoading: false });
        }
      },
      
      analyzeNotebook: async (notebookId: string) => {
        set({ isLoading: true, error: null });
        try {
          const notebook = get().notebooks.find(n => n.id === notebookId);
          if (!notebook) throw new Error('Notebook not found');

          const analyzedNotebook = await analyzeNotebook(notebook);
          
          set(state => ({
            notebooks: state.notebooks.map(n =>
              n.id === notebookId ? analyzedNotebook : n
            ),
            selectedNotebook: state.selectedNotebook?.id === notebookId ? analyzedNotebook : state.selectedNotebook,
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to analyze notebook', isLoading: false });
        }
      },
    }),
    {
      name: 'notebook-storage',
      // Add merge function to handle rehydration
      merge: (persistedState, currentState) => {
        if (persistedState && typeof persistedState === 'object') {
          const typedState = persistedState as Partial<NotebookStore>;
          // Ensure notebooks array exists and map items to the correct type
          const notebooks = (typedState.notebooks || []).map((notebook: any) => ({
            id: notebook.id || crypto.randomUUID(),
            title: typeof notebook.name === 'object' ? notebook.name.name : (notebook.title || notebook.name || 'Untitled'), // Prioritize title, fallback to name (string) or nested name
            description: typeof notebook.name === 'object' ? notebook.name.description : (notebook.description || ''), // Handle nested description
            sections: notebook.sections || [],
            tags: notebook.tags || [],
            isFavorite: notebook.isFavorite || false,
            isArchived: notebook.isArchived || false,
            createdAt: notebook.createdAt ? new Date(notebook.createdAt) : new Date(),
            updatedAt: notebook.updatedAt ? new Date(notebook.updatedAt) : new Date(),
            lastModified: notebook.lastModified ? new Date(notebook.lastModified) : new Date(),
            // Handle potential metadata, icon, color if they exist in NotebookType
            // metadata: notebook.metadata,
            // icon: typeof notebook.name === 'object' ? notebook.name.icon : notebook.icon,
            // color: typeof notebook.name === 'object' ? notebook.name.color : notebook.color,
          }));
          
          return {
            ...currentState,
            ...typedState, // Spread other persisted state properties
            notebooks, // Overwrite with correctly typed notebooks
            selectedNotebook: null, // Reset selected notebook on rehydration
            activeNotebookId: null, // Reset active ID
          };
        }
        return currentState;
      },
    }
  )
);