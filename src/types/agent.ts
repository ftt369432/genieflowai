import type { WorkflowPattern } from './workflow';

// Consolidate agent-related types from multiple files into one
export type AgentType = 'assistant' | 'research' | 'development' | 'analysis' | 'email' | 'document' | 'calendar' | 'task' | 'custom';

export type AgentStatus = 'active' | 'idle' | 'error' | 'inactive' | 'training' | 'paused';

export type AutonomyLevel = 'supervised' | 'semi-autonomous' | 'autonomous';

export type AgentCapability = 
  | 'email-processing'
  | 'document-analysis'
  | 'scheduling'
  | 'task-management'
  | 'natural-language'
  | 'calendar-management'
  | 'drafting'
  | 'web-search'
  | 'data-analysis'
  | 'report-generation'
  | 'code-generation'
  | 'code-review'
  | 'debugging';

export interface AgentConfig {
  id: string;
  name: string;
  type: AgentType;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  capabilities: AgentCapability[];
  autonomyLevel: AutonomyLevel;
  triggers?: {
    events: string[];
    schedule?: string;
  };
}

export interface AgentMetrics {
  performance: number;
  tasks: {
    completed: number;
    total: number;
  };
  responseTime: number;
  successRate: number;
  lastUpdated: Date;
  accuracy: number;
  uptime: number;
}

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  status: AgentStatus;
  autonomyLevel: AutonomyLevel;
  capabilities: AgentCapability[];
  config: AgentConfig;
  metrics: AgentMetrics;
  lastActive: Date;
  performance: number;
  tasks: {
    completed: number;
    total: number;
  };
  triggers?: {
    events: string[];
    schedule?: string;
  };
}

export interface AgentSuggestion {
  type: string;
  description: string;
  confidence: number;
  suggestedAgent: {
    name: string;
    capabilities: AgentCapability[];
    autonomyLevel: AutonomyLevel;
    triggers: string[];
  };
}

export interface AgentAction {
  id: string;
  agentId: string;
  type: string;
  input: any;
  output?: any;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'completed' | 'failed';
}

export interface AgentFeedback {
  id: string;
  agentId: string;
  type: 'success' | 'failure' | 'improvement';
  feedback: string;
  timestamp: Date;
  context: Record<string, any>;
} 