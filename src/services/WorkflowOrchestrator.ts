import { WorkflowLearner } from './WorkflowLearner';
import { VoiceControl } from './VoiceControl';
import { AgentCreationService } from './AgentCreationService';
import type { UserAction, WorkflowPattern, AgentConfig, AgentSuggestion } from '../types/workflow';
import { BehaviorSubject, Observable } from 'rxjs';
import { EmailAgent, CalendarAgent, DocumentAgent, TaskAgent } from './agents';

export class WorkflowOrchestrator {
  private workflowLearner: WorkflowLearner;
  private voiceControl: VoiceControl;
  private agentCreationService: AgentCreationService;
  private emailAgent: EmailAgent;
  private calendarAgent: CalendarAgent;
  private documentAgent: DocumentAgent;
  private taskAgent: TaskAgent;
  
  private patterns$ = new BehaviorSubject<WorkflowPattern[]>([]);
  private activeAgents$ = new BehaviorSubject<AgentConfig[]>([]);
  private agentExecutions$ = new BehaviorSubject<Record<string, boolean>>({});
  private agentResults$ = new BehaviorSubject<Record<string, any[]>>({});
  public suggestions$ = new BehaviorSubject<AgentSuggestion[]>([]);

  constructor() {
    this.workflowLearner = new WorkflowLearner();
    this.voiceControl = new VoiceControl();
    this.agentCreationService = new AgentCreationService();
    
    // Initialize specialized agents
    this.emailAgent = new EmailAgent();
    this.calendarAgent = new CalendarAgent();
    this.documentAgent = new DocumentAgent();
    this.taskAgent = new TaskAgent();

    this.setupVoiceCommands();
    this.initializePatternSubscription();
  }

  private initializePatternSubscription(): void {
    this.workflowLearner.patterns$.subscribe(patterns => {
      this.patterns$.next(patterns);
      this.updateSuggestions();
    });
  }

  private updateSuggestions(): void {
    const suggestions = this.workflowLearner.suggestAutomations();
    this.suggestions$.next(suggestions);
  }

  private setupVoiceCommands() {
    this.voiceControl.registerCommand('analyze workflow', () => {
      this.analyzeWorkflow();
    });

    this.voiceControl.registerCommand('create agent from pattern', (params) => {
      const patternId = params.patternId;
      const pattern = this.patterns$.value.find(p => p.id === patternId);
      if (pattern) {
        this.createAgentFromPattern(pattern);
      }
    });

    this.voiceControl.registerCommand('show patterns', () => {
      const patterns = this.patterns$.value;
      if (patterns.length === 0) {
        this.voiceControl.speak('No workflow patterns detected yet');
      } else {
        this.voiceControl.speak(`Found ${patterns.length} workflow patterns`);
        // Trigger pattern visualization
      }
    });
  }

  public recordAction(action: UserAction) {
    this.workflowLearner.recordAction(action);
    this.updatePatterns();
  }

  private updatePatterns() {
    const suggestions = this.workflowLearner.suggestAutomation();
    if (suggestions.length > 0) {
      this.voiceControl.speak(`Found ${suggestions.length} new automation opportunities`);
    }
    this.patterns$.next(this.workflowLearner.getPatterns());
  }

  private async createAgentFromPattern(pattern: WorkflowPattern) {
    try {
      const agentConfig = this.agentCreationService.createAgentFromPattern(pattern);
      const currentAgents = this.activeAgents$.value;
      this.activeAgents$.next([...currentAgents, agentConfig]);
      
      this.voiceControl.speak(`Created new agent: ${agentConfig.name}`);
      return agentConfig;
    } catch (error) {
      console.error('Failed to create agent:', error);
      this.voiceControl.speak('Sorry, I encountered an error creating the agent');
      return null;
    }
  }

  public getPatterns(): Observable<WorkflowPattern[]> {
    return this.patterns$.asObservable();
  }

  public getActiveAgents(): Observable<AgentConfig[]> {
    return this.activeAgents$.asObservable();
  }

  public startVoiceControl() {
    this.voiceControl.startListening();
  }

  public stopVoiceControl() {
    this.voiceControl.stopListening();
  }

  private analyzeWorkflow() {
    this.voiceControl.speak('Analyzing your workflow patterns');
    // Trigger comprehensive workflow analysis
    this.workflowLearner.analyzePatterns();
    this.updatePatterns();
  }

  public async executeAgentAction(agentId: string, action: string, params: any = {}) {
    try {
      this.agentExecutions$.next({
        ...this.agentExecutions$.value,
        [agentId]: true
      });

      const agent = this.activeAgents$.value.find(a => a.id === agentId);
      if (!agent) throw new Error('Agent not found');

      // Execute action based on agent type and capabilities
      const result = await this.executeAction(agent, action, params);
      
      // Store result
      const currentResults = this.agentResults$.value[agentId] || [];
      this.agentResults$.next({
        ...this.agentResults$.value,
        [agentId]: [...currentResults, { action, result, timestamp: new Date() }]
      });

      // Provide voice feedback
      this.voiceControl.speak(`${agent.name} completed ${action}`);

      return result;
    } catch (error) {
      console.error(`Agent execution error:`, error);
      this.voiceControl.speak(`Error executing ${action}`);
      throw error;
    } finally {
      this.agentExecutions$.next({
        ...this.agentExecutions$.value,
        [agentId]: false
      });
    }
  }

