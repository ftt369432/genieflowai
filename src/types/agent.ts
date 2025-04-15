import type { WorkflowPattern } from './workflow';

// Consolidate agent-related types from multiple files into one
export type AgentType = 'email' | 'task' | 'calendar' | 'knowledge' | 'general' | 'workflow' | 'unified' | 'document';

export type AgentStatus = 'active' | 'idle' | 'error' | 'inactive' | 'training' | 'paused';

export type AutonomyLevel = 'low' | 'medium' | 'high' | 'full';

export type AgentCapability = 
  | 'email-processing'
  | 'task-management'
  | 'calendar-scheduling'
  | 'knowledge-base'
  | 'document-analysis'
  | 'natural-language'
  | 'conversational'
  | 'workflow-automation'
  | 'context-aware'
  | string; // Allow for string extension until all capabilities are strictly typed

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
  accuracy: number;
  responseTime: number;
  completionRate: number;
  userSatisfaction: number;
  lastUpdated: Date;
}

export interface Agent {
  config: AgentConfig;
  id: string;
  name: string;
  description: string;
  type: AgentType;
  status: 'active' | 'inactive' | 'training';
  context?: ContextData[];
  metrics?: AgentMetrics;
  createdAt: Date;
  updatedAt: Date;
  lastActive?: Date;
  initialize(): Promise<void>;
  process(input: string, context?: any): Promise<string>;
  learn(data: any): Promise<void>;
  getCapabilities(): AgentCapability[];
  serialize(): object;
}

export interface AgentSuggestion {
  id: string;
  agentId: string;
  suggestion: string;
  context: string;
  type: 'action' | 'response' | 'follow-up';
  confidence: number;
  createdAt: Date;
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
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface ContextData {
  type: string;
  source: string;
  data: any; // The actual context data - can be structured differently based on type
  relevance: number;
  timestamp: Date;
} 