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

export interface WorkflowPattern {
  id: string;
  name: string;
  type: WorkflowPatternType;
  description: string;
  frequency: number;
  confidence: number;
  complexity: number;
  capabilities: string[];
  triggers: string[];
  actions: WorkflowAction[];
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
  type: 'automation';
  description: string;
  confidence: number;
  suggestedAgent: {
    name: string;
    capabilities: string[];
    autonomyLevel: AutonomyLevel;
    triggers: string[];
  };
} 