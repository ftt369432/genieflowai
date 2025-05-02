import { AIService } from '../AIService';
import { TaskService } from '../TaskService';
import { CalendarService } from '../CalendarService';
import { WorkflowOrchestrator } from '../WorkflowOrchestrator';
import { AgentCreationService } from '../AgentCreationService';
import { VoiceControl } from '../VoiceControl';
import { AIAssistantService } from '../AIAssistantService';
import { geminiService } from '../gemini';

class ServiceContainer {
  private static instance: ServiceContainer;
  
  // Core Services
  public aiService: AIService;
  public taskService: TaskService;
  public calendarService: CalendarService;
  public workflowOrchestrator: WorkflowOrchestrator;
  public agentCreationService: AgentCreationService;
  public voiceControl: VoiceControl;
  public aiAssistant: AIAssistantService;

  private constructor() {
    // Initialize AI providers based on environment configuration
    const aiProvider = this.initializeAIService();
    
    // Initialize core services
    this.aiService = aiProvider;
    this.taskService = new TaskService(this.aiService);
    this.calendarService = new CalendarService(this.taskService, this.aiService);
    this.workflowOrchestrator = new WorkflowOrchestrator();
    this.agentCreationService = new AgentCreationService();
    this.voiceControl = new VoiceControl();
    
    // Initialize AI Assistant with default configuration
    const defaultPersonality = {
      name: 'Genie',
      traits: {
        openness: 0.8,
        conscientiousness: 0.9,
        extraversion: 0.7,
        agreeableness: 0.8,
        neuroticism: 0.3
      },
      preferences: {
        name: 'Default',
        focusPreferences: {
          ambientSound: false,
          soundType: 'nature',
          checkInterval: 30
        },
        communicationStyle: {
          verbosity: 'concise' as const,
          tone: 'formal' as const,
          useEmoji: false
        }
      },
      learningStyle: 'visual' as const,
      communicationStyle: {
        tone: 'formal' as const,
        verbosity: 0.7,
        formality: 0.8
      },
      workStyle: {
        peakProductivityHours: [9, 10, 11, 14, 15, 16],
        preferredTaskDuration: 45,
        breakFrequency: 90
      },
      update: () => {} // Add required update method
    };

    const defaultPreferences = {
      name: 'User',
      timezone: 'UTC',
      language: 'en',
      notificationPreferences: {
        email: true,
        push: true,
        voice: false
      },
      workingHours: {
        start: '09:00',
        end: '17:00'
      }
    };

    this.aiAssistant = new AIAssistantService(defaultPersonality, defaultPreferences);
  }

  private initializeAIService(): AIService {
    console.log('Initializing AI Service: Using Google Gemini as provider');
    return geminiService as any;
  }

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }
}

export const services = ServiceContainer.getInstance();

// Export individual services for convenience
export const {
  aiService,
  taskService,
  calendarService,
  workflowOrchestrator,
  agentCreationService,
  voiceControl,
  aiAssistant
} = services;