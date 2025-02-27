import type { WorkflowPattern } from './workflow';

// Consolidate agent-related types from multiple files into one
export interface AgentConfig {
  id: string;
  name: string;
  type: 'email' | 'calendar' | 'document' | 'task';
  capabilities: string[];
  pattern?: WorkflowPattern;
  metadata?: {
    created: Date;
    lastModified: Date;
    version: string;
  };
  config?: {
    modelName: string;
    maxTokens: number;
    temperature: number;
    basePrompt: string;
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

export interface Agent {
  id: string;
  name: string;
  type: string;
  capabilities: string[];
  status: 'active' | 'inactive' | 'training';
  metrics?: {
    successRate: number;
    responseTime: number;
    accuracy: number;
    uptime: number;
  };
  config: AgentConfig;
} 