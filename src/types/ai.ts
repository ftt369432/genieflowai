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
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system' | 'error';
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface DocumentReference {
  id: string;
  title: string;
  excerpt: string;
  relevance?: number;
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
  type: 'text' | 'pdf' | 'doc' | 'docx' | 'txt' | 'md' | 'markdown' | 'drive' | 'image' |
    'csv' | 'json' | 'yaml' | 'yml' | 'html' | 'css' | 'scss' | 'sass' | 'sql' | 'xml' |
    'js' | 'jsx' | 'ts' | 'tsx' | 'py' | 'rb' | 'java' | 'go' | 'rs' | 'cpp' | 'c' |
    'h' | 'hpp' | 'sh' | 'bash' | 'swift' | 'kt' | 'kotlin' | 'php';
  metadata: {
    dateCreated: string;
    dateModified?: string;
    tags?: string[];
    size?: number;
    author?: string;
    source?: string;
  };
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