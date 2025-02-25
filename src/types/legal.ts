export interface LegalCase {
  id: string;
  title: string;
  caseNumber: string;
  court: string;
  status: 'active' | 'closed' | 'pending';
  type: string;
  filingDate: Date;
  parties: {
    plaintiff: string;
    defendant: string;
  };
  description: string;
  documents: LegalDocument[];
  events: CaseEvent[];
  tags: string[];
}

export interface LegalDocument {
  id: string;
  title: string;
  type: string;
  filingDate: Date;
  status: string;
  content: string;
}

export interface CaseEvent {
  id: string;
  title: string;
  date: Date;
  type: string;
  description: string;
  documents: string[];
}

export interface ResearchQuery {
  keywords: string[];
  courts?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  jurisdiction?: string;
}

export interface ResearchResult {
  id: string;
  title: string;
  citation: string;
  summary: string;
  relevance: number;
  date: Date;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: string[];
}