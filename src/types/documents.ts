export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'txt' | 'md';
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  size: number;
  metadata: {
    author?: string;
    lastModified: Date;
    version?: string;
  };
}

export interface DocumentWithAnalytics extends Document {
  insights: {
    keyPoints: string[];
    topics: string[];
    sentiment: 'positive' | 'negative' | 'neutral';
    entities: string[];
    readingTime: number;
    relevance: number;
  };
  references: Array<{
    documentId: string;
    title: string;
    relevance: number;
  }>;
}

export interface SearchOptions {
  filters?: {
    type?: string[];
    tags?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
  sort?: {
    field: keyof Document;
    order: 'asc' | 'desc';
  };
  limit?: number;
} 