import { AIDocument, Message } from '../types/ai';
import { getEmbedding } from './embeddingService';

interface DocumentChatOptions {
  maxTokens?: number;
  temperature?: number;
  relevanceThreshold?: number;
}

export async function chatWithDocuments(
  query: string,
  documents: AIDocument[],
  previousMessages: Message[] = [],
  options: DocumentChatOptions = {}
) {
  const {
    maxTokens = 1000,
    temperature = 0.7,
    relevanceThreshold = 0.7
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
    .map(({ doc }) => `Document: ${doc.title}\n${doc.content}\n---`)
    .join('\n');

  const systemPrompt = `You are a helpful AI assistant with access to a knowledge base. 
Answer questions based on the provided documents. If you can't find relevant information, 
say so. Here are the relevant documents:

${context}`;

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