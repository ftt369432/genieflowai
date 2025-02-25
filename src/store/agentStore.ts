import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AgentConfig, AgentAction, AgentFeedback, Agent, AgentType, AgentCapability } from '../types/agents';
import { v4 as uuidv4 } from 'uuid';
import { agentService } from '../services/agentService';

export type AgentStatus = 'active' | 'paused' | 'training' | 'error';
export type AutonomyLevel = 'supervised' | 'semi-autonomous' | 'autonomous';

interface AgentState {
  agents: Agent[];
  actions: AgentAction[];
  feedback: AgentFeedback[];
  activeAgents: string[];
  
  // Basic CRUD
  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  removeAgent: (id: string) => void;
  
  // Agent Management
  createAgent: (agent: Omit<Agent, 'metrics' | 'id'>) => void;
  deleteAgent: (id: string) => void;
  
  // Agent Actions
  startAction: (agentId: string, type: string) => Promise<string>;
  completeAction: (actionId: string) => Promise<void>;
  failAction: (actionId: string, error: string) => Promise<void>;
  
  // Feedback
  submitFeedback: (feedback: Omit<AgentFeedback, 'id' | 'createdAt'>) => Promise<void>;
  
  // Agent Status
  activateAgent: (id: string) => void;
  deactivateAgent: (id: string) => void;

  updateAgentStatus: (id: string, status: AgentStatus) => void;
  updateAutonomyLevel: (id: string, level: AutonomyLevel) => void;

  executeAction: (agentId: string, actionType: string, input: any) => Promise<any>;
  trainAgent: (agentId: string) => Promise<void>;
}

// Add a default agent for testing
const defaultAgent: Agent = {
  id: '1',
  name: 'Default Agent',
  type: 'custom',
  status: 'active',
  performanceMetrics: {
    taskCompletionRate: 0,
    responseTime: 0,
    feedback: []
  }
};

// Add this debug log
console.log('Initializing store with default agent:', defaultAgent);

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      agents: [defaultAgent],
      actions: [],
      feedback: [],
      activeAgents: [],

      // Basic CRUD
      setAgents: (agents) => {
        console.log('Setting agents:', agents); // Debug log
        set({ agents });
      },
      addAgent: (agent) => {
        console.log('Adding agent:', agent); // Debug log
        set((state) => ({ agents: [...state.agents, agent] }));
      },
      updateAgent: (id, updates) => set((state) => ({
        agents: state.agents.map(agent => 
          agent.id === id ? { ...agent, ...updates } : agent
        )
      })),
      removeAgent: (id) => set((state) => ({
        agents: state.agents.filter(agent => agent.id !== id)
      })),

      // Agent Management
      createAgent: (agentData) => {
        const newAgent: Agent = {
          ...agentData,
          id: crypto.randomUUID(),
          status: 'inactive',
          metrics: {
            tasksCompleted: 0,
            accuracy: 0,
            responseTime: 0,
            uptime: 0,
            successRate: 0
          }
        };

        set((state) => ({
          agents: [...state.agents, newAgent]
        }));
      },

      deleteAgent: (id) => set((state) => ({
        agents: state.agents.filter(agent => agent.id !== id)
      })),

      // Agent Actions
      startAction: async (agentId, type) => {
        const id = uuidv4();
        const action: AgentAction = {
          id,
          agentId,
          type,
          status: 'pending',
          startedAt: new Date(),
        };
        
        set((state) => ({
          actions: [...state.actions, action],
        }));
        
        return id;
      },

      completeAction: async (actionId) => {
        set((state) => ({
          actions: state.actions.map((action) =>
            action.id === actionId
              ? {
                  ...action,
                  status: 'completed',
                  completedAt: new Date(),
                }
              : action
          ),
        }));
      },

      failAction: async (actionId, error) => {
        set((state) => ({
          actions: state.actions.map((action) =>
            action.id === actionId
              ? {
                  ...action,
                  status: 'failed',
                  completedAt: new Date(),
                  error,
                }
              : action
          ),
        }));
      },

      // Feedback
      submitFeedback: async (feedback) => {
        const id = uuidv4();
        set((state) => ({
          feedback: [
            ...state.feedback,
            { ...feedback, id, createdAt: new Date() },
          ],
        }));
      },

      // Agent Status
      activateAgent: (id) => set((state) => ({
        agents: state.agents.map(agent =>
          agent.id === id ? { ...agent, status: 'active' } : agent
        )
      })),

      deactivateAgent: (id) => set((state) => ({
        agents: state.agents.map(agent =>
          agent.id === id ? { ...agent, status: 'inactive' } : agent
        )
      })),

      updateAgentStatus: (id, status) =>
        set((state) => ({
          agents: state.agents.map(agent =>
            agent.id === id ? { ...agent, status } : agent
          )
        })),

      updateAutonomyLevel: (id, level) =>
        set((state) => ({
          agents: state.agents.map(agent =>
            agent.id === id ? { ...agent, autonomyLevel: level } : agent
          )
        })),

      executeAction: async (agentId: string, actionType: string, input: any) => {
        const agent = get().agents.find(a => a.id === agentId);
        if (!agent) throw new Error('Agent not found');

        const actionId = uuidv4();
        const action: AgentAction = {
          id: actionId,
          agentId,
          type: actionType,
          status: 'pending',
          input,
          startedAt: new Date()
        };

        set(state => ({
          actions: [...state.actions, action]
        }));

        try {
          const output = await agentService.performAction(agent, action);
          
          set(state => ({
            actions: state.actions.map(a => 
              a.id === actionId 
                ? { 
                    ...a, 
                    status: 'completed' as ActionStatus,
                    output,
                    completedAt: new Date()
                  }
                : a
            )
          }));

          return output;
        } catch (error) {
          set(state => ({
            actions: state.actions.map(a =>
              a.id === actionId
                ? {
                    ...a,
                    status: 'failed' as ActionStatus,
                    error: error.message,
                    completedAt: new Date()
                  }
                : a
            )
          }));
          throw error;
        }
      },

      trainAgent: async (agentId: string) => {
        const agent = get().agents.find(a => a.id === agentId);
        if (!agent) throw new Error('Agent not found');

        set(state => ({
          agents: state.agents.map(a =>
            a.id === agentId ? { ...a, status: 'training' } : a
          )
        }));

        // Simulate training process
        await new Promise(resolve => setTimeout(resolve, 5000));

        set(state => ({
          agents: state.agents.map(a =>
            a.id === agentId ? { 
              ...a, 
              status: 'active',
              metrics: {
                ...a.metrics,
                accuracy: Math.min(a.metrics.accuracy + 0.05, 1)
              }
            } : a
          )
        }));
      }
    }),
    {
      name: 'agent-store',
      onRehydrateStorage: () => (state) => {
        console.log('Rehydrated state:', state); // Debug log
      },
    }
  )
);

// Add this to check initial store state
const initialState = useAgentStore.getState();
console.log('Initial store state:', initialState); 