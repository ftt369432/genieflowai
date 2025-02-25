import type { AgentConfig } from './agents';

export interface CapabilityContext {
  modelConfig: AgentConfig['modelConfig'];
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface Capability {
  id: string;
  name: string;
  description: string;
  preprocess?: (input: any) => Promise<any>;
  execute: (input: any, context: CapabilityContext) => Promise<any>;
  postprocess?: (output: any) => Promise<any>;
}

export interface DocumentProcessingCapability extends Capability {
  supportedFormats: string[];
  extractText: (document: Buffer) => Promise<string>;
  analyze: (text: string) => Promise<any>;
}

export interface DataAnalysisCapability extends Capability {
  supportedDataTypes: string[];
  analyze: (data: any) => Promise<any>;
  generateInsights: (analysis: any) => Promise<any>;
}

export interface CommunicationCapability extends Capability {
  channels: ('email' | 'chat' | 'voice')[];
  compose: (prompt: string, context: any) => Promise<string>;
  respond: (message: string, context: any) => Promise<string>;
} 