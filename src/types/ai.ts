export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'google' | 'anthropic';
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'error';
  timestamp: Date;
  documents?: DocumentReference[];
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
  type: 'pdf' | 'doc' | 'docx' | 'txt' | 'md' | 'xlsx' | 'pptx' | 'drive' | 'image';
  folderId: string | null; // Reference to parent folder
  summary?: string;
  tags: string[];
  embedding?: number[]; // Vector embedding for semantic search
  createdAt: Date;
  updatedAt: Date;
  // Drive-specific fields
  size?: number;
  url?: string;
  thumbnailUrl?: string;
  mimeType?: string;
  shared?: boolean;
  ownerId?: string;
  lastModifiedBy?: string;
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