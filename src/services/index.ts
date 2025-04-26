// Auth Services
export * from './auth';
export { default as auth } from './auth';

// Core services
export { aiService, taskService, calendarService, workflowOrchestrator, aiAssistantService } from './core/initializeServices';
export { AgentCreationService } from './AgentCreationService';
export { AIAssistantService } from './AIAssistantService';

// AI services - consolidated
export { geminiSimplifiedService } from './gemini-simplified';
export { AIServiceFactory } from './ai/aiServiceFactory';
export { BaseAIService } from './ai/baseAIService';

// Email Services
export * from './email';

// Calendar and Tasks Services
export * from './calendar/calendarService';
export * from './tasks/taskService';

// Integration Services
export * from './integration';

// Other Services
export * from './driveService';
export * from './GoogleApiService';
export * from './LearningService';
export * from './MindfulnessService';
export * from './MorningRoutineService';
export * from './searchService';
export * from './userService';
export * from './VoiceControl';
export * from './WorkflowLearner';
export * from './WorkflowOrchestrator';

// Keep specialized AI utilities
export { chatWithDocuments, chatWithAssistant } from './documentChatService';
export { getEmbedding, searchDocuments } from './embeddingService';

// Application services
export { searchWeb } from './searchService';
export { MorningRoutineService } from './MorningRoutineService';
export { VoiceControl } from './VoiceControl'; 