/**
 * AI Types
 * 
 * This file defines the types related to AI functionality in the application.
 */

export interface AIDocument {
  id: string;
  content: string;
  metadata: {
    source: string;
    title?: string;
    author?: string;
    date?: Date;
    category?: string;
    tags?: string[];
  };
  embedding?: number[];
  relevanceScore?: number;
}

export interface AIFolder {
  id: string;
  name: string;
  documents: AIDocument[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AIPrompt {
  id: string;
  name: string;
  content: string;
  category: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'local' | 'other';
  capabilities: AICapability[];
  contextSize: number;
  apiKey?: string;
  endpoint?: string;
  parameters?: Record<string, any>;
}

export type AICapability = 
  | 'text-generation' 
  | 'chat' 
  | 'embeddings' 
  | 'image-generation' 
  | 'text-to-speech'
  | 'speech-to-text'
  | 'code-generation'
  | 'summarization'
  | 'translation';

export interface AIAssistant {
  id: string;
  name: string;
  description?: string;
  model: AIModel;
  systemPrompt?: string;
  knowledgeBase?: AIFolder[];
  avatarUrl?: string;
  settings: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    presencePenalty?: number;
    frequencyPenalty?: number;
  };
}

export interface AIMessage {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  createdAt: Date;
  metadata?: {
    tokens?: number;
    processingTime?: number;
    sources?: string[];
    functionCall?: {
      name: string;
      arguments: Record<string, any>;
    };
  };
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  assistant: AIAssistant;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    totalTokens?: number;
    tags?: string[];
    summary?: string;
  };
}

export interface AIAnalysis {
  summary: string;
  entities?: string[];
  keyPhrases?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  topics?: string[];
  language?: string;
  classification?: Record<string, number>;
  complexity?: 'simple' | 'moderate' | 'complex';
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