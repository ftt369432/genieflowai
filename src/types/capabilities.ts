import type { AgentConfig } from './agent';

export interface ParameterDefinition {
  name: string;
  type: string;
  description: string;
  required: boolean;
  defaultValue?: any;
  enumValues?: string[];
}

// Define a type for model configuration relevant to capabilities
export type ModelConfigForCapability = Pick<AgentConfig, 'model' | 'temperature' | 'maxTokens' | 'systemPrompt'>;

export interface CapabilityContext {
  modelConfig?: ModelConfigForCapability; // Use the new type
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface Capability {
  id: string;
  name: string;
  description: string;
  category?: string;
  version?: string;
  inputParameters: ParameterDefinition[];
  outputParameters: ParameterDefinition[];
  target: {
    type: 'function' | 'agent' | 'service' | 'workflow';
    identifier: string;
  };
  execute: (input: any, context: CapabilityContext) => Promise<any>;
  preprocess?: (input: any, context: CapabilityContext) => Promise<any>;
  postprocess?: (output: any, context: CapabilityContext) => Promise<any>;
  tags?: string[];
  permissionsRequired?: string[];
  cost?: number;
  exampleUsage?: Record<string, any>;
}

export interface DocumentProcessingCapability extends Capability {
  supportedFormats: string[];
}

export interface DataAnalysisCapability extends Capability {
  supportedDataTypes: string[];
}

export interface CommunicationCapability extends Capability {
  channels: ('email' | 'chat' | 'voice')[];
} 