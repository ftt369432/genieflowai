import { AIDocument, EmbeddingResponse } from '../types/ai';

const OPENAI_API_URL = 'https://api.openai.com/v1/embeddings';

export async function getEmbedding(text: string): Promise<number[]> {
  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-ada-002'
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(
      error?.error?.message || 
      `Failed to get embedding: ${response.status} ${response.statusText}`
    );
  }

  const data: EmbeddingResponse = await response.json();
  return data.embedding;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

export async function searchDocuments(
  query: string,
  documents: AIDocument[],
  limit: number = 5
): Promise<SearchResult[]> {
  try {
    const queryEmbedding = await getEmbedding(query);
    
    const results = documents
      .map(doc => ({
        document: doc,
        similarity: doc.embedding 
          ? cosineSimilarity(queryEmbedding, doc.embedding)
          : 0
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return results;
  } catch (error) {
    console.error('Search failed:', error);
    // Return basic text search results as fallback
    return documents
      .map(doc => ({
        document: doc,
        similarity: (
          doc.title.toLowerCase().includes(query.toLowerCase()) ||
          doc.content.toLowerCase().includes(query.toLowerCase())
        ) ? 0.5 : 0
      }))
      .filter(result => result.similarity > 0)
      .slice(0, limit);
  }
} 