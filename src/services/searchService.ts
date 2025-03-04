import axios from 'axios';
import config from '../config/api';

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
  source: string;
  date?: string;
  type?: 'article' | 'news' | 'blog' | 'academic';
  language?: string;
  region?: string;
  citations?: number;
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

export interface SearchFilters {
  timeRange?: 'any' | 'day' | 'week' | 'month' | 'year';
  type?: 'all' | 'articles' | 'news' | 'blogs' | 'academic';
  language?: 'en' | 'es' | 'fr' | 'de' | 'zh';
  region?: 'us' | 'uk' | 'eu' | 'asia' | 'global';
  sortBy?: 'relevance' | 'date' | 'citations';
}

export async function searchWeb(query: string, filters: SearchFilters = {}): Promise<SearchResult[]> {
  try {
    const { key, baseUrl } = config.serpapi;
    if (!key) {
      console.warn('SerpAPI key not configured');
      return [];
    }

    // Convert time range to SerpAPI format
    const timeMap: Record<string, string> = {
      day: 'past_24h',
      week: 'past_week',
      month: 'past_month',
      year: 'past_year'
    };

    // Convert region to country code
    const regionMap: Record<string, string> = {
      us: 'US',
      uk: 'GB',
      eu: 'EU',
      asia: 'AS',
      global: ''
    };

    // Build search parameters
    const params: Record<string, string> = {
      q: query,
      api_key: key,
      engine: 'google',
      num: '10',
      gl: regionMap[filters.region || 'us'], // Country to search from
      hl: filters.language || 'en'  // Interface language
    };

    // Add time filter if specified
    if (filters.timeRange && filters.timeRange !== 'any') {
      params.tbs = `qdr:${timeMap[filters.timeRange]}`;
    }

    // Add type filter if specified
    if (filters.type && filters.type !== 'all') {
      switch (filters.type) {
        case 'news':
          params.tbm = 'nws';
          break;
        case 'blogs':
          params.tbm = 'blg';
          break;
        case 'academic':
          params.as_sitesearch = '.edu,.org';
          break;
      }
    }

    // Add sort parameter if specified
    if (filters.sortBy && filters.sortBy !== 'relevance') {
      switch (filters.sortBy) {
        case 'date':
          params.sort = 'date';
          break;
        case 'citations':
          params.sort = 'cite';
          break;
      }
    }

    const response = await axios.get<SearchResponse>(`${baseUrl}/search`, { params });

    // Process and enhance results
    return response.data.organic_results.map(result => ({
      ...result,
      source: 'google',
      type: determineResultType(result.link, filters.type),
      language: filters.language || detectLanguage(result.snippet),
      region: filters.region || 'global',
      citations: extractCitations(result)
    }));
  } catch (error) {
    console.error('Error searching web:', error);
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