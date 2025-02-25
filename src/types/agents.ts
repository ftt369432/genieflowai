import { AutonomyLevel } from './workflow';

export type IndustryType = 'legal' | 'healthcare' | 'education' | 'real-estate' | 'general';

export type AgentCapability = 
  | 'email-processing'
  | 'document-analysis'
  | 'scheduling'
  | 'task-management'
  | 'natural-language'
  | 'calendar-management'
  | 'drafting';

export type AgentType = 'email' | 'document' | 'calendar' | 'task' | 'custom';
export type AgentStatus = 'active' | 'inactive' | 'training' | 'error' | 'paused';
export type ActionStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface AgentConfig {
  id: string;
  name: string;
  type: AgentType;
  capabilities: AgentCapability[];
  autonomyLevel: AutonomyLevel;
  triggers: string[];
  config: {
    modelName: string;
    maxTokens: number;
    temperature: number;
    basePrompt: string;
  };
  metrics: {
    actionsCompleted: number;
    successRate: number;
    averageResponseTime: number;
    lastActive: Date;
  };
}

export interface Agent extends AgentConfig {
  status: AgentStatus;
  description: string;
  metrics: {
    tasksCompleted: number;
    accuracy: number;
    responseTime: number;
    uptime: number;
    successRate: number;
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

export interface AgentMetrics {
  tasksCompleted: number;
  accuracy: number;
  responseTime: number;
  uptime: number;
  successRate: number;
} 