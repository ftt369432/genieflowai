import { AIDocument, EmbeddingResponse } from '../types/ai';
import { supabase } from '../lib/supabase';

const OPENAI_API_URL = 'https://api.openai.com/v1/embeddings';

// Define SearchResult interface
interface SearchResult {
  document: AIDocument;
  similarity: number;
}

/**
 * Generates an embedding for the given text using Supabase's pgvector functions.
 * This uses the OpenAI embedding model via Supabase Edge Functions.
 * 
 * @param text The text to generate an embedding for
 * @returns A vector representation of the text
 */
export async function getEmbedding(text: string): Promise<number[]> {
  try {
    // Clean and truncate the text
    const input = cleanText(text);
    
    // Call the Supabase Edge Function to generate the embedding
    const { data, error } = await supabase.functions.invoke('generate-embedding', {
      body: { text: input }
    });
    
    if (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
    
    return data.embedding;
  } catch (error) {
    console.error('Error in getEmbedding:', error);
    
    // Use a fallback embedding generation approach
    return generateFallbackEmbedding(text);
  }
}

/**
 * Fallback method to generate a simple "pseudo-embedding" when the OpenAI API is unavailable.
 * This is NOT a real embedding and should only be used as a temporary fallback.
 * It simply hashes words to create a vector that can be used for basic matching.
 * 
 * @param text The text to generate a fallback embedding for
 * @returns A simple vector representation
 */
function generateFallbackEmbedding(text: string): number[] {
  // Simple word frequency vector as a fallback
  // This is NOT a real embedding but will allow basic functionality
  const words = cleanText(text).split(/\s+/).filter(Boolean);
  const wordFreq: Record<string, number> = {};
  
  // Count word frequencies
  for (const word of words) {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  }
  
  // Create a 1536-dimension vector (same as OpenAI's text-embedding-ada-002)
  const dimensions = 1536;
  const result = new Array(dimensions).fill(0);
  
  // Hash words into the vector
  for (const word of Object.keys(wordFreq)) {
    const hashValue = simpleHash(word) % dimensions;
    result[hashValue] += wordFreq[word];
  }
  
  // Normalize the vector
  const magnitude = Math.sqrt(result.reduce((sum, val) => sum + val * val, 0));
  return magnitude > 0 
    ? result.map(val => val / magnitude) 
    : result;
}

/**
 * Cleans and truncates text for embedding generation.
 * 
 * @param text The text to clean
 * @returns Cleaned text
 */
function cleanText(text: string): string {
  // Remove excessive whitespace
  let cleaned = text.trim().replace(/\s+/g, ' ');
  
  // Truncate to a max of 8192 characters (OpenAI's limit)
  if (cleaned.length > 8192) {
    cleaned = cleaned.substring(0, 8192);
  }
  
  return cleaned;
}

/**
 * Simple string hashing function.
 * 
 * @param str String to hash
 * @returns A numeric hash
 */
function simpleHash(str: string): number {
  let hash = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  
  return Math.abs(hash);
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
          (doc.content && doc.content.toLowerCase().includes(query.toLowerCase())) ||
          (doc.metadata?.title && doc.metadata.title.toLowerCase().includes(query.toLowerCase()))
        ) ? 0.5 : 0
      }))
      .filter(result => result.similarity > 0)
      .slice(0, limit);
  }
} 