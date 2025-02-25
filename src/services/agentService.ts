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

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for development! In production, use a backend service
});

class AgentService {
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

  getAgentMetrics(agentId: string) {
    return agentMetrics.getAgentMetrics(agentId);
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

export const agentService = new AgentService(); 