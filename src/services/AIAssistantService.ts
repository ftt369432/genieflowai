import { PersonalityProfile } from '../types/personality';
import { GENIE_ARCHETYPES, PersonalityModifiers } from '../types/geniePersonalities';
import { WorkflowLearner } from './WorkflowLearner';
import { LearningService } from './LearningService';
import { 
  UserPreferences, 
  AssistantContext, 
  AssistantResponse, 
  Intent,
  AssistantAction 
} from '../types/assistant';
import { WorkflowPattern } from '../types/workflow';

export class AIAssistantService {
  private learningService: LearningService;
  private workflowLearner: WorkflowLearner;
  private currentContext: AssistantContext = {
    recentInteractions: [],
    userState: 'neutral',
    timeOfDay: 'morning',
    activeWorkflow: null
  };

  constructor(
    private personality: PersonalityProfile,
    private userPreferences: UserPreferences
  ) {
    this.learningService = new LearningService();
    this.workflowLearner = new WorkflowLearner();
    this.initializeAssistant();
  }

  private async initializeAssistant() {
    // Load user history and patterns
    await this.loadUserContext();
    this.setupContinuousLearning();
  }

  public async processInput(input: string): Promise<AssistantResponse> {
    // Update context with new input
    this.updateContext(input);

    // Analyze intent and emotion
    const intent = await this.analyzeIntent(input);
    const emotion = await this.analyzeEmotion(input);

    // Generate appropriate response
    const response = await this.generateResponse(input, intent, emotion);

    // Learn from interaction
    this.learnFromInteraction(input, response, intent);

    return response;
  }

  private async analyzeIntent(input: string): Promise<Intent> {
    // Categorize user intent
    const intents = {
      task: /create|make|do|start|schedule/i,
      query: /what|how|why|when|where/i,
      emotion: /feel|feeling|stress|happy|worried/i,
      workflow: /workflow|process|routine/i,
      system: /settings|configure|preferences/i
    };

    for (const [type, pattern] of Object.entries(intents)) {
      if (pattern.test(input)) {
        return {
          type: type as IntentType,
          confidence: this.calculateConfidence(input, pattern),
          entities: this.extractEntities(input)
        };
      }
    }

    return { type: 'unknown', confidence: 0.5, entities: [] };
  }

  private async generateResponse(
    input: string,
    intent: Intent,
    emotion: string
  ): Promise<AssistantResponse> {
    // Select appropriate personality based on context
    const personality = this.selectPersonality(intent, emotion);
    
    // Generate base response
    const baseResponse = await this.craftResponse(personality, intent, this.currentContext);
    
    // Personalize the response
    const personalizedResponse = this.personalizeResponse(baseResponse, this.currentContext);

    // Generate actions and suggestions
    const actions = await this.determineActions(intent);
    const suggestions = await this.generateSuggestions(intent);

    return {
      text: personalizedResponse,
      actions,
      suggestions,
      personality
    };
  }

  private selectPersonality(intent: Intent, emotion: string): PersonalityProfile {
    const timeOfDay = new Date().getHours();
    const workContext = this.determineWorkContext();

    // Adjust personality traits based on context
    const adjustedPersonality = {
      ...this.personality,
      communicationStyle: {
        ...this.personality.communicationStyle,
        formality: this.calculateFormality(intent, emotion),
        verbosity: this.calculateVerbosity(intent),
        tone: this.selectTone(emotion, timeOfDay)
      }
    };

    return adjustedPersonality;
  }

  private async craftResponse(
    personality: PersonalityProfile,
    intent: Intent,
    context: AssistantContext
  ): Promise<string> {
    let response = '';

    switch (intent.type) {
      case 'task':
        response = await this.generateTaskResponse(intent, personality);
        break;
      case 'query':
        response = await this.generateQueryResponse(intent, personality);
        break;
      case 'emotion':
        response = this.generateEmotionalResponse(intent, personality);
        break;
      case 'workflow':
        response = await this.generateWorkflowResponse(intent, personality);
        break;
      default:
        response = this.generateDefaultResponse(personality);
    }

    return this.applyPersonalityStyle(response, personality);
  }

