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
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: string[];
  metadata?: {
    domain: 'legal';
    [key: string]: unknown;
  };
}

/**
 * Hearing information extracted from legal text
 */
export interface LegalHearingInfo {
  applicantName: string;
  respondentName: string;
  hearingDate: string | null;
  caseNumber: string;
  hearingStatus: string;
  claimType: string;
  keyIssues: string[];
  representationStatus: string;
}

/**
 * Result of processing legal text input
 */
export interface LegalCaseInputResult {
  detectedLegalContent: boolean;
  contentType?: string;
  confidence?: number;
  extractedInfo?: LegalHearingInfo;
  originalText: string;
}

/**
 * Legal Swarm Template
 */
export interface LegalSwarmTemplate {
  id: string;
  name: string;
  description: string;
  caseType: string;
  roles: {
    role: string;
    requiredCapabilities: string[];
    description: string;
    responsibilities: string[];
  }[];
  defaultInstructions: string;
}