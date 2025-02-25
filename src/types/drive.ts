export interface DriveDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: Date;
  lastModified: Date;
  tags: string[];
  summary?: string;
  insights: {
    keyPoints: string[];
    entities: string[];
    sentiment: 'positive' | 'negative' | 'neutral';
    topics: string[];
  };
}