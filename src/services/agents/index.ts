// Re-export all agent-related services and types
export { BaseAgent } from './BaseAgent';
export { EmailAgent } from './EmailAgent';
export { CalendarAgent } from './CalendarAgent';
export { TaskAgent } from './TaskAgent';
export { DocumentAgent } from './DocumentAgent';

// Re-export from the parent directory
export { AgentCreationService } from '../AgentCreationService';

// Export types more selectively to avoid ambiguity
// Agent types
export type { 
  AgentType,
  AgentStatus,
  Agent
} from '../../types/agent';

// Workflow types
export type {
  WorkflowPattern,
  WorkflowPatternType,
  WorkflowAction,
  WorkflowMetrics,
  WorkflowSuggestion,
  ActionMetrics
} from '../../types/workflow'; 