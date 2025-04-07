import { ActionMetrics } from '../../types/workflow';
import { BehaviorSubject } from 'rxjs';
import { ActionResult } from '../../types/actions';
import { getEnv } from '../../config/env';
import { geminiService } from '../gemini';
import { v4 as uuidv4 } from 'uuid';
import { useAuditStore } from '../../store/auditStore';

/**
 * Configuration for an agent
 */
export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  type: string;
  version: string;
  created: Date;
  lastModified: Date;
  status: 'active' | 'inactive' | 'training';
  preferences: Record<string, any>;
}

/**
 * Action to be performed by an agent
 */
export interface AgentAction {
  type: string;
  params: Record<string, any>;
  priority?: number;
  callbackId?: string;
}

/**
 * Result of an action performed by an agent
 */
export interface AgentActionResult {
  success: boolean;
  data?: any;
  error?: string;
  action: AgentAction;
  timestamp: Date;
  message: string;
  pendingAuditId?: string;
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected ai = geminiService;
  protected context: Record<string, any> = {};
  protected metrics$ = new BehaviorSubject<ActionMetrics[]>([]);
  protected isExecuting$ = new BehaviorSubject<boolean>(false);
  protected id: string;
  protected name: string;
  protected description: string;
  protected capabilities: string[];
  protected type: string;
  protected version: string;
  protected created: Date;
  protected lastModified: Date;
  protected status: 'active' | 'inactive' | 'training';
  protected preferences: Record<string, any>;
  protected actionLogs: any[] = [];
  protected requireConfirmation: boolean = false;

  constructor(config?: Partial<AgentConfig>) {
    // Ensure config is initialized with default values if it's undefined
    const defaultConfig: AgentConfig = {
      id: `agent-${uuidv4()}`,
      name: 'Generic Agent',
      description: 'A default agent',
      capabilities: [],
      type: 'default',
      version: '1.0',
      created: new Date(),
      lastModified: new Date(),
      status: 'active' as const,
      preferences: {}
    };
    
    // Merge provided config with defaults
    this.config = config ? { ...defaultConfig, ...config } : defaultConfig;
    
    // Ensure all required properties exist
    this.id = this.config.id;
    this.name = this.config.name;
    this.description = this.config.description;
    this.capabilities = this.config.capabilities;
    this.type = this.config.type;
    this.version = this.config.version;
    this.created = this.config.created;
    this.lastModified = this.config.lastModified;
    this.status = this.config.status;
    this.preferences = this.config.preferences;
  }

  public async executeAction(action: AgentAction): Promise<AgentActionResult> {
    this.logActionStart(action);

    // Get audit store state
    const addAuditLog = useAuditStore.getState().addAuditLog;
    
    // Log the start of the action
    const auditId = addAuditLog({
      actionType: action.type,
      sourceType: this.type,
      sourceId: this.id,
      timestamp: new Date(),
      description: `${this.name} executing ${action.type}`,
      status: this.requireConfirmation ? 'pending' : 'auto_approved',
      details: {
        params: action.params,
        agentType: this.type
      }
    });
    
    // If confirmation is required and not auto-approved
    if (this.requireConfirmation) {
      // Return early, with indication that action is pending
      const pendingResult: AgentActionResult = {
        success: false,
        action,
        data: null,
        timestamp: new Date(),
        message: 'Action requires approval',
        pendingAuditId: auditId
      };
      
      this.logActionComplete(pendingResult);
      return pendingResult;
    }

    try {
      const result = await this.performAction(action);
      
      const completedAuditLog = useAuditStore.getState();
      completedAuditLog.markActionCompleted(auditId, {
        success: true,
        data: result
      });
      
      const successResult: AgentActionResult = {
        success: true,
        action,
        data: result,
        timestamp: new Date(),
        message: `Successfully executed ${action.type}`
      };
      
      this.logActionComplete(successResult);
      return successResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      const completedAuditLog = useAuditStore.getState();
      completedAuditLog.markActionCompleted(auditId, {
        success: false,
        error: errorMessage
      });
      
      const errorResult: AgentActionResult = {
        success: false,
        action,
        data: null,
        error: errorMessage,
        timestamp: new Date(),
        message: errorMessage
      };
      
      this.logActionError(errorResult);
      return errorResult;
    }
  }

  public abstract train(data: any[]): Promise<void>;

  protected async executeWithMetrics<T>(
    action: string,
    executor: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    this.isExecuting$.next(true);
    
    try {
      const result = await executor();
      const endTime = Date.now();
      
      this.recordMetrics({
        action,
        duration: endTime - startTime,
        success: true,
        timestamp: new Date(),
        agentId: this.id
      });
      
      return result;
    } catch (error) {
      const endTime = Date.now();
      
      this.recordMetrics({
        action,
        duration: endTime - startTime,
        success: false,
        timestamp: new Date(),
        agentId: this.id,
        error: this.formatError(error)
      });
      
      throw error;
    } finally {
      this.isExecuting$.next(false);
    }
  }
  