  private calculateFormality(intent: Intent, emotion: string): number {
    let formality = 0.5; // Default mid-level formality

    // Adjust based on intent
    if (intent.type === 'task' || intent.type === 'workflow') {
      formality += 0.2; // More formal for business-related intents
    }

    // Adjust based on emotion
    if (emotion === 'stressed' || emotion === 'frustrated') {
      formality -= 0.1; // Less formal when user is stressed
    }

    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, formality));
  }

  private calculateVerbosity(intent: Intent): number {
    switch (intent.type) {
      case 'task':
        return 0.3; // Concise for tasks
      case 'query':
        return 0.7; // More detailed for questions
      case 'workflow':
        return 0.8; // Detailed for workflow suggestions
      default:
        return 0.5;
    }
  }

  private selectTone(emotion: string, hour: number): string {
    if (emotion === 'stressed') return 'calming';
    if (emotion === 'confused') return 'explanatory';
    if (hour < 12) return 'energetic';
    if (hour > 20) return 'relaxed';
    return 'professional';
  }

  private determineWorkContext(): string {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    if (dayOfWeek === 0 || dayOfWeek === 6) return 'weekend';
    if (hour < 9 || hour > 17) return 'after-hours';
    return 'working-hours';
  }

  private applyPersonalityStyle(response: string, personality: PersonalityProfile): string {
    const { communicationStyle } = personality;
    
    // Apply tone modifications
    let styledResponse = this.applyTone(response, communicationStyle.tone);
    
    // Adjust verbosity
    styledResponse = this.adjustVerbosity(styledResponse, communicationStyle.verbosity);
    
    // Add personality-specific elements
    if (communicationStyle.humorLevel > 0.7) {
      styledResponse = this.addHumor(styledResponse);
    }

    return styledResponse;
  }

  private applyTone(response: string, tone: string): string {
    // Implementation of tone modification
    return response;
  }

  private adjustVerbosity(response: string, verbosity: number): string {
    // Implementation of verbosity adjustment
    return response;
  }

  private addHumor(response: string): string {
    // Implementation of humor addition
    return response;
  }

  private async determineActions(intent: Intent): Promise<AssistantAction[]> {
    const actions: AssistantAction[] = [];

    if (intent.type === 'task') {
      actions.push({
        type: 'create_task',
        parameters: intent.entities
      });
    }

    if (intent.type === 'workflow') {
      const suggestions = await this.workflowLearner.suggestAutomation();
      actions.push({
        type: 'suggest_automation',
        parameters: { suggestions }
      });
    }

    return actions;
  }

  private learnFromInteraction(
    input: string,
    response: AssistantResponse,
    intent: Intent
  ) {
    this.learningService.recordBehavior({
      type: 'interaction',
      input,
      response: response.text,
      intent,
      timestamp: new Date(),
      context: this.currentContext
    });

    // Update personality based on learning
    const adaptations = this.learningService.suggestAdaptations(this.personality);
    if (adaptations) {
      this.personality.update(adaptations);
    }
  }

  private setupContinuousLearning() {
    // Monitor user patterns and adapt
    setInterval(() => {
      const patterns = this.workflowLearner.suggestAutomation();
      if (patterns.length > 0) {
        this.suggestWorkflowImprovements(patterns);
      }
    }, 3600000); // Check every hour
  }

  private async suggestWorkflowImprovements(patterns: WorkflowPattern[]) {
    const personality = GENIE_ARCHETYPES.WISE_MENTOR;
    const suggestions = patterns.map(pattern => ({
      text: `I noticed you often ${pattern.description}. Would you like me to help automate this?`,
      pattern
    }));

    // Store suggestions for next interaction
    this.currentContext.pendingSuggestions = suggestions;
  }

  private async loadUserContext(): Promise<void> {
    // Implementation for loading user context
  }

  private updateContext(input: string): void {
    this.currentContext.recentInteractions.push(input);
    // Update other context properties
  }

  private async analyzeEmotion(input: string): Promise<string> {
    // Implement emotion analysis
    return 'neutral';
  }

  private calculateConfidence(input: string, pattern: RegExp): number {
    // Implement confidence calculation
    return 0.8;
  }

  private extractEntities(input: string): Array<{ type: string; value: any }> {
    // Implement entity extraction
    return [];
  }

  private async generateSuggestions(intent: Intent): Promise<string[]> {
    // Implement suggestion generation
    return [];
  }

  private getRandomResponse(responses: string[]): string {
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private personalizeResponse(baseResponse: string, context: AssistantContext): string {
    // Implement response personalization
    return baseResponse;
  }
}

interface AssistantContext {
  recentInteractions: string[];
  userState: string;
  timeOfDay: string;
  activeWorkflow: string | null;
  pendingSuggestions?: WorkflowSuggestion[];
}

interface AssistantResponse {
  text: string;
  actions: AssistantAction[];
  suggestions: string[];
  personality: GeniePersonality;
}

interface AssistantAction {
  type: string;
  parameters: any;
}

interface Intent {
  type: IntentType;
  confidence: number;
  entities: any[];
}

type IntentType = 'task' | 'query' | 'emotion' | 'workflow' | 'system' | 'unknown'; 