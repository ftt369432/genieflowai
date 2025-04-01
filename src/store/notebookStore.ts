import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Note {
  id: string;
  notebookId: string;
  title: string;
  content: string;
  tags: string[];
  created: Date;
  updated: Date;
  attachments?: {
    id: string;
    name: string;
    type: string;
    url: string;
  }[];
}

export interface Notebook {
  id: string;
  name: string;
  description: string;
  projectId?: string;
  icon?: string;
  color?: string;
  created: Date;
  updated: Date;
}

interface NotebookState {
  notebooks: Notebook[];
  notes: Note[];
  activeNotebookId: string | null;
  activeNoteId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Notebook CRUD
  createNotebook: (notebook: Omit<Notebook, 'id' | 'created' | 'updated'>) => string;
  updateNotebook: (id: string, updates: Partial<Notebook>) => void;
  deleteNotebook: (id: string) => void;
  
  // Note CRUD
  createNote: (note: Omit<Note, 'id' | 'created' | 'updated'>) => string;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  
  // Navigation
  setActiveNotebook: (id: string | null) => void;
  setActiveNote: (id: string | null) => void;
  
  // Project integration
  getNotebooksByProject: (projectId: string) => Notebook[];
  getNotesByNotebook: (notebookId: string) => Note[];
}

// Sample data
const sampleNotebook: Notebook = {
  id: '1',
  name: 'Project Notes',
  description: 'General notes for the main project',
  created: new Date(),
  updated: new Date()
};

const sampleNote: Note = {
  id: '1',
  notebookId: '1',
  title: 'Getting Started',
  content: '# Getting Started\n\nThis is a sample note to help you get started with the notebook system.',
  tags: ['sample', 'documentation'],
  created: new Date(),
  updated: new Date()
};

export const useNotebookStore = create<NotebookState>()(
  persist(
    (set, get) => ({
      notebooks: [sampleNotebook],
      notes: [sampleNote],
      activeNotebookId: '1',
      activeNoteId: '1',
      isLoading: false,
      error: null,
      
      createNotebook: (notebook) => {
        const id = crypto.randomUUID();
        const now = new Date();
        
        set((state) => ({
          notebooks: [...state.notebooks, {
            ...notebook,
            id,
            created: now,
            updated: now
          }]
        }));
        
        return id;
      },
      
      updateNotebook: (id, updates) => {
        set((state) => ({
          notebooks: state.notebooks.map(notebook => 
            notebook.id === id 
              ? { ...notebook, ...updates, updated: new Date() } 
              : notebook
          )
        }));
      },
      
      deleteNotebook: (id) => {
        // Delete all notes in the notebook first
        set((state) => ({
          notes: state.notes.filter(note => note.notebookId !== id)
        }));
        
        // Then delete the notebook
        set((state) => ({
          notebooks: state.notebooks.filter(notebook => notebook.id !== id),
          activeNotebookId: state.activeNotebookId === id ? null : state.activeNotebookId
        }));
      },
      
      createNote: (note) => {
        const id = crypto.randomUUID();
        const now = new Date();
        
        set((state) => ({
          notes: [...state.notes, {
            ...note,
            id,
            created: now,
            updated: now
          }]
        }));
        
        return id;
      },
      
      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map(note => 
            note.id === id 
              ? { ...note, ...updates, updated: new Date() } 
              : note
          )
        }));
      },
      
      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter(note => note.id !== id),
          activeNoteId: state.activeNoteId === id ? null : state.activeNoteId
        }));
      },
      
      setActiveNotebook: (id) => {
        set({ activeNotebookId: id });
        
        // If switching notebooks, clear active note
        if (id !== get().activeNotebookId) {
          set({ activeNoteId: null });
        }
      },
      
      setActiveNote: (id) => {
        set({ activeNoteId: id });
      },
      
      getNotebooksByProject: (projectId) => {
        return get().notebooks.filter(notebook => notebook.projectId === projectId);
      },
      
      getNotesByNotebook: (notebookId) => {
        return get().notes.filter(note => note.notebookId === notebookId);
      }
    }),
    {
      name: 'notebook-storage'
    }
  )
); 