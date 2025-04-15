// Core base types
export * from './ai';
export * from './actions';
export * from './documents';
export * from './drive';
export * from './calendar';
export * from './email';
export * from './execution';
export * from './genie';

// Handle modules with conflicting exports by using named exports
// Explicitly re-export from learning to avoid conflicts
export { 
  type UserBehavior,
  type LearningPattern,
  type LearningMetrics
} from './learning';

// Explicitly re-export from voice to avoid conflicts
export {
  type VoiceCommand
  // Don't export PersonalityProfile from voice as it conflicts
} from './voice';

// Explicitly re-export from legal to avoid conflicts  
export {
  type LegalDocument,
  type LegalCase, 
  type CaseEvent
} from './legal';

export * from './geniePersonalities';

// Explicitly re-export from personality to avoid conflicts
export {
  type PersonalityTraits,
  type PersonalityType,
  type CommunicationPreferences
} from './personality';

export * from './utils';
export * from './global';

// Fix google.d.ts not being a module by skipping it
// export * from './google';

// Export with specific renames to avoid conflicts
export { 
  type AgentConfig as AgentConfiguration,
  type AgentType as AgentCategory,
  type AgentMetrics as AgentPerformanceMetrics,
  type AutonomyLevel
} from './agent';

export { 
  type Task,
  type TaskStatus,
  type TaskPriority
} from './task';

export {
  type UserPreferences as UserSettingsPreferences
} from './assistant';

// Re-export specific workflow types to avoid conflicts
export {
  type WorkflowStep,
  type WorkflowPattern
} from './workflow';