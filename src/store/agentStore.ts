import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Agent, 
  AgentAction, 
  AgentFeedback, 
  AgentStatus, 
  AutonomyLevel,
  AgentType,
  AgentCapability 
} from '../types/agent';
import { nanoid } from 'nanoid';

// Import necessary services
import emailServiceInstance from '../services/email/emailService';
import { aiCalendarService } from '../services/calendar/AiCalendarService';
import { EmailMessage } from '../types/email';
import { EmailAnalysisMeetingDetails, EmailMessage as ServiceEmailMessage, EmailAttachment as ServiceEmailAttachment } from '../services/email/types';

// Define a sample agent for testing
const defaultAgent: Agent = {
  id: '1',
  name: 'Default AI Assistant',
  type: 'assistant',
  description: 'A general purpose AI assistant',
  status: 'active',
  autonomyLevel: 'supervised',
  capabilities: ['natural-language', 'task-management'],
  config: {
    id: '1',
    name: 'Default AI Assistant',
    type: 'assistant',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: 'You are a helpful AI assistant.',
    capabilities: ['natural-language', 'task-management'],
    autonomyLevel: 'supervised'
  },
  metrics: {
    performance: 85,
    tasks: {
      completed: 10,
      total: 12
    },
    responseTime: 1.2,
    successRate: 0.9,
    lastUpdated: new Date(),
    accuracy: 0.85,
    uptime: 99.9
  },
  lastActive: new Date(),
  performance: 85,
  tasks: {
    completed: 10,
    total: 12
  }
};

interface AgentState {
  agents: Agent[];
  actions: AgentAction[];
  feedback: AgentFeedback[];
  activeAgents: string[];
  isLoading: boolean;
  error: string | null;
  selectedAgentId: string | undefined;
  
  // Basic CRUD
  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  removeAgent: (id: string) => void;
  
  // Agent Management
  createAgent: (name: string, type: AgentType, capabilities: AgentCapability[]) => void;
  deleteAgent: (id: string) => void;
  
  // Agent Actions
  startAction: (agentId: string, type: string, input: any) => Promise<string>;
  completeAction: (actionId: string, output?: any) => Promise<void>;
  failAction: (actionId: string, error: string) => Promise<void>;
  
  // Feedback
  submitFeedback: (feedback: Omit<AgentFeedback, 'id' | 'timestamp'>) => Promise<void>;
  
  // Agent Status
  activateAgent: (id: string) => void;
  deactivateAgent: (id: string) => void;
  updateAgentStatus: (id: string, status: AgentStatus) => void;
  updateAutonomyLevel: (id: string, level: AutonomyLevel) => void;

  // Agent Operations
  executeAction: (agentId: string, actionType: string, input: any) => Promise<any>;
  trainAgent: (agentId: string) => Promise<void>;

  // New methods
  selectAgent: (id: string | undefined) => void;
  getAgent: (id: string) => Agent | undefined;
}

