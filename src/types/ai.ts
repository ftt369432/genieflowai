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
  model?: 'gemini-2.0-flash' | 'gemini-2.0-flash-lite' | 'gemini-2.0-pro' | 'gemini-pro';
  processingTime?: number;
  error?: boolean;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'error';
  timestamp: Date;
  documents?: DocumentReference[];
  metadata?: MessageMetadata;
}

export interface DocumentReference {
  id: string;
  title: string;
  excerpt: string;
  type: 'pdf' | 'doc' | 'txt' | 'md';
  relevance: number; // 0-1 score for how relevant the document is
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
  type: 'pdf' | 'doc' | 'docx' | 'txt' | 'md' | 'drive' | 'image';
  tags: string[];
  category?: string;
  clientId?: string;
  caseType?: string;
  caseStatus?: 'active' | 'pending' | 'closed';
  metadata?: {
    author?: string;
    court?: string;
    caseNumber?: string;
    filingDate?: string;
    jurisdiction?: string;
    docType?: 'pleading' | 'motion' | 'order' | 'evidence' | 'correspondence';
  };
  insights?: {
    topics: string[];
    relevance: number;
    summary?: string;
    citations?: string[];
    keyPoints?: string[];
  };
  createdAt: string;
  updatedAt: string;
  folderId: string | null;
  // Drive-specific fields
  size?: number;
  url?: string;
  thumbnailUrl?: string;
  mimeType?: string;
  shared?: boolean;
  ownerId?: string;
  lastModifiedBy?: string;
  references?: {
    documentId: string;
    title: string;
    relevance: number;
  }[];
}

export interface SearchResult {
  document: AIDocument;
  similarity: number;
}

export interface EmbeddingResponse {
  embedding: number[];
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
} 