  private async executeAction(agent: AgentConfig, action: string, params: any) {
    switch (action) {
      case 'analyze-email':
        return this.executeEmailAnalysis(agent, params);
      case 'schedule-meeting':
        return this.scheduleMeeting(agent, params);
      case 'process-document':
        return this.processDocument(agent, params);
      case 'create-task':
        return this.createTask(agent, params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  public getAgentMetrics(agentId: string) {
    const results = this.agentResults$.value[agentId] || [];
    return {
      totalExecutions: results.length,
      successRate: results.filter(r => !r.error).length / results.length,
      averageExecutionTime: this.calculateAverageExecutionTime(results),
      lastExecution: results[results.length - 1]?.timestamp
    };
  }

  private calculateAverageExecutionTime(results: any[]) {
    if (results.length < 2) return 0;
    const times = results.map(r => r.timestamp.getTime());
    const intervals = times.slice(1).map((time, i) => time - times[i]);
    return intervals.reduce((a, b) => a + b, 0) / intervals.length;
  }

  public trainAgent(agentId: string, trainingData: any[]) {
    const agent = this.activeAgents$.value.find(a => a.id === agentId);
    if (!agent) throw new Error('Agent not found');

    this.voiceControl.speak(`Starting training for ${agent.name}`);
    
    // Implement training logic here
    // This could involve fine-tuning the model or updating the agent's configuration
  }

  public async observeUserActions(action: UserAction): Promise<void> {
    // Record and analyze user actions
    this.workflowLearner.analyzeActions([action]);

    // Check for new automation opportunities
    const suggestions = this.workflowLearner.suggestAutomations();
    if (suggestions.length > this.suggestions$.value.length) {
      this.voiceControl.speak(`Found ${suggestions.length} new automation opportunities`);
    }
    this.suggestions$.next(suggestions);
  }

  public async createAgentFromPattern(pattern: WorkflowPattern): Promise<void> {
    try {
      const agent = this.agentCreationService.createAgentFromPattern(pattern);
      
      // Add to active agents
      const currentAgents = this.activeAgents$.value;
      this.activeAgents$.next([...currentAgents, agent]);

      // Announce creation
      this.voiceControl.speak(
        `Created new ${agent.name}. Would you like me to explain its capabilities?`
      );

      // Start training if needed
      if (pattern.type === 'learning') {
        await this.trainAgent(agent, pattern.actions);
      }
    } catch (error) {
      console.error('Failed to create agent:', error);
      this.voiceControl.speak('Sorry, I encountered an error while creating the agent');
    }
  }

  public async executeAgentAction(
    agentId: string,
    action: string,
    params: any
  ): Promise<void> {
    try {
      // Log action start
      console.log(`Executing ${action} with agent ${agentId}`);

      // Find agent
      const agent = this.activeAgents$.value.find(a => a.id === agentId);
      if (!agent) throw new Error('Agent not found');

      // Execute action based on agent type and capabilities
      const result = await this.executeAction(agent, action, params);

      // Update agent metrics
      this.updateAgentMetrics(agentId, {
        action,
        success: true,
        duration: result.duration,
        output: result.output
      });

    } catch (error) {
      console.error(`Agent action failed:`, error);
      this.updateAgentMetrics(agentId, {
        action,
        success: false,
        error: error.message
      });
    }
  }

  private async executeAction(
    agent: AgentConfig,
    action: string,
    params: any
  ): Promise<ActionResult> {
    const startTime = Date.now();

    switch (action) {
      case 'analyze-email':
        return await this.emailAgent.analyzeEmail(params.email);
      case 'schedule-meeting':
        return await this.calendarAgent.scheduleMeeting(params.participants, params.duration);
      case 'process-document':
        return await this.documentAgent.processDocument(params.document);
      case 'create-task':
        return await this.taskAgent.createTask(params.task);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private updateAgentMetrics(agentId: string, metrics: ActionMetrics): void {
    const agents = this.activeAgents$.value;
    const agentIndex = agents.findIndex(a => a.id === agentId);
    
    if (agentIndex >= 0) {
      const updatedAgent = {
        ...agents[agentIndex],
        metrics: {
          ...agents[agentIndex].metrics,
          actionsCompleted: agents[agentIndex].metrics.actionsCompleted + 1,
          successRate: metrics.success 
            ? (agents[agentIndex].metrics.successRate * agents[agentIndex].metrics.actionsCompleted + 1) / (agents[agentIndex].metrics.actionsCompleted + 1)
            : (agents[agentIndex].metrics.successRate * agents[agentIndex].metrics.actionsCompleted) / (agents[agentIndex].metrics.actionsCompleted + 1)
        }
      };

      agents[agentIndex] = updatedAgent;
      this.activeAgents$.next([...agents]);
    }
  }
} 