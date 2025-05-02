import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIDocument, Message, SearchResult } from '../types/ai';
import { getEmbedding } from './embeddingService';
import { useAssistantStore } from '../store/assistantStore';
import { useKnowledgeBaseStore } from '../store/knowledgeBaseStore';

interface DocumentChatOptions {
  maxTokens?: number;
  temperature?: number;
  relevanceThreshold?: number;
  systemPrompt?: string;
}

// Initialize Gemini client
const genAI = import.meta.env.VITE_GEMINI_API_KEY ? 
  new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY) : null;

/**
 * Chat with documents using semantic search and RAG
 */
export async function chatWithDocuments(
  query: string,
  documents: AIDocument[],
  previousMessages: Message[] = [],
  options: DocumentChatOptions = {}
) {
  const {
    maxTokens = 1000,
    temperature = 0.7,
    relevanceThreshold = 0.7,
    systemPrompt
  } = options;

  // Get embedding for the query
  const queryEmbedding = await getEmbedding(query);

  // Find relevant documents
  const relevantDocs = documents
    .filter(doc => doc.embedding)
    .map(doc => {
      const similarity = cosineSimilarity(queryEmbedding, doc.embedding!);
      return { doc, similarity };
    })
    .filter(({ similarity }) => similarity > relevanceThreshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);

  // Construct prompt with context
  const context = relevantDocs
    .map(({ doc }) => `Document: ${doc.metadata?.title || 'Untitled'}\n${doc.content}\n---`)
    .join('\n');

  const defaultSystemPrompt = `You are a helpful AI assistant with access to a knowledge base. 
Answer questions based on the provided documents. If you can't find relevant information, 
say so. Here are the relevant documents:

${context}`;

  // Construct the full prompt for Gemini
  const fullPrompt = `${systemPrompt || defaultSystemPrompt}

Previous conversation:
${previousMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

User: ${query}`;

  if (!genAI) {
    throw new Error('Gemini client is not initialized');
  }

  const response = await genAI.generateMessage({
    prompt: fullPrompt,
    maxOutputTokens: maxTokens,
    temperature,
  });

  if (!response) {
    throw new Error('Failed to get response from Gemini');
  }

  return {
    message: response.candidates[0].content,
    relevantDocuments: relevantDocs.map(({ doc, similarity }) => ({
      document: doc,
      similarity
    }))
  };
}

/**
 * Chat with documents using a specific assistant's knowledge base
 */
export async function chatWithAssistant(
  assistantId: string,
  query: string,
  previousMessages: Message[] = [],
  options: DocumentChatOptions = {}
) {
  // Get the assistant config
  const assistant = useAssistantStore.getState().getAssistantById(assistantId);
  if (!assistant) {
    throw new Error(`Assistant with ID ${assistantId} not found`);
  }
  
  // Get all documents from knowledge base store
  const allDocuments = useKnowledgeBaseStore.getState().documents;
  
  // Get folder IDs assigned to this assistant
  const folderIds = assistant.knowledgeBase?.map(folder => folder.id) || [];
  
  // Filter documents to only include those in the assistant's folders
  const assistantDocuments = allDocuments.filter(doc => {
    // Check if the document is in one of the assigned folders
    // This handles both the AIDocument type (which has folderId as a direct property)
    // and possible variations in the document structure
    const docFolderId = (doc as any).folderId;
    return docFolderId && folderIds.includes(docFolderId);
  });
  
  // If no documents are found after filtering
  if (assistantDocuments.length === 0) {
    return {
      message: "I don't have any knowledge base documents assigned to me yet. Please add documents to my knowledge base to help me answer your questions better.",
      relevantDocuments: []
    };
  }
  
  // Use the assistant's system prompt if available
  const systemPrompt = assistant.systemPrompt;
  
  // Use the existing chat function with filtered documents
  return chatWithDocuments(
    query,
    assistantDocuments,
    previousMessages,
    {
      ...options,
      systemPrompt
    }
  );
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}