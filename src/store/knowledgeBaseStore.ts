import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getEmbedding } from '../services/embeddingService';
import type { AIDocument, AIFolder } from '../types/ai';

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  clientId?: string;
  context?: string; // e.g., "legal", "medical", "financial"
}

interface Document {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  clientId?: string;
  tags: string[];
  metadata: {
    type: string; // e.g., "petition", "contract", "medical_record"
    dateCreated: Date;
    lastModified: Date;
    author?: string;
    caseNumber?: string;
    jurisdiction?: string;
  };
}

interface KnowledgeBaseState {
  documents: AIDocument[];
  folders: AIFolder[];
  tags: string[];
  addDocument: (document: AIDocument) => void;
  updateDocument: (id: string, updates: Partial<AIDocument>) => void;
  removeDocument: (id: string) => void;
  addFolder: (folder: AIFolder) => void;
  updateFolder: (id: string, updates: Partial<AIFolder>) => void;
  removeFolder: (id: string) => void;
  moveDocument: (documentId: string, folderId: string | null) => void;
  moveFolder: (folderId: string, newParentId: string | null) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  generateEmbedding: (document: AIDocument) => Promise<AIDocument>;
  moveBatchDocuments: (documentIds: string[], folderId: string | null) => void;
}

export const useKnowledgeBaseStore = create<KnowledgeBaseState>()(
  persist(
    (set) => ({
      documents: [],
      folders: [],
      tags: [],

      generateEmbedding: async (document) => {
        try {
          const embedding = await getEmbedding(
            `${document.title}\n\n${document.content}`
          );
          return { ...document, embedding };
        } catch (error) {
          console.error('Failed to generate embedding:', error);
          return document;
        }
      },

      addDocument: async (document) =>
        set(async (state) => {
          const docWithEmbedding = await state.generateEmbedding(document);
          return {
            documents: [docWithEmbedding, ...state.documents],
            tags: [...new Set([...state.tags, ...document.tags])]
          };
        }),

      updateDocument: async (id, updates) =>
        set(async (state) => {
          const documents = state.documents.map(async (doc) => {
            if (doc.id !== id) return doc;
            const updated = { ...doc, ...updates };
            return updates.content || updates.title
              ? await state.generateEmbedding(updated)
              : updated;
          });
          return {
            documents: await Promise.all(documents),
            tags: [...new Set(state.documents.flatMap((doc) => doc.tags))]
          };
        }),

      removeDocument: (id) =>
        set((state) => ({
          documents: state.documents.filter((doc) => doc.id !== id),
          tags: [...new Set(
            state.documents
              .filter((doc) => doc.id !== id)
              .flatMap((doc) => doc.tags)
          )]
        })),

      addTag: (tag) =>
        set((state) => ({
          tags: [...new Set([...state.tags, tag])]
        })),

      removeTag: (tag) =>
        set((state) => ({
          tags: state.tags.filter((t) => t !== tag),
          documents: state.documents.map((doc) => ({
            ...doc,
            tags: doc.tags.filter((t) => t !== tag)
          }))
        })),

      addFolder: (folder) =>
        set((state) => ({
          folders: [...state.folders, folder]
        })),

      updateFolder: (id, updates) =>
        set((state) => ({
          folders: state.folders.map((folder) =>
            folder.id === id ? { ...folder, ...updates } : folder
          )
        })),

      removeFolder: (id) =>
        set((state) => ({
          folders: state.folders.filter((folder) => folder.id !== id),
          documents: state.documents.map((doc) =>
            doc.folderId === id ? { ...doc, folderId: null } : doc
          )
        })),

      moveDocument: (documentId, folderId) =>
        set((state) => ({
          documents: state.documents.map((doc) =>
            doc.id === documentId ? { ...doc, folderId } : doc
          )
        })),

      moveFolder: (folderId, newParentId) =>
        set((state) => ({
          folders: state.folders.map((folder) =>
            folder.id === folderId ? { ...folder, parentId: newParentId } : folder
          )
        })),

      moveBatchDocuments: (documentIds, folderId) =>
        set((state) => ({
          documents: state.documents.map((doc) =>
            documentIds.includes(doc.id) ? { ...doc, folderId } : doc
          )
        })),
    }),
    {
      name: 'knowledge-base-storage',
      partialize: (state) => ({
        documents: state.documents.map(({ embedding, ...doc }) => doc),
        folders: state.folders,
        tags: state.tags
      })
    }
  )
); 