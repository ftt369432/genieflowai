export interface Document {
  id: string;
  name: string;
  type: string;
  content: string;
  size: number;
  uploadDate: Date;
  lastModified: Date;
  tags: string[];
  metadata?: Record<string, any>;
  insights?: {
    keyPoints: string[];
    topics: string[];
    sentiment: 'positive' | 'negative' | 'neutral';
    entities: string[];
  };
} 