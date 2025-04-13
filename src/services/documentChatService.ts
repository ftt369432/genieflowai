import { AIDocument, Message, SearchResult, AIAssistant } from '../types/ai';
import { getEmbedding } from './embeddingService';
import { useAssistantStore } from '../store/assistantStore';
import { useKnowledgeBaseStore } from '../store/knowledgeBaseStore';

interface DocumentChatOptions {
  maxTokens?: number;
  temperature?: number;
  relevanceThreshold?: number;
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

  const messages = [
    { role: 'system', content: systemPrompt || defaultSystemPrompt },
    ...previousMessages,
    { role: 'user', content: query }
  ];

  // Make API call to OpenAI
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages,
      max_tokens: maxTokens,
      temperature,
    })
  });

  if (!response.ok) {
    throw new Error('Failed to get response from OpenAI');
  }

  const data = await response.json();
  
  return {
    message: data.choices[0].message.content,
    relevantDocuments: relevantDocs.map(({ doc, similarity }) => ({
      document: doc,
      similarity
    }))
  };
}

/**
 * Chat with documents using a specific assistant's knowledge base
 * @param assistantIdOrObject - Either the ID of the assistant or the assistant object itself
 */
export async function chatWithAssistant(
  assistantIdOrObject: string | AIAssistant,
  query: string,
  previousMessages: Message[] = [],
  options: DocumentChatOptions = {}
) {
  // Get the assistant config
  let assistant: AIAssistant | undefined;
  
  if (typeof assistantIdOrObject === 'string') {
    // Get assistant by ID
    assistant = useAssistantStore.getState().getAssistantById(assistantIdOrObject);
    if (!assistant) {
      throw new Error(`Assistant with ID ${assistantIdOrObject} not found`);
    }
  } else {
    // Use the passed assistant object directly
    assistant = assistantIdOrObject;
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
  
  // If no documents are found after filtering, use the assistant's system prompt directly
  if (assistantDocuments.length === 0) {
    // Mock conversation response for development
    if (import.meta.env.DEV) {
      const mockResponse = await simulateAIResponse(query, assistant.systemPrompt || "");
      return {
        message: mockResponse,
        relevantDocuments: []
      };
    }
    
    // For production, use the API with just the system prompt
    try {
      const systemPrompt = assistant.systemPrompt || "You are a helpful AI assistant. Provide accurate, detailed, and thoughtful responses.";
      
      const messages = [
        { role: 'system', content: systemPrompt },
        ...previousMessages,
        { role: 'user', content: query }
      ];
      
      // Make API call to OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages,
          max_tokens: options.maxTokens || 1000,
          temperature: options.temperature || 0.7,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from OpenAI');
      }

      const data = await response.json();
      
      return {
        message: data.choices[0].message.content,
        relevantDocuments: []
      };
    } catch (error) {
      console.error("Error calling AI API:", error);
      return {
        message: "I'm having trouble accessing my knowledge base at the moment. Please try again later or contact support if the issue persists.",
        relevantDocuments: []
      };
    }
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
 * For development only - simulate AI response without calling the API
 */
async function simulateAIResponse(query: string, systemPrompt: string): Promise<string> {
  console.log("Simulating AI response with:", { query, systemPrompt });
  
  // Wait for a realistic delay to simulate API call
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  // Return a mock response based on the query
  if (query.toLowerCase().includes("legal") || query.toLowerCase().includes("law")) {
    return "As a legal assistant, I can help with that. Legal matters require careful consideration, and while I can provide information, remember that this doesn't constitute legal advice. For your specific situation, consulting with a licensed attorney is recommended.";
  } else if (query.toLowerCase().includes("hello") || query.toLowerCase().includes("hi")) {
    return "Hello! I'm your AI assistant. How can I help you today?";
  } else if (query.toLowerCase().includes("help")) {
    return "I'm here to assist you with questions, information, and tasks. What specifically would you like help with?";
  } else {
    return "I understand your question about \"" + query + "\". Let me provide a helpful response based on my knowledge. If you need more specific information, please let me know and I'll do my best to assist you further.";
  }
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