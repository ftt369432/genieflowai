import { useState, useCallback } from 'react';
import type { Document } from '../types/documents';

interface SearchOptions {
  limit?: number;
  threshold?: number;
  filters?: Record<string, any>;
}

export function useKnowledgeBase() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addDocument = useCallback(async (document: Document) => {
    setIsLoading(true);
    try {
      // Here you would typically process the document, extract text, 
      // generate embeddings, etc.
      setDocuments(prev => [...prev, {
        ...document,
        id: crypto.randomUUID(),
        uploadDate: new Date(),
        lastModified: new Date()
      }]);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add document');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeDocument = useCallback(async (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
  }, []);

  const searchKnowledge = useCallback(async (
    query: string,
    options: SearchOptions = {}
  ) => {
    setIsLoading(true);
    try {
      const {
        limit = 5,
        threshold = 0.7,
        filters = {}
      } = options;

      // Here you would typically:
      // 1. Convert query to embedding
      // 2. Perform semantic search
      // 3. Filter and rank results
      
      const results = documents
        .filter(doc => {
          // Apply filters
          return Object.entries(filters).every(([key, value]) => 
            doc[key as keyof Document] === value
          );
        })
        .filter(doc => 
          // Simple text search for now
          doc.content.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, limit);

      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search knowledge base');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [documents]);

  const updateDocument = useCallback(async (
    documentId: string,
    updates: Partial<Document>
  ) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId
        ? { ...doc, ...updates, lastModified: new Date() }
        : doc
    ));
  }, []);

  const getDocument = useCallback((documentId: string) => {
    return documents.find(doc => doc.id === documentId);
  }, [documents]);

  return {
    documents,
    isLoading,
    error,
    addDocument,
    removeDocument,
    searchKnowledge,
    updateDocument,
    getDocument
  };
} 