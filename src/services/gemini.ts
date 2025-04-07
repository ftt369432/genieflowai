import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIService, AIService } from './ai/baseAIService';
import { Task } from '../types/task';
import { Event } from '../types/calendar';
import { aiConfig } from './aiConfig';
import type { AIModel } from '../types/ai';

interface ConversationTurn {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

interface ConversationState {
  history: ConversationTurn[];
  variables: Record<string, any>;
  maxHistoryLength: number;
}

interface PromptTemplate {
  systemRole: string;
  instructions: string[];
  format?: string;
  sourceRequirements?: {
    includeSources: boolean;
    sourceTypes?: string[];
  };
}

interface FollowUpQuestion {
  question: string;
  context: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface ScheduleAnalysisResult {
  conflicts: string[];
  followUpQuestions: FollowUpQuestion[];
}

interface Source {
  type: string;
  reference: string;
  relevance: number;
  confidence: number;
}

interface ResponseWithSources<T> {
  data: T;
  sources: Source[];
}

export class GeminiService extends BaseAIService implements AIService {
  private model: AIModel;
  private genAI: GoogleGenerativeAI | null = null;
  private apiKey: string;
  private providerId = 'google';
  private conversationState: ConversationState;
  private promptTemplates: Record<string, PromptTemplate>;

  constructor() {
    super('google');
    try {
      this.apiKey = aiConfig.getApiKey(this.providerId);
      this.model = {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        provider: 'google',
        capabilities: ['chat', 'text-generation'],
        contextSize: 32000
      };
      
      if (this.apiKey) {
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        console.log('GeminiService initialized successfully');
      } else {
        console.error('Failed to initialize GeminiService: No API key found');
      }
    } catch (error) {
      console.error('Error initializing GeminiService:', error);
      this.apiKey = '';
    }
    this.conversationState = {
      history: [],
      variables: {},
      maxHistoryLength: 10 // Adjust based on token limits
    };
    
    // Initialize prompt templates with source requirements
    this.promptTemplates = {
      taskEnhancement: {
        systemRole: "You are an expert task management assistant. Your role is to enhance and optimize tasks for better clarity and execution.",
        instructions: [
          "Analyze the task description and requirements",
          "Identify key components and dependencies",
          "Suggest improvements for clarity and efficiency",
          "Provide specific, actionable recommendations"
        ],
        format: "JSON",
        sourceRequirements: {
          includeSources: true,
          sourceTypes: [
            "task_management_best_practices",
            "project_management_methodologies",
            "agile_frameworks",
            "productivity_techniques",
            "industry_standards"
          ]
        }
      },
      scheduleOptimization: {
        systemRole: "You are a scheduling optimization expert. Your role is to analyze and optimize task schedules for maximum efficiency.",
        instructions: [
          "Review all tasks and their constraints",
          "Identify potential conflicts and dependencies",
          "Consider priority levels and deadlines",
          "Propose an optimized schedule"
        ],
        format: "JSON",
        sourceRequirements: {
          includeSources: true,
          sourceTypes: [
            "scheduling_algorithms",
            "time_management_theories",
            "resource_allocation_methods",
            "workflow_optimization_techniques",
            "project_planning_methodologies"
          ]
        }
      },
      conflictAnalysis: {
        systemRole: "You are a scheduling conflict resolution expert. Your role is to identify and resolve scheduling conflicts.",
        instructions: [
          "Review all events and their timing",
          "Identify overlapping or conflicting events",
          "Consider participant availability",
          "Propose specific resolution strategies"
        ],
        format: "JSON",
        sourceRequirements: {
          includeSources: true,
          sourceTypes: [
            "conflict_resolution_methods",
            "calendar_management_best_practices",
            "meeting_scheduling_guidelines",
            "time_zone_management_strategies",
            "resource_coordination_techniques"
          ]
        }
      },
      durationEstimation: {
        systemRole: "You are an expert at task duration estimation. Your role is to provide accurate time estimates based on task complexity and requirements.",
        instructions: [
          "Analyze the task description for complexity factors",
          "Consider similar tasks and their durations",
          "Account for potential challenges or dependencies",
          "Provide a realistic time estimate in minutes"
        ],
        format: "JSON",
        sourceRequirements: {
          includeSources: true,
          sourceTypes: [
            "estimation_methods",
            "project_planning_techniques",
            "historical_data_analysis",
            "complexity_assessment_frameworks",
            "risk_assessment_methodologies"
          ]
        }
      },
      eventScheduling: {
        systemRole: "You are an expert at event scheduling and time management. Your role is to suggest optimal meeting times based on various factors.",
        instructions: [
          "Analyze event requirements and constraints",
          "Consider typical working hours and time zones",
          "Account for participant availability patterns",
          "Suggest multiple optimal time slots"
        ],
        format: "JSON",
        sourceRequirements: {
          includeSources: true,
          sourceTypes: [
            "meeting_scheduling_best_practices",
            "time_zone_management",
            "calendar_optimization_techniques",
            "participant_availability_patterns",
            "meeting_efficiency_guidelines"
          ]
        }
      }
    };
  }

