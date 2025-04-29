/**
 * AI Types
 * 
 * This file defines the types related to AI functionality in the application.
 */

export interface AIDocument {
  id: string;
  title: string;
  content: string;
  type: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
  embedding?: number[];
  metadata?: {
    author?: string;
    language?: string;
    summary?: string;
    keywords?: string[];
  };
}

export interface AIFolder {
  id: string;
  name: string;
  description?: string;
  documents?: AIDocument[];
  parentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIPrompt {
  id: string;
  name: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  capabilities: string[];
  contextSize?: number;
  maxTokens?: number;
  temperature?: number;
  version?: string;
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

export interface MessageMetadata {
  sources?: Array<any>;
  assistantId?: string;
  model?: string;
  provider?: string;
  [key: string]: any;
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  metadata?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
}

export type AgentType = 'research' | 'work' | 'learning' | 'building' | 'general' | 'tasks' | 'email' | 'calendar' | 'drive';

export interface AIAssistant {
  id: string;
  name: string;
  description: string;
  model: string;
  provider: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  features?: string[];
  category?: 'general' | 'code' | 'analysis' | 'productivity';
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  lastUsed?: Date;
  usageCount?: number;
  successRate?: number;
  averageResponseTime?: number;
  knowledgeBase?: {
    id: string;
    name: string;
    documents: AIDocument[];
  }[];
  settings?: {
    tone?: string;
    style?: string;
    language?: string;
    format?: string;
  };
  metadata?: {
    version?: string;
    tags?: string[];
    capabilities?: string[];
    limitations?: string[];
  };
  capabilities?: string[];
  tags?: string[];
}

export interface AssistantResponse {
  message: Message;
  suggestions?: string[];
  actions?: {
    type: string;
    payload: any;
  }[];
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
  mode: string;
  systemPrompt: string;
  formatStyle: 'standard' | 'structured' | 'streamlined';
  streamingEnabled: boolean;
  thinkingMode: boolean;
  temperature: number;
  maxTokens: number;
  model: string; // Added model selection
}

export interface DocumentMetadata {
  title?: string;
  source?: string;
  date?: Date;
  author?: string;
  category?: string;
  tags?: string[];
  [key: string]: any;
}

export interface KnowledgeBaseFolder {
  id: string;
  name: string;
  documents?: AIDocument[];
}

export interface DocumentReference {
  id: string;
  title: string;
  type: string;
  url?: string;
  excerpt?: string;
  metadata?: {
    author?: string;
    date?: Date;
    source?: string;
  };
}

export interface SearchResult {
  document: AIDocument;
  score: number;
  highlights?: {
    field: string;
    snippet: string;
  }[];
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
  timeRange?: string;
  sourceType?: string;
  sortBy?: string;
  language?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface DocumentProcessingOptions {
  chunkSize?: number;
  maxChunks?: number;
  overlap?: number;
  language?: string;
  format?: string;
}