import OpenAI from 'openai';
import { Agent, AgentAction, ActionStatus } from '../types/agents';
import { agentContext } from './agentContextService';
import { agentCapabilities } from './agentCapabilityService';
import { agentQueue } from './agentQueueService';
import { agentMetrics } from './agentMetricsService';
import { agentRateLimiter } from './agentRateLimiter';
import { agentStateService } from './agentStateService';
import { agentErrorHandler } from './agentErrorHandler';
import { agentValidation } from './agentValidationService';
import { agentTimeout } from './agentTimeoutService';
import { agentEvents } from './agentEventService';
import { agentLogger } from './agentLoggingService';
import { BehaviorSubject } from 'rxjs';
import type { AgentConfig } from '../types/agent';
import { 
  EmailAgent, 
  CalendarAgent, 
  TaskAgent, 
  DocumentAgent,
  AgentCreationService
} from './agents';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for development! In production, use a backend service
});

// Singleton pattern for agent service
export class AgentService {
  private static _instance: AgentService | null = null;
  private agents = new Map<string, EmailAgent | CalendarAgent | TaskAgent | DocumentAgent>();
  private agentCreationService = new AgentCreationService();
  private activeAgents$ = new BehaviorSubject<string[]>([]);

  private constructor() {
    // Initialize from local storage if available
    this.loadAgentsFromStorage();
  }

  public static get instance(): AgentService {
    if (!AgentService._instance) {
      AgentService._instance = new AgentService();
    }
    return AgentService._instance;
  }

  private loadAgentsFromStorage(): void {
    try {
      const storedAgents = localStorage.getItem('agents');
      if (storedAgents) {
        const agentConfigs = JSON.parse(storedAgents) as AgentConfig[];
        agentConfigs.forEach(config => {
          this.createAgentFromConfig(config);
        });
      }
    } catch (error) {
      console.error('Failed to load agents from storage:', error);
    }
  }

  private saveAgentsToStorage(): void {
    try {
      const agentConfigs = Array.from(this.agents.values()).map(agent => agent.getConfig());
      localStorage.setItem('agents', JSON.stringify(agentConfigs));
    } catch (error) {
      console.error('Failed to save agents to storage:', error);
    }
  }

  public getAgent(id: string): EmailAgent | CalendarAgent | TaskAgent | DocumentAgent | undefined {
    return this.agents.get(id);
  }

  public getAllAgents(): Array<EmailAgent | CalendarAgent | TaskAgent | DocumentAgent> {
    return Array.from(this.agents.values());
  }

  public createEmailAgent(name: string, capabilities: string[]): EmailAgent {
    const config: AgentConfig = {
      id: uuidv4(),
      name,
      type: 'assistant',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt: 'You are an intelligent email assistant that helps process and manage emails.',
      capabilities
    };

    const agent = new EmailAgent(config);
    this.agents.set(config.id, agent);
    this.saveAgentsToStorage();
    return agent;
  }

  public createCalendarAgent(name: string, capabilities: string[]): CalendarAgent {
    const config: AgentConfig = {
      id: uuidv4(),
      name,
      type: 'assistant',
      model: 'gpt-3.5-turbo',
      temperature: 0.5,
      maxTokens: 1500,
      systemPrompt: 'You are a calendar management assistant that helps schedule and organize events.',
      capabilities
    };

    const agent = new CalendarAgent(config);
    this.agents.set(config.id, agent);
    this.saveAgentsToStorage();
    return agent;
  }

  public createTaskAgent(name: string, capabilities: string[]): TaskAgent {
    const config: AgentConfig = {
      id: uuidv4(),
      name,
      type: 'assistant',
      model: 'gpt-3.5-turbo',
      temperature: 0.6,
      maxTokens: 1500,
      systemPrompt: 'You are a task management assistant that helps organize and prioritize tasks.',
      capabilities
    };

    const agent = new TaskAgent(config);
    this.agents.set(config.id, agent);
    this.saveAgentsToStorage();
    return agent;
  }

  public createDocumentAgent(name: string, capabilities: string[]): DocumentAgent {
    const config: AgentConfig = {
      id: uuidv4(),
      name,
      type: 'assistant',
      model: 'gpt-4',
      temperature: 0.4,
      maxTokens: 4000,
      systemPrompt: 'You are a document analysis assistant that helps process and analyze documents.',
      capabilities
    };

    const agent = new DocumentAgent(config);
    this.agents.set(config.id, agent);
    this.saveAgentsToStorage();
    return agent;
  }

  private createAgentFromConfig(config: AgentConfig): void {
    let agent;
    switch (config.type) {
      case 'assistant':
        // Determine the agent type based on capabilities
        if (config.capabilities.includes('email-processing')) {
          agent = new EmailAgent(config);
        } else if (config.capabilities.includes('calendar-management')) {
          agent = new CalendarAgent(config);
        } else if (config.capabilities.includes('task-management')) {
          agent = new TaskAgent(config);
        } else if (config.capabilities.includes('document-analysis')) {
          agent = new DocumentAgent(config);
        }
        break;
      default:
        console.warn(`Unknown agent type: ${config.type}`);
        return;
    }

    if (agent) {
      this.agents.set(config.id, agent);
    }
  }