  private async generateFollowUpQuestions(context: string, difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'): Promise<FollowUpQuestion[]> {
    const prompt = `Based on this context: "${context}"
Generate 3 follow-up questions that will help deepen understanding. 
Difficulty level: ${difficulty}
Format the response as a JSON array of objects with properties: question, context, difficulty
Each question should build upon the previous knowledge and encourage exploration.`;

    try {
      const result = await this.getCompletion(prompt);
      return JSON.parse(result);
    } catch (error) {
      console.error('Error generating follow-up questions:', error);
      return [];
    }
  }

  private calculateSourceRelevance(source: Source, context: string): number {
    // Calculate semantic similarity between source reference and context
    const sourceWords = source.reference.toLowerCase().split(/\s+/);
    const contextWords = context.toLowerCase().split(/\s+/);
    
    // Count matching words
    const matchingWords = sourceWords.filter(word => contextWords.includes(word));
    const wordSimilarity = matchingWords.length / Math.max(sourceWords.length, contextWords.length);
    
    // Consider source type relevance
    const typeRelevance = this.promptTemplates[Object.keys(this.promptTemplates)[0]]
      .sourceRequirements?.sourceTypes?.includes(source.type) ? 1 : 0.5;
    
    // Combine factors with weights
    return (wordSimilarity * 0.7 + typeRelevance * 0.3);
  }

  private filterSources(sources: Source[], context: string, minRelevance: number = 0.3): Source[] {
    return sources
      .map(source => ({
        ...source,
        relevance: this.calculateSourceRelevance(source, context)
      }))
      .filter(source => source.relevance >= minRelevance)
      .sort((a, b) => b.relevance - a.relevance);
  }

  private buildPrompt(template: PromptTemplate, context: string): string {
    const { systemRole, instructions, format, sourceRequirements } = template;
    
    let prompt = `${systemRole}\n\n`;
    prompt += "Instructions:\n";
    instructions.forEach((instruction, index) => {
      prompt += `${index + 1}. ${instruction}\n`;
    });
    
    if (format) {
      prompt += `\nPlease provide your response in ${format} format.\n`;
    }

    if (sourceRequirements?.includeSources) {
      prompt += `\nPlease include sources for your recommendations. For each source, provide:
1. Type of source (${sourceRequirements.sourceTypes?.join(', ')})
2. Reference or citation
3. Relevance to the current context (0-1)
4. Confidence level (0-1)

Format sources as a "sources" array in the JSON response. Each source should be highly relevant to the specific recommendation or insight provided.`;
    }
    
    prompt += `\nContext:\n${context}\n\n`;
    prompt += "Let's solve this step by step:\n";
    
    return prompt;
  }

  private addToHistory(role: 'user' | 'model', content: string): void {
    this.conversationState.history.push({
      role,
      content,
      timestamp: new Date()
    });

    // Maintain history length
    if (this.conversationState.history.length > this.conversationState.maxHistoryLength) {
      this.conversationState.history.shift();
    }
  }

  private getFormattedHistory(): string {
    return this.conversationState.history
      .map(turn => `${turn.role}: ${turn.content}`)
      .join('\n');
  }

