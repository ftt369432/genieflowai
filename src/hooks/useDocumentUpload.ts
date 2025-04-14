import { useState, useCallback } from 'react';
import { AIDocument } from '../types/ai';
import { documentProcessingService } from '../services/documents/documentProcessingService';
import { getEmbedding } from '../services/embeddingService';
import { useKnowledgeBaseStore } from '../store/knowledgeBaseStore';
import { useToast } from '../hooks/useToast';
import { nanoid } from 'nanoid';

export function useDocumentUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { addDocument } = useKnowledgeBaseStore();
  const { toast } = useToast();

  const uploadDocument = useCallback(async (
    file: File, 
    folderId: string
  ): Promise<AIDocument | null> => {
    try {
      setIsUploading(true);
      setProgress(10);

      // Extract document content
      console.log(`Processing document: ${file.name}`);
      let content = '';
      try {
        content = await documentProcessingService.extractText(file);
        setProgress(40);
      } catch (extractError) {
        console.error('Error extracting text:', extractError);
        toast({
          title: 'Warning',
          description: `Text extraction partially failed for ${file.name}. Document may have limited searchability.`,
          variant: 'default',
        });
        content = `Failed to extract complete text from ${file.name}`;
      }

      // Generate embedding
      console.log(`Generating embedding for: ${file.name}`);
      let embedding: number[] = [];
      try {
        embedding = await getEmbedding(content);
        setProgress(70);
      } catch (embeddingError) {
        console.error('Error generating embedding:', embeddingError);
        // Log error but continue with empty embedding
        // The embeddingService should already have a fallback mechanism
        toast({
          title: 'Warning',
          description: `Embedding generation failed for ${file.name}. Document may have reduced searchability.`,
          variant: 'default',
        });
        // We'll use the fallback embedding from our service
        embedding = await getEmbedding(content);
      }

      // Get document type from filename
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      const documentType = getDocumentTypeFromExtension(fileExtension);

      // Create document object
      const document: AIDocument = {
        id: nanoid(),
        title: file.name,
        content,
        folderId,
        tags: [],
        metadata: {
          source: 'upload',
          title: file.name,
          date: new Date(),
          category: documentType,
        },
        embedding,
        createdAt: new Date(),
        updatedAt: new Date(),
        sourceType: 'upload',
        sourceId: file.name
      };

      // Add to knowledge base
      console.log(`Adding document to knowledge base: ${file.name}`);
      await addDocument(document);
      setProgress(100);

      toast({
        title: 'Success',
        description: `Document ${file.name} uploaded successfully.`,
        variant: 'success',
      });

      return document;
    } catch (error) {
      console.error('Document upload failed:', error);
      toast({
        title: 'Error',
        description: `Failed to upload ${file.name}. Please try again.`,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, [addDocument, toast]);

  const uploadMultipleDocuments = useCallback(async (
    files: File[], 
    folderId: string
  ): Promise<AIDocument[]> => {
    const results: AIDocument[] = [];
    
    for (const file of files) {
      const doc = await uploadDocument(file, folderId);
      if (doc) {
        results.push(doc);
      }
    }
    
    return results;
  }, [uploadDocument]);

  // Helper function to determine document type from file extension
  function getDocumentTypeFromExtension(extension: string): string {
    const documentTypes: Record<string, string> = {
      pdf: 'PDF',
      doc: 'Document',
      docx: 'Document',
      txt: 'Text',
      md: 'Markdown',
      ppt: 'Presentation',
      pptx: 'Presentation',
      xls: 'Spreadsheet',
      xlsx: 'Spreadsheet',
      csv: 'CSV',
      jpg: 'Image',
      jpeg: 'Image',
      png: 'Image',
      gif: 'Image'
    };
    
    return documentTypes[extension] || 'Unknown';
  }

  return {
    uploadDocument,
    uploadMultipleDocuments,
    isUploading,
    progress
  };
} 