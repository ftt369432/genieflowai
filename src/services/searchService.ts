import axios from 'axios';
import config from '../config/api';
import { SearchFilters } from '../types/ai';

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  snippet: string;
  link: string;
  credibilityScore: number;
  citations: number;
  date: string;
  type: 'article' | 'news' | 'blog' | 'academic';
  language: string;
  excerpt: string;
  position: number;
  source: string;
}

export interface SearchResponse {
  organic_results: SearchResult[];
  search_metadata: {
    id: string;
    status: string;
    json_endpoint: string;
    created_at: string;
    processed_at: string;
    google_url: string;
    raw_html_file: string;
    total_time_taken: number;
  };
}

export async function searchWeb(query: string, filters: SearchFilters): Promise<SearchResult[]> {
  try {
    // Implement actual search logic here
    // This is a placeholder implementation
    return [
      {
        id: '1',
        title: 'Example Result',
        content: 'Example content',
        snippet: 'Example snippet',
        link: 'https://example.com',
        credibilityScore: 0.8,
        citations: 5,
        date: new Date().toISOString(),
        type: 'article',
        language: 'en',
        excerpt: 'Example excerpt',
        position: 1,
        source: 'web'
      }
    ];
  } catch (error) {
    console.error('Error performing web search:', error);
    return [];
  }
}

function determineResultType(url: string, requestedType?: string): SearchResult['type'] {
  if (requestedType && requestedType !== 'all') {
    return requestedType as SearchResult['type'];
  }

  if (url.includes('news.') || url.includes('/news/')) {
    return 'news';
  }
  if (url.includes('blog.') || url.includes('/blog/')) {
    return 'blog';
  }
  if (url.includes('.edu') || url.includes('/research/') || url.includes('/paper/')) {
    return 'academic';
  }
  return 'article';
}

function detectLanguage(text: string): string {
  // Simple language detection based on common words
  // In a production environment, use a proper language detection library
  const languagePatterns = {
    es: /\b(el|la|los|las|en|de|por|para)\b/i,
    fr: /\b(le|la|les|des|en|dans|pour|par)\b/i,
    de: /\b(der|die|das|den|dem|des|ein|eine)\b/i,
    zh: /[\u4e00-\u9fff]/,
  };

  for (const [lang, pattern] of Object.entries(languagePatterns)) {
    if (pattern.test(text)) {
      return lang;
    }
  }

  return 'en'; // Default to English
}

function extractCitations(result: any): number {
  // Extract citation count from result metadata if available
  // This is a simplified version - in production, you might want to use a citation API
  const citationMatch = result.snippet?.match(/Cited by (\d+)/i);
  return citationMatch ? parseInt(citationMatch[1], 10) : 0;
}

export type { SearchFilters }; 