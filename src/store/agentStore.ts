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
  
  // Basic CRUD
  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  removeAgent: (id: string) => void;
  
  // Agent Management
  createAgent: (agent: Omit<Agent, 'metrics' | 'id' | 'lastActive' | 'performance' | 'tasks'>) => void;
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
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      agents: [defaultAgent],
      actions: [],
      feedback: [],
      activeAgents: [defaultAgent.id],
      isLoading: false,
      error: null,

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

      createAgent: (agentData) => {
        const newAgent: Agent = {
          ...agentData,
          id: crypto.randomUUID(),
          lastActive: new Date(),
          performance: 0,
          tasks: {
            completed: 0,
            total: 0
          },
          metrics: {
            performance: 0,
            tasks: { completed: 0, total: 0 },
            responseTime: 0,
            successRate: 0,
            lastUpdated: new Date(),
            accuracy: 0,
            uptime: 0,
          },
        };
        
        set((state) => ({ agents: [...state.agents, newAgent] }));
      },

      deleteAgent: (id) => {
        set((state) => ({
          agents: state.agents.filter((agent) => agent.id !== id),
          activeAgents: state.activeAgents.filter((agentId) => agentId !== id),
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
    }),
    {
      name: 'agent-store',
    }
  )
); 