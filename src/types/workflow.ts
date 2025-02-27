import { AgentConfig } from './agents';

export type AutonomyLevel = 'supervised' | 'semi-autonomous' | 'autonomous';

export type WorkflowPatternType = 
  | 'sequence'
  | 'parallel'
  | 'conditional'
  | 'repetitive'
  | 'learning'
  | 'process'
  | 'automation';

export interface WorkflowAction {
  id: string;
  type: string;
  input: any;
  output?: any;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
  duration: number;
}

export interface UserAction {
  type: string;
  payload: any;
  timestamp: Date;
  userId: string;
}

export interface WorkflowPattern {
  id: string;
  name: string;
  description: string;
  type: 'learning' | 'fixed';
  actions: UserAction[];
  frequency: number;
  confidence: number;
}

export interface WorkflowMetrics {
  successRate: number;
  averageDuration: number;
  completionRate: number;
  errorRate: number;
  patternMatches: number;
}

export interface WorkflowSuggestion {
  type: 'automation' | 'learning' | 'optimization';
  description: string;
  confidence: number;
  suggestedAgent: {
    name: string;
    capabilities: string[];
    autonomyLevel: AutonomyLevel;
    triggers: string[];
  };
}

export interface AgentSuggestion {
  id: string;
  patternId: string;
  description: string;
  confidence: number;
  potentialBenefits: string[];
  estimatedTimesSaved: number;
}

export interface AgentExecutionResult {
  action: string;
  result: any;
  timestamp: Date;
  error: string | null;
}

export interface ActionMetrics {
  action: string;
  success: boolean;
  duration?: number;
  error?: string;
  output?: any;
}

export interface AgentMetrics {
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  lastExecution: Date | null;
}

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
} 