  private extractVariables(content: string): void {
    // Enhanced variable extraction patterns
    const patterns = {
      // Task-related variables
      taskVariables: {
        pattern: /\[(task|title|description|priority|duration|deadline):(.*?)\]/g,
        category: 'task'
      },
      // Event-related variables
      eventVariables: {
        pattern: /\[(event|meeting|appointment|time|location|participant):(.*?)\]/g,
        category: 'event'
      },
      // Time-related variables
      timeVariables: {
        pattern: /\[(date|time|duration|deadline|start|end):(.*?)\]/g,
        category: 'time'
      },
      // Priority-related variables
      priorityVariables: {
        pattern: /\[(priority|importance|urgency):(.*?)\]/g,
        category: 'priority'
      }
    };

    // Extract variables using each pattern
    Object.entries(patterns).forEach(([key, { pattern, category }]) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const [_, type, value] = match.match(/\[(.*?):(.*?)\]/) || [];
          if (type && value) {
            const variableKey = `${category}_${type}_${value}`;
            if (!this.conversationState.variables[variableKey]) {
              this.conversationState.variables[variableKey] = {
                value,
                type,
                category,
                timestamp: new Date(),
                context: content.slice(Math.max(0, content.indexOf(match) - 50), 
                                    Math.min(content.length, content.indexOf(match) + 50))
              };
            }
          }
        });
      }
    });

    // Extract named entities (dates, times, locations)
    const namedEntityPatterns = {
      dates: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/g,
      times: /\b\d{1,2}:\d{2}(?:\s*[AaPp][Mm])?\b/g,
      locations: /\b(?:at|in|on|from|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g
    };

    Object.entries(namedEntityPatterns).forEach(([type, pattern]) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const variableKey = `${type}_${match}`;
          if (!this.conversationState.variables[variableKey]) {
            this.conversationState.variables[variableKey] = {
              value: match,
              type,
              timestamp: new Date(),
              context: content.slice(Math.max(0, content.indexOf(match) - 50), 
                                  Math.min(content.length, content.indexOf(match) + 50))
            };
          }
        });
      }
    });
  }

  async sendMessage(content: string, model: string = 'gemini-pro'): Promise<string> {
    try {
      console.log(`Sending message to Gemini model: ${model}`);
      
      // Add user message to history
      this.addToHistory('user', content);
      
      // Extract variables from user input
      this.extractVariables(content);

      const geminiModel = this.genAI?.getGenerativeModel({ 
        model: model || 'gemini-pro'
      });
      
      // Format prompt with conversation history
      const prompt = `Previous conversation:\n${this.getFormattedHistory()}\n\nCurrent message: ${content}`;
      
      const result = await geminiModel?.generateContent(prompt);
      const response = await result?.response;
      const responseText = response?.text();

      // Add model response to history
      this.addToHistory('model', responseText);
      
      return responseText;
    } catch (error) {
      console.error('Error in Gemini sendMessage:', error);
      if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
      }
      throw new Error('Unknown Gemini API Error');
    }
  }

  async getCompletion(prompt: string, options?: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
  }): Promise<string> {
    try {
      const model = this.genAI?.getGenerativeModel({ 
        model: options?.model || 'gemini-pro',
        generationConfig: {
          maxOutputTokens: options?.maxTokens,
          temperature: options?.temperature || 0.7,
        }
      });
      const result = await model?.generateContent(prompt);
      const response = await result?.response;
      return response?.text();
    } catch (error) {
      return this.handleError(error, 'Gemini');
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    try {
      const model = this.genAI?.getGenerativeModel({ model: 'embedding-001' });
      const result = await model?.embedContent(text);
      return Array.from(result?.embedding.values || []);
    } catch (error) {
      return this.handleError(error, 'Gemini Embedding');
    }
  }

  async enhanceTask(task: Task): Promise<ResponseWithSources<Task>> {
    const context = `Task: ${task.title}\nDescription: ${task.description}\nPriority: ${task.priority}\nDue Date: ${task.dueDate}`;
    const prompt = this.buildPrompt(this.promptTemplates.taskEnhancement, context);
    
    try {
      const result = await this.getCompletion(prompt);
      const response = JSON.parse(result);
      
      // Generate follow-up questions for task enhancement
      const followUpQuestions = await this.generateFollowUpQuestions(
        `Task enhancement for: ${task.title}`,
        'intermediate'
      );
      
      // Filter and sort sources by relevance
      const filteredSources = this.filterSources(response.sources || [], context);
      
      return {
        data: {
        ...task,
          ...response.data,
          followUpQuestions
        },
        sources: filteredSources
      };
    } catch (error) {
      console.error('Error enhancing task:', error);
      return {
        data: task,
        sources: []
      };
    }
  }

  async estimateTaskDuration(description: string): Promise<ResponseWithSources<number>> {
    const context = `Task Description: ${description}`;
    const prompt = this.buildPrompt(this.promptTemplates.durationEstimation, context);
    
    try {
      const result = await this.getCompletion(prompt);
      const response = JSON.parse(result);
      
      // Generate follow-up questions about duration estimation
      const followUpQuestions = await this.generateFollowUpQuestions(
        `Duration estimation for: ${description}`,
        'beginner'
      );
      
      // Store follow-up questions in conversation state for later use
      this.conversationState.variables[`duration_questions_${description}`] = followUpQuestions;
      
      return {
        data: response.data?.duration || 60,
        sources: response.sources || []
      };
    } catch (error) {
      console.error('Error estimating duration:', error);
      return {
        data: 60,
        sources: []
      };
    }
  }

  async optimizeTaskSchedule(tasks: Task[]): Promise<ResponseWithSources<Task[]>> {
    const context = JSON.stringify(tasks.map(t => ({
      title: t.title,
      duration: t.estimatedDuration,
      priority: t.priority,
      deadline: t.dueDate
    })));
    
    const prompt = this.buildPrompt(this.promptTemplates.scheduleOptimization, context);
    
    try {
      const result = await this.getCompletion(prompt);
      const response = JSON.parse(result);
      
      // Generate follow-up questions for schedule optimization
      const followUpQuestions = await this.generateFollowUpQuestions(
        `Schedule optimization for ${tasks.length} tasks`,
        'advanced'
      );
      
      return {
        data: tasks.map(task => ({
        ...task,
          ...response.data.find((t: any) => t.title === task.title),
          followUpQuestions: followUpQuestions.filter(q => 
            q.context.toLowerCase().includes(task.title.toLowerCase())
          )
        })),
        sources: response.sources || []
      };
    } catch (error) {
      console.error('Error optimizing schedule:', error);
      return {
        data: tasks,
        sources: []
      };
    }
  }

  async suggestEventTimes(event: Partial<Event>): Promise<ResponseWithSources<Date[]>> {
    const context = JSON.stringify(event);
    const prompt = this.buildPrompt(this.promptTemplates.eventScheduling, context);
    
    try {
      const result = await this.getCompletion(prompt);
      const response = JSON.parse(result);
      
      // Generate follow-up questions about event scheduling
      const followUpQuestions = await this.generateFollowUpQuestions(
        `Event scheduling for: ${event.title || 'Untitled Event'}`,
        'intermediate'
      );
      
      // Store follow-up questions in conversation state for later use
      this.conversationState.variables[`scheduling_questions_${event.title || 'untitled'}`] = followUpQuestions;
      
      return {
        data: response.data.times.map((dateStr: string) => new Date(dateStr)),
        sources: response.sources || []
      };
    } catch (error) {
      console.error('Error suggesting event times:', error);
      return {
        data: [],
        sources: []
      };
    }
  }

  async analyzeScheduleConflicts(events: Event[]): Promise<ResponseWithSources<ScheduleAnalysisResult>> {
    const context = JSON.stringify(events);
    const prompt = this.buildPrompt(this.promptTemplates.conflictAnalysis, context);
    
    try {
      const result = await this.getCompletion(prompt);
      const response = JSON.parse(result);
      
      // Generate follow-up questions for conflict analysis
      const followUpQuestions = await this.generateFollowUpQuestions(
        `Schedule conflict analysis for ${events.length} events`,
        'intermediate'
      );
      
      return {
        data: {
          conflicts: response.data.conflicts || [],
          followUpQuestions
        },
        sources: response.sources || []
      };
    } catch (error) {
      console.error('Error analyzing conflicts:', error);
      return {
        data: {
          conflicts: [],
          followUpQuestions: []
        },
        sources: []
      };
    }
  }

  async testConnection(): Promise<string> {
    try {
      const model = this.genAI?.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model?.generateContent('Test connection');
      const response = await result?.response;
      return response?.text();
    } catch (error) {
      return this.handleError(error, 'Gemini');
    }
  }

  getFollowUpQuestions(context: string): FollowUpQuestion[] {
    const key = Object.keys(this.conversationState.variables).find(k => 
      k.startsWith('duration_questions_') || 
      k.startsWith('scheduling_questions_') ||
      k.includes(context)
    );
    return key ? this.conversationState.variables[key] : [];
  }

  getExtractedVariables(category?: string): Record<string, any> {
    if (category) {
      return Object.entries(this.conversationState.variables)
        .filter(([key, value]) => 
          typeof value === 'object' && 
          'category' in value && 
          value.category === category
        )
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    }
    return this.conversationState.variables;
  }

  clearContext(): void {
    this.conversationState = {
      history: [],
      variables: {},
      maxHistoryLength: 10
    };
  }

  // Add new methods for source management
  getRelevantSources(context: string, minRelevance: number = 0.3): Source[] {
    const allSources = this.conversationState.variables.sources || [];
    return this.filterSources(allSources, context, minRelevance);
  }

  getSourcesByType(type: string): Source[] {
    const allSources = this.conversationState.variables.sources || [];
    return allSources.filter(source => source.type === type);
  }

  getSourcesByConfidence(minConfidence: number = 0.7): Source[] {
    const allSources = this.conversationState.variables.sources || [];
    return allSources.filter(source => source.confidence >= minConfidence);
  }
}

export const geminiService = new GeminiService(); 