import type { WorkflowPattern } from './workflow';

// Consolidate agent-related types from multiple files into one
export type AgentType = 'assistant' | 'research' | 'development' | 'analysis';

export type AgentStatus = 'active' | 'idle' | 'error';

export type AutonomyLevel = 'supervised' | 'semi-autonomous' | 'autonomous';

export interface AgentConfig {
  id: string;
  name: string;
  type: AgentType;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  capabilities: string[];
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
}

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  status: AgentStatus;
  autonomyLevel: AutonomyLevel;
  capabilities: string[];
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
    capabilities: string[];
    autonomyLevel: "supervised" | "semi-autonomous" | "autonomous";
    triggers: string[];
  };
} 