  public removeAgent(id: string): boolean {
    const result = this.agents.delete(id);
    if (result) {
      this.saveAgentsToStorage();
      // Update active agents
      const activeAgents = this.activeAgents$.value.filter(agentId => agentId !== id);
      this.activeAgents$.next(activeAgents);
    }
    return result;
  }

  public getActiveAgents(): string[] {
    return this.activeAgents$.value;
  }

  public activateAgent(id: string): void {
    if (this.agents.has(id) && !this.activeAgents$.value.includes(id)) {
      const activeAgents = [...this.activeAgents$.value, id];
      this.activeAgents$.next(activeAgents);
    }
  }

  public deactivateAgent(id: string): void {
    const activeAgents = this.activeAgents$.value.filter(agentId => agentId !== id);
    this.activeAgents$.next(activeAgents);
  }

  public getAgentMetrics(id: string): any {
    const agent = this.agents.get(id);
    if (!agent) return null;
    return agent.getMetrics();
  }

  async initializeAgent(agent: Agent) {
    agentContext.initializeContext(agent);
    await this.validateAgent(agent);
    return agent;
  }

  private async validateAgent(agent: Agent) {
    // Validate agent configuration and capabilities
    for (const capability of agent.capabilities) {
      if (!agentCapabilities.hasCapability(capability)) {
        throw new Error(`Invalid capability: ${capability}`);
      }
    }
  }

  private async validateAndPrepare(agent: Agent, action: AgentAction) {
    // Check rate limits
    if (!agentRateLimiter.canProcess(agent.id)) {
      throw new Error('Rate limit exceeded');
    }

    // Validate capabilities
    const invalidCapabilities = agentCapabilities.validateCapabilities(agent.capabilities);
    if (invalidCapabilities.length > 0) {
      throw new Error(`Invalid capabilities: ${invalidCapabilities.join(', ')}`);
    }

    // Record request
    agentRateLimiter.recordRequest(agent.id);
  }

  async executeAction(agent: Agent, action: AgentAction): Promise<any> {
    try {
      // Validate and prepare
      await this.validateAndPrepare(agent, action);
      
      // Log action start
      agentLogger.log('info', 'Execute Action', agent.id, {
        action,
        capabilities: agent.capabilities
      });

      // Execute with timeout
      const result = await agentTimeout.withTimeout(
        async () => {
          const guidance = await this.getAIGuidance(agent, action);
          return agentCapabilities.executeCapability(
            agent,
            action.type,
            { ...action.input, guidance }
          );
        },
        { timeout: 60000 }
      );

      // Log success
      agentLogger.log('info', 'Action Success', agent.id, {
        action,
        result
      });

      return result;
    } catch (error) {
      // Log error
      agentLogger.log('error', 'Action Failed', agent.id, {
        action,
        error: error.message
      });

      if (error instanceof AgentError) {
        await agentErrorHandler.handleError(error);
      }
      throw error;
    }
  }

  private async getAIGuidance(agent: Agent, action: AgentAction) {
    const response = await openai.chat.completions.create({
      model: agent.config.modelName || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant with capabilities: ${agent.capabilities.join(', ')}. 
                   Autonomy level: ${agent.autonomyLevel}
                   Current task: ${action.type}`
        },
        {
          role: 'user',
          content: `Provide guidance for handling this input: ${JSON.stringify(action.input)}`
        }
      ],
      temperature: agent.config.temperature || 0.7,
    });

    return response.choices[0].message.content;
  }

  async queueAction(agent: Agent, action: AgentAction, priority = 1) {
    return agentQueue.addToQueue(agent, action, priority);
  }

  private async loadAgentState(agent: Agent) {
    const state = await agentStateService.loadState(agent.id);
    if (state) {
      agentContext.initializeContext(agent);
      for (const [key, value] of Object.entries(state.memory)) {
        agentContext.updateMemory(agent.id, key, value);
      }
    }
  }

  private async saveAgentState(agent: Agent) {
    const context = agentContext.getContext(agent.id);
    if (context) {
      const memoryObject = Object.fromEntries(context.memory);
      await agentStateService.saveState(agent.id, {
        agent,
        memory: memoryObject
      });
    }
  }

  async updateAgentStatus(agentId: string, status: string) {
    const agent = await this.getAgent(agentId);
    if (agent) {
      agent.status = status;
      agentEvents.emit({ type: 'status:changed', agentId, status });
      await this.saveAgentState(agent);
    }
  }

  async performAction(agent: any, action: any) {
    try {
      // For development, we'll use a mock response
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            output: `Simulated action ${action.type} completed successfully`
          });
        }, 1000);
      });
    } catch (error) {
      console.error('Error performing action:', error);
      throw error;
    }
  }

  async trainAgent(agent: any) {
    try {
      // For development, we'll use a mock training process
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'Training completed successfully'
          });
        }, 2000);
      });
    } catch (error) {
      console.error('Error training agent:', error);
      throw error;
    }
  }
}

// Export the singleton instance
export const agentService = AgentService.instance; 