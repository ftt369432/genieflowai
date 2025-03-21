export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'google' | 'anthropic';
}

export interface AIConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  context?: DocumentReference[];
}

export interface MessageMetadata {
  mode?: 'flash' | 'flash-lite' | 'pro';
  model?: string;
  provider?: string;
  tokens?: number;
  processingTime?: number;
  context?: DocumentReference[];
  error?: string;
  edited?: boolean;
  threadId?: string;
  parentId?: string;
  reactions?: { [key: string]: string[] };
  formatting?: {
    isBold?: boolean;
    isItalic?: boolean;
    isCode?: boolean;
    language?: string;
  };
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'error';
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface DocumentReference {
  id: string;
  title: string;
  excerpt: string;
  type: string;
  relevance: number;
}

export interface AIFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIDocument {
  id: string;
  title: string;
  content: string;
  type: 'image' | 'text';
  metadata: {
    dateCreated: string;
    dateModified: string;
    tags: string[];
    source: string;
    size?: number;
    author?: string;
  };
  summary: string;
  language: string;
  chunks: string[];
  embedding: number[];
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  snippet: string;
  link: string;
  credibilityScore?: number;
  citations?: number;
  date?: string;
  type?: 'article' | 'news' | 'blog' | 'academic';
  language?: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  model: string;
  provider: string;
  systemPrompt?: string;
  category?: 'work' | 'learning' | 'productivity' | 'personal';
  tags?: string[];
  pinned?: boolean;
  documents?: AIDocument[];
  clientId?: string;
  caseType?: string;
  caseStatus?: 'active' | 'pending' | 'closed';
  lastAccessed?: Date;
}

export interface AIState extends AIConfig {
  isLoading: boolean;
  error: string | null;
}

export interface SearchFilters {
  timeRange: 'any' | 'day' | 'week' | 'month' | 'year';
  sourceType: string;
  sortBy: 'relevance' | 'date' | 'citations';
  minCredibility: number;
  excludedDomains: string[];
  includedDomains: string[];
  language: 'en' | 'es' | 'fr' | 'de' | 'zh';
  contentType: 'all' | 'article' | 'paper' | 'book' | 'code';
}

export interface DocumentProcessingOptions {
  extractText: boolean;
  generateSummary: boolean;
  detectLanguage: boolean;
  extractMetadata: boolean;
  performOCR: boolean;
  splitIntoChunks: boolean;
  chunkSize: number;
} 