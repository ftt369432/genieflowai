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

      executeAction: async (agentId, actionType, input) => {
        const actionId = await get().startAction(agentId, actionType, input);
        try {
          // Implement actual action execution logic here
          // For now, just return a dummy response
          await get().completeAction(actionId, { result: 'Action executed successfully' });
          return { success: true, actionId };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          await get().failAction(actionId, errorMessage);
          throw error;
        }
      },

      trainAgent: async (agentId) => {
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === agentId ? { ...agent, status: 'training' } : agent
          ),
        }));
        
        try {
          // Simulate training process
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          set((state) => ({
            agents: state.agents.map((agent) =>
              agent.id === agentId ? { 
                ...agent, 
                status: 'active',
                metrics: {
                  ...agent.metrics,
                  accuracy: Math.min(agent.metrics.accuracy + 0.05, 1),
                  performance: Math.min(agent.metrics.performance + 5, 100)
                }
              } : agent
            ),
          }));
        } catch (error) {
          set((state) => ({
            agents: state.agents.map((agent) =>
              agent.id === agentId ? { ...agent, status: 'error' } : agent
            ),
          }));
          throw error;
        }
      },

      selectAgent: (id) => {
        set({ selectedAgentId: id });
      },

      getAgent: (id) => {
        return get().agents.find(agent => agent.id === id);
      }
    }),
    {
      name: 'agent-store',
    }
  )
); 