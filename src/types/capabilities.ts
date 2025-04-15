import type { AgentConfig } from './agent';

export interface CapabilityContext {
  model: AgentConfig['model'];
  temperature?: AgentConfig['temperature'];
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface Capability {
  id: string;
  name: string;
  description: string;
  category: 'communication' | 'data' | 'integration' | 'analysis' | 'utility';
  config?: Record<string, any>;
  requiresAuth?: boolean;
  isEnabled: boolean;
}

export interface CapabilityProvider {
  getCapabilities(): Capability[];
  hasCapability(id: string): boolean;
  invokeCapability(id: string, params: any, context?: CapabilityContext): Promise<any>;
}

export interface CapabilityRegistry {
  register(provider: CapabilityProvider): void;
  unregister(providerId: string): void;
  getAllCapabilities(): Capability[];
  getCapability(id: string): Capability | null;
  invoke(capabilityId: string, params: any, context?: CapabilityContext): Promise<any>;
}

export type ExecutionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
};

export interface CapabilityExecutor<T = any, P = any> {
  execute(params: P, context?: CapabilityContext): Promise<ExecutionResult<T>>;
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