const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'research-agent',
    name: 'Research Assistant',
    type: 'research',
    description: 'Helps with research and information gathering',
    status: 'active',
    autonomyLevel: 'semi-autonomous',
    capabilities: ['web-search', 'document-analysis', 'natural-language'],
    config: {
      id: 'research-agent',
      name: 'Research Assistant',
      type: 'research',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt: 'You are a research assistant focused on gathering and analyzing information.',
      capabilities: ['web-search', 'document-analysis', 'natural-language'],
      autonomyLevel: 'semi-autonomous'
    },
    metrics: {
      performance: 0.95,
      tasks: {
        completed: 0,
        total: 0
      },
      responseTime: 1200,
      successRate: 0.95,
      lastUpdated: new Date(),
      accuracy: 0.92,
      uptime: 100
    },
    lastActive: new Date(),
    performance: 0.95,
    tasks: {
      completed: 0,
      total: 0
    }
  },
  {
    id: 'coding-agent',
    name: 'Code Assistant',
    type: 'development',
    description: 'Helps with coding and development tasks',
    status: 'idle',
    autonomyLevel: 'supervised',
    capabilities: ['code-generation', 'code-review', 'debugging'],
    config: {
      id: 'coding-agent',
      name: 'Code Assistant',
      type: 'development',
      model: 'gpt-4',
      temperature: 0.3,
      maxTokens: 2000,
      systemPrompt: 'You are a coding assistant focused on helping with development tasks.',
      capabilities: ['code-generation', 'code-review', 'debugging'],
      autonomyLevel: 'supervised'
    },
    metrics: {
      performance: 0.88,
      tasks: {
        completed: 0,
        total: 0
      },
      responseTime: 800,
      successRate: 0.9,
      lastUpdated: new Date(),
      accuracy: 0.95,
      uptime: 100
    },
    lastActive: new Date(),
    performance: 0.88,
    tasks: {
      completed: 0,
      total: 0
    }
  }
];

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      agents: DEFAULT_AGENTS,
      actions: [],
      feedback: [],
      activeAgents: ['research-agent', 'coding-agent'],
      isLoading: false,
      error: null,
      selectedAgentId: undefined,

      setAgents: (agents) => set({ agents }),
      
      addAgent: (agent) => set((state) => ({ agents: [...state.agents, agent] })),
      
      updateAgent: (id, updates) => 
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === id ? { ...agent, ...updates } : agent
          ),
        })),
      
      removeAgent: (id) =>
        set((state) => ({
          agents: state.agents.filter((agent) => agent.id !== id),
          activeAgents: state.activeAgents.filter((agentId) => agentId !== id),
        })),

      createAgent: (name, type, capabilities) => {
        const newAgent: Agent = {
          id: nanoid(),
          name,
          type,
          description: `AI assistant for ${type} tasks`,
          status: 'idle',
          autonomyLevel: 'supervised',
          capabilities,
          config: {
            id: nanoid(),
            name,
            type,
            model: 'gpt-4',
            temperature: 0.7,
            maxTokens: 2000,
            systemPrompt: `You are an AI assistant focused on ${type} tasks.`,
            capabilities,
            autonomyLevel: 'supervised'
          },
          metrics: {
            performance: 1,
            tasks: {
              completed: 0,
              total: 0
            },
            responseTime: 0,
            successRate: 1,
            lastUpdated: new Date(),
            accuracy: 1,
            uptime: 100
          },
          lastActive: new Date(),
          performance: 1,
          tasks: {
            completed: 0,
            total: 0
          }
        };
        
        set((state) => ({ agents: [...state.agents, newAgent] }));
      },

      deleteAgent: (id) => {
        set((state) => ({
          agents: state.agents.filter((agent) => agent.id !== id),
          activeAgents: state.activeAgents.filter((agentId) => agentId !== id),
          selectedAgentId: state.selectedAgentId === id ? undefined : state.selectedAgentId
        }));
      },

      startAction: async (agentId, type, input) => {
        const actionId = crypto.randomUUID();
        const action: AgentAction = {
          id: actionId,
          agentId,
          type,
          input,
          startedAt: new Date(),
          status: 'pending',
        };
        
        set((state) => ({ actions: [...state.actions, action] }));
        return actionId;
      },

      completeAction: async (actionId, output) => {
        set((state) => ({
          actions: state.actions.map((action) =>
            action.id === actionId
              ? { ...action, status: 'completed', output, completedAt: new Date() }
              : action
          ),
        }));
      },

      failAction: async (actionId, error) => {
        set((state) => ({
          actions: state.actions.map((action) =>
            action.id === actionId
              ? { ...action, status: 'failed', error, completedAt: new Date() }
              : action
          ),
        }));
      },

      submitFeedback: async (feedback) => {
        const newFeedback: AgentFeedback = {
          ...feedback,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        };
        set((state) => ({ feedback: [...state.feedback, newFeedback] }));
      },

      activateAgent: (id) => {
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === id ? { ...agent, status: 'active' } : agent
          ),
          activeAgents: [...state.activeAgents, id],
        }));
      },

      deactivateAgent: (id) => {
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === id ? { ...agent, status: 'inactive' } : agent
          ),
          activeAgents: state.activeAgents.filter((agentId) => agentId !== id),
        }));
      },

      updateAgentStatus: (id, status) => {
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === id ? { ...agent, status } : agent
          ),
        }));
      },

      updateAutonomyLevel: (id, level) => {
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === id ? { ...agent, autonomyLevel: level } : agent
          ),
        }));
      },

      executeAction: async (agentId: string, actionType: string, input: any): Promise<any> => {
        console.log(`[AgentStore] Executing action: ${actionType} for agent ${agentId} with input:`, input);
        const agent = get().agents.find(a => a.id === agentId);
        if (!agent) {
          throw new Error(`Agent with ID ${agentId} not found.`);
        }

        try {
          switch (actionType) {
            case 'GET_EMAIL_DETAILS':
              if (!input || !input.emailId) {
                throw new Error('Input must include emailId for GET_EMAIL_DETAILS');
              }
              // Assuming emailServiceInstance.getEmailDetails returns a Promise<EmailMessage | null>
              // And that the workflow expects the full EmailMessage object.
              // The actual getEmailDetails in EmailService might need adjustment if it expects accountId etc.
              // For now, we'll assume it's adapted or a wrapper is used.
              // This is a simplified call; EmailService.getEmailDetails might need more context (e.g., accountId)
              // For workflows, the account context might be part of the agent's config or workflow global settings.
              // This part needs careful integration with how EmailService fetches specific emails.
              // Let's assume for now that a method exists on emailServiceInstance that can get by ID alone,
              // or input.accountId is also provided.
              // To make this runnable, we'll use a conceptual getRawEmailMessageById
              // 실제 emailService.getEmailDetails는 accountId가 필요할 수 있습니다.
              // 지금은 emailId만으로 가져올 수 있는 emailServiceInstance의 메서드가 있다고 가정하거나,
              // input.accountId도 제공된다고 가정합니다.
              // 실행 가능하게 만들기 위해 개념적인 getRawEmailMessageById를 사용합니다.
              // This is a placeholder for the actual call that would fetch full email data.
              // In a real scenario, this might involve looking up account details associated with the agent or workflow.
              console.warn('[AgentStore] GET_EMAIL_DETAILS needs a robust way to get account context for emailService.getEmailDetails');
              // const emailMessage = await emailServiceInstance.getEmailDetails(input.accountId, input.emailId);
              // For now, let's return a mock or assume input.emailData is provided for chained testing
              if (input.emailData) return input.emailData; // If emailData is passed directly (e.g. from a trigger)
              throw new Error('GET_EMAIL_DETAILS needs implementation details for fetching by ID across accounts.');

            case 'ANALYZE_EMAIL_FOR_CALENDAR_EVENT':
              if (!input || !input.emailMessage) {
                throw new Error('Input must include emailMessage for ANALYZE_EMAIL_FOR_CALENDAR_EVENT');
              }
              
              const originalEmail = input.emailMessage as EmailMessage; // from ../types/email.ts

              // Construct the email object expected by emailServiceInstance.analyzeEmail
              // This is of type ../services/email/types.ts#EmailMessage (ServiceEmailMessage)
              const emailForService: ServiceEmailMessage = {
                // Fields present in originalEmail (../types/email.ts#EmailMessage)
                id: originalEmail.id,
                threadId: originalEmail.threadId,
                subject: originalEmail.subject,
                from: originalEmail.from,
                to: originalEmail.to,
                cc: originalEmail.cc,
                bcc: originalEmail.bcc,
                body: originalEmail.body,
                date: originalEmail.date instanceof Date ? originalEmail.date.toISOString() : originalEmail.date, // Convert Date to ISO string
                labels: originalEmail.labels || [],
                read: originalEmail.read,
                starred: originalEmail.starred,
                
                // Fields that might be in ServiceEmailMessage but not guaranteed in originalEmail
                // Provide defaults or ensure they are optional in ServiceEmailMessage definition used by analyzeEmail
                snippet: (originalEmail as any).snippet || '', // Assuming snippet might exist on originalEmail due to previous errors, or default to empty
                attachments: (originalEmail as any).attachments as ServiceEmailAttachment[] || [], // Assuming attachments might exist, or default to empty array
                important: (originalEmail as any).important || false, // Assuming important might exist, or default to false
                bodyMimeType: (originalEmail as any).bodyMimeType || 'text/html', // Defaulting to text/html
                // Ensure any other *required* fields of ServiceEmailMessage are present
              };
              
              return await emailServiceInstance.analyzeEmail(emailForService);

            case 'FIND_CALENDAR_EVENT_BY_CASENUMBER':
              if (!input || !input.caseNumber) {
                throw new Error('Input must include caseNumber for FIND_CALENDAR_EVENT_BY_CASENUMBER');
              }
              return await aiCalendarService.findEventByCaseNumber(input.caseNumber as string);

            case 'CREATE_CALENDAR_EVENT':
              if (!input || !input.meetingDetails || !input.emailSubject) {
                throw new Error('Input must include meetingDetails and emailSubject for CREATE_CALENDAR_EVENT');
              }
              // Ensure all necessary parts of meetingDetails are present as per AiCalendarService
              return await aiCalendarService.createEventFromAnalysis(
                input.meetingDetails as EmailAnalysisMeetingDetails,
                input.emailSubject as string,
                input.emailMessageId as string | undefined, // Optional
                input.emailThreadId as string | undefined  // Optional
              );

            case 'UPDATE_CALENDAR_EVENT':
              if (!input || !input.eventId || !input.meetingDetails || !input.emailSubject) {
                throw new Error('Input must include eventId, meetingDetails, and emailSubject for UPDATE_CALENDAR_EVENT');
              }
              return await aiCalendarService.updateEvent(
                input.eventId as string,
                input.meetingDetails as EmailAnalysisMeetingDetails,
                input.emailSubject as string,
                input.emailMessageId as string | undefined, // Optional
                input.emailThreadId as string | undefined  // Optional
              );
            
            case 'LOG_MESSAGE':
                if (!input || !input.message) {
                    console.warn('[AgentStore] LOG_MESSAGE action called without a message.');
                    return { logged: false, message: 'No message provided.' };
                }
                console.log(`[Workflow Log][Agent: ${agentId}]: ${input.message}`);
                return { logged: true, message: input.message };

            // TODO: Add other actions like SEND_NOTIFICATION
            // case 'SEND_NOTIFICATION':
            //   // ...
            //   break;

            default:
              console.warn(`[AgentStore] Unknown actionType: ${actionType}`);
              throw new Error(`Unknown actionType: ${actionType}`);
          }
        } catch (error) {
          console.error(`[AgentStore] Error executing action ${actionType} for agent ${agentId}:`, error);
          // Re-throw the error so workflowStore can catch it and mark the step/run as failed
          throw error;
        }
      },

      trainAgent: async (agentId: string) => {
        // Placeholder for training logic
        console.log(`Training agent ${agentId}...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate training
        set(state => ({
          agents: state.agents.map(agent =>
            agent.id === agentId ? { ...agent, status: 'active' as AgentStatus } : agent
          ),
        }));
        console.log(`Agent ${agentId} training complete.`);
      },

      selectAgent: (id) => set({ selectedAgentId: id }),
      getAgent: (id) => get().agents.find(agent => agent.id === id),
    }),
    {
      name: 'agent-store',
    }
  )
); 