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
  provider: string;
  capabilities: string[];
  contextSize: number;
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

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: Date;
}

export type AgentType = 'research' | 'work' | 'learning' | 'building' | 'general' | 'tasks' | 'email' | 'calendar' | 'drive';

export interface AIAssistant {
  id: string;
  name: string;
  type: AgentType;
  capabilities: string[];
  avatar?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  provider: string;
  defaultModel: AIModel;
  apiKey?: string;
  apiEndpoint?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  debug?: boolean;
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

export interface DocumentReference {
  id: string;
  title: string;
  type: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  url?: string;
  score: number;
  metadata?: Record<string, unknown>;
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
  region?: string;
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