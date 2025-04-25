import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { LegalAgentRole, LegalHearingInfo } from '../types/legal';

export type SwarmStatus = 'active' | 'inactive' | 'paused';

export interface SwarmAgent {
  id: string;
  role: string;
  agentId: string | null;
}

export interface SwarmTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  assignedTo: string | null;
  dueDate?: Date;
  priority?: 'low' | 'medium' | 'high';
  completedAt?: Date;
}

export interface Swarm {
  id: string;
  name: string;
  description: string;
  status: SwarmStatus;
  type: string;
  template?: string;
  agents: SwarmAgent[];
  tasks: SwarmTask[];
  createdAt: Date;
  updatedAt?: Date;
  metadata?: Record<string, any>;
}

interface SwarmStore {
  swarms: Swarm[];
  activeSwarmId: string | null;
  
  // CRUD operations
  createSwarm: (swarm: Omit<Swarm, 'updatedAt'>) => string;
  updateSwarm: (id: string, updates: Partial<Omit<Swarm, 'id' | 'createdAt'>>) => void;
  deleteSwarm: (id: string) => void;
  getSwarmById: (id: string) => Swarm | undefined;
  
  // Status management
  setSwarmStatus: (id: string, status: SwarmStatus) => void;
  activateSwarm: (id: string) => void;
  pauseSwarm: (id: string) => void;
  deactivateSwarm: (id: string) => void;
  
  // Task management
  addTask: (swarmId: string, task: Omit<SwarmTask, 'id'>) => string;
  updateTask: (swarmId: string, taskId: string, updates: Partial<Omit<SwarmTask, 'id'>>) => void;
  deleteTask: (swarmId: string, taskId: string) => void;
  
  // Agent management
  addAgent: (swarmId: string, agent: Omit<SwarmAgent, 'id'>) => string;
  updateAgent: (swarmId: string, agentId: string, updates: Partial<Omit<SwarmAgent, 'id'>>) => void;
  removeAgent: (swarmId: string, agentId: string) => void;
  
  // Active swarm management
  setActiveSwarm: (id: string | null) => void;
}

export const useSwarmStore = create<SwarmStore>()(
  persist(
    (set, get) => ({
      swarms: [],
      activeSwarmId: null,
      
      createSwarm: (swarm) => {
        const id = swarm.id || nanoid();
        set((state) => ({
          swarms: [
            ...state.swarms,
            {
              ...swarm,
              id,
              createdAt: swarm.createdAt || new Date(),
              updatedAt: new Date(),
            },
          ],
        }));
        return id;
      },
      
      updateSwarm: (id, updates) => {
        set((state) => ({
          swarms: state.swarms.map((swarm) =>
            swarm.id === id
              ? { ...swarm, ...updates, updatedAt: new Date() }
              : swarm
          ),
        }));
      },
      
      deleteSwarm: (id) => {
        set((state) => ({
          swarms: state.swarms.filter((swarm) => swarm.id !== id),
          activeSwarmId: state.activeSwarmId === id ? null : state.activeSwarmId,
        }));
      },
      
      getSwarmById: (id) => {
        return get().swarms.find((swarm) => swarm.id === id);
      },
      
      setSwarmStatus: (id, status) => {
        get().updateSwarm(id, { status });
      },
      
      activateSwarm: (id) => {
        get().setSwarmStatus(id, 'active');
      },
      
      pauseSwarm: (id) => {
        get().setSwarmStatus(id, 'paused');
      },
      
      deactivateSwarm: (id) => {
        get().setSwarmStatus(id, 'inactive');
      },
      
      addTask: (swarmId, task) => {
        const taskId = nanoid();
        set((state) => ({
          swarms: state.swarms.map((swarm) =>
            swarm.id === swarmId
              ? {
                  ...swarm,
                  tasks: [...swarm.tasks, { ...task, id: taskId }],
                  updatedAt: new Date(),
                }
              : swarm
          ),
        }));
        return taskId;
      },
      
      updateTask: (swarmId, taskId, updates) => {
        set((state) => ({
          swarms: state.swarms.map((swarm) =>
            swarm.id === swarmId
              ? {
                  ...swarm,
                  tasks: swarm.tasks.map((task) =>
                    task.id === taskId ? { ...task, ...updates } : task
                  ),
                  updatedAt: new Date(),
                }
              : swarm
          ),
        }));
      },
      
      deleteTask: (swarmId, taskId) => {
        set((state) => ({
          swarms: state.swarms.map((swarm) =>
            swarm.id === swarmId
              ? {
                  ...swarm,
                  tasks: swarm.tasks.filter((task) => task.id !== taskId),
                  updatedAt: new Date(),
                }
              : swarm
          ),
        }));
      },
      
      addAgent: (swarmId, agent) => {
        const agentId = nanoid();
        set((state) => ({
          swarms: state.swarms.map((swarm) =>
            swarm.id === swarmId
              ? {
                  ...swarm,
                  agents: [...swarm.agents, { ...agent, id: agentId }],
                  updatedAt: new Date(),
                }
              : swarm
          ),
        }));
        return agentId;
      },
      
      updateAgent: (swarmId, agentId, updates) => {
        set((state) => ({
          swarms: state.swarms.map((swarm) =>
            swarm.id === swarmId
              ? {
                  ...swarm,
                  agents: swarm.agents.map((agent) =>
                    agent.id === agentId ? { ...agent, ...updates } : agent
                  ),
                  updatedAt: new Date(),
                }
              : swarm
          ),
        }));
      },
      
      removeAgent: (swarmId, agentId) => {
        set((state) => ({
          swarms: state.swarms.map((swarm) =>
            swarm.id === swarmId
              ? {
                  ...swarm,
                  agents: swarm.agents.filter((agent) => agent.id !== agentId),
                  updatedAt: new Date(),
                }
              : swarm
          ),
        }));
      },
      
      setActiveSwarm: (id) => {
        set({ activeSwarmId: id });
      },
    }),
    {
      name: 'swarm-storage',
    }
  )
);

// Helper functions for swarm operations
export function createLegalSwarm(
  name: string,
  description: string,
  agents: SwarmAgent[],
  legalInfo: LegalHearingInfo,
  caseType: string = 'general'
): string {
  const swarmStore = useSwarmStore.getState();
  
  const swarm: Omit<Swarm, 'updatedAt'> = {
    id: nanoid(),
    name,
    description,
    status: 'active',
    type: 'legal',
    agents,
    tasks: [
      {
        id: nanoid(),
        title: 'Initial case review',
        description: 'Review case information and identify key issues',
        status: 'pending',
        assignedTo: agents.find(a => a.role === 'Case Coordinator')?.agentId || null,
      },
    ],
    createdAt: new Date(),
    metadata: {
      legalCase: legalInfo,
      caseType,
    },
  };
  
  return swarmStore.createSwarm(swarm);
} 