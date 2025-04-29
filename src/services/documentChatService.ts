import { AIDocument, Message, SearchResult, AIAssistant } from '../types/ai';
import { getEmbedding } from './embeddingService';
import { useAssistantStore } from '../store/assistantStore';
import { useKnowledgeBaseStore } from '../store/knowledgeBaseStore';
import { geminiService } from './ai/gemini';

interface DocumentChatOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
  systemPrompt?: string;
}

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
    model = 'gemini-2.0-flash',
    systemPrompt
  } = options;

  try {
    // Get embedding for the query
    const queryEmbedding = await getEmbedding(query);

    // Find relevant documents
    const relevantDocs = documents
      .filter(doc => doc.embedding)
      .map(doc => {
        const similarity = cosineSimilarity(queryEmbedding, doc.embedding!);
        return { doc, similarity };
      })
      .filter(({ similarity }) => similarity > 0.7)
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

    // Convert to format suitable for Gemini API
    const conversationHistory = previousMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      content: msg.content
    }));

    // Create a single comprehensive prompt that includes system instructions, context, and user query
    const fullPrompt = `${systemPrompt || defaultSystemPrompt}
    
Previous messages:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

User: ${query}
`;

    // Use Gemini API through our simplified service instead of OpenAI
    const response = await geminiService.getCompletion(fullPrompt, {
      maxTokens: maxTokens,
      temperature: temperature
    });

    return {
      message: response,
      relevantDocuments: relevantDocs.map(({ doc, similarity }) => ({
        document: doc,
        similarity
      }))
    };
  } catch (error) {
    console.error('Error in chatWithDocuments:', error);
    if (error instanceof Error) {
      return {
        message: `Error processing your request: ${error.message}. Please try again.`,
        relevantDocuments: []
      };
    }
    return {
      message: 'An unknown error occurred while processing your request. Please try again.',
      relevantDocuments: []
    };
  }
}

/**
 * Chat with documents using a specific assistant's knowledge base
 * @param assistantIdOrObject - Either the ID of the assistant or the assistant object itself
 */
export async function chatWithAssistant(
  assistant: AIAssistant,
  message: string,
  options: DocumentChatOptions = {}
): Promise<string> {
  try {
    const { maxTokens = 2048, temperature = 0.7, model = 'gemini-2.0-flash', systemPrompt } = options;

    // Construct the full prompt with system message if provided
    const fullPrompt = systemPrompt 
      ? `${systemPrompt}\n\nUser: ${message}`
      : message;

    // Use Gemini API through our service
    const response = await geminiService.getCompletion(fullPrompt);
    return response;
  } catch (error) {
    console.error('Error in chatWithAssistant:', error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same dimensions');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
} 