  protected recordMetrics(metrics: ActionMetrics): void {
    const currentMetrics = this.metrics$.value;
    this.metrics$.next([...currentMetrics, metrics]);
  }
  
  public getMetrics(): ActionMetrics[] {
    return this.metrics$.value;
  }
  
  public isExecuting(): boolean {
    return this.isExecuting$.value;
  }
  
  protected validateAction(action: string): void {
    if (!this.hasCapability(action)) {
      throw new Error(`Agent does not have the capability to perform action: ${action}`);
    }
  }
  
  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let attempt = 0;
    
    while (true) {
      try {
        return await operation();
      } catch (error) {
        attempt++;
        
        if (attempt >= maxRetries) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Retry attempt ${attempt} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  public getConfig(): AgentConfig {
    return { ...this.config };
  }
  
  protected async getCompletion(prompt: string, context: Record<string, any> = {}): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);
    const env = getEnv();
    
    // Call the Gemini service with the proper parameters
    try {
      const completion = await this.ai.getCompletion(
        `${systemPrompt}\n\n${prompt}`,
        {
          model: "gemini-pro", // Use Gemini model
          maxTokens: 1000, // Default max tokens
          temperature: 0.7
        }
      );
      
      return completion;
    } catch (error) {
      console.error('Error getting completion:', error);
      throw error;
    }
  }
  
  protected buildSystemPrompt(context: Record<string, any> = {}): string {
    const basePrompt = `You are ${this.name}, an AI agent designed to ${this.description}.
You have the following capabilities: ${this.capabilities.join(', ')}.
Always respond in a helpful, concise, and accurate manner.
`;
    
    // Add context if available
    const contextPrompt = Object.entries(context)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    
    return contextPrompt ? `${basePrompt}\n\nContext:\n${contextPrompt}` : basePrompt;
  }
  
  protected validateResult(result: any): boolean {
    // Base implementation - can be overridden by derived classes
    return result !== null && result !== undefined;
  }
  
  protected formatError(error: any): string {
    return error instanceof Error ? error.message : String(error);
  }
  
  protected validateCapability(capability: string) {
    if (!this.hasCapability(capability)) {
      throw new Error(`Agent does not have the capability: ${capability}`);
    }
  }
  
  protected async logAction(action: string, result: any) {
    // Implement action logging
    console.log(`[${this.id}] Action: ${action}, Result:`, result);
  }

  /**
   * Get the agent's ID
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Get the agent's name
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Get the agent's description
   */
  public getDescription(): string {
    return this.description;
  }

  /**
   * Get the agent's capabilities
   */
  public getCapabilities(): string[] {
    return [...this.capabilities];
  }

  /**
   * Check if the agent has a specific capability
   */
  public hasCapability(capability: string): boolean {
    return this.capabilities.includes(capability);
  }

  /**
   * Update the agent's configuration
   */
  public updateConfig(config: Partial<AgentConfig>): void {
    if (config.name) this.name = config.name;
    if (config.description) this.description = config.description;
    if (config.capabilities) this.capabilities = [...config.capabilities];
    if (config.version) this.version = config.version;
    if (config.status) this.status = config.status;
    if (config.preferences) this.preferences = { ...config.preferences };
    
    this.lastModified = new Date();
  }

  /**
   * Log the start of an action
   */
  protected logActionStart(action: AgentAction): void {
    const logEntry = {
      type: 'action_start',
      action,
      timestamp: new Date(),
      agentId: this.id
    };
    
    this.actionLogs.push(logEntry);
    console.log(`[${this.name}] Starting action: ${action.type}`, action.params);
  }

  /**
   * Log the successful completion of an action
   */
  protected logActionComplete(result: AgentActionResult): void {
    const logEntry = {
      type: 'action_complete',
      result,
      timestamp: new Date(),
      agentId: this.id
    };
    
    this.actionLogs.push(logEntry);
    console.log(`[${this.name}] Completed action: ${result.action.type}`, result.success ? 'SUCCESS' : 'FAILURE');
  }

  /**
   * Log an error that occurred during an action
   */
  protected logActionError(result: AgentActionResult): void {
    const logEntry = {
      type: 'action_error',
      result,
      timestamp: new Date(),
      agentId: this.id
    };
    
    this.actionLogs.push(logEntry);
    console.error(`[${this.name}] Error in action: ${result.action.type}`, result.error);
  }

  /**
   * Get the recent action logs
   */
  public getActionLogs(limit = 10): any[] {
    return this.actionLogs.slice(-limit);
  }

  /**
   * Performs the actual action implementation
   * This is meant to be implemented by subclasses
   */
  protected abstract performAction(action: AgentAction): Promise<any>;
}

// Similar implementations for DocumentAgent, CalendarAgent, etc. 