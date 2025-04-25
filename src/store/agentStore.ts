import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { LegalAgentCapability } from '../types/legal';

export type AgentCapability =
  | 'text-generation'
  | 'image-generation'
  | 'code-generation'
  | 'data-analysis'
  | 'summarization'
  | 'translation'
  | 'knowledge-base'
  | 'voice-interface'
  | 'search'
  | 'legal-research'
  | 'case-management'
  | 'medical-record-analysis'
  | 'hearing-preparation'
  | 'document-filing'
  | 'client-communication'
  | 'settlement-negotiation'
  | 'court-appearance-preparation';

export type AgentModel = 
  | 'gpt-4'
  | 'gpt-3.5-turbo'
  | 'gemini-pro'
  | 'claude-3-opus'
  | 'claude-3-sonnet'
  | 'llama-3-70b'
  | 'mistral-large'
  | 'custom';

export interface Agent {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  model: AgentModel;
  capabilities: AgentCapability[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  createdAt: Date;
  updatedAt?: Date;
  metadata?: Record<string, any>;
}

interface AgentStore {
  agents: Agent[];
  selectedAgentId: string | null;
  
  // CRUD operations
  createAgent: (agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateAgent: (id: string, updates: Partial<Omit<Agent, 'id' | 'createdAt'>>) => void;
  deleteAgent: (id: string) => void;
  getAgentById: (id: string) => Agent | undefined;
  
  // Selection
  selectAgent: (id: string | null) => void;
  
  // Capability management
  addCapability: (id: string, capability: AgentCapability) => void;
  removeCapability: (id: string, capability: AgentCapability) => void;
  hasCapability: (id: string, capability: AgentCapability) => boolean;
  
  // Filtering
  getAgentsByCapability: (capability: AgentCapability) => Agent[];
  getAgentsByCapabilities: (capabilities: AgentCapability[]) => Agent[];
}

export const useAgentStore = create<AgentStore>()(
  persist(
    (set, get) => ({
      agents: [
        // Default agents with legal capabilities
        {
          id: 'legal-coordinator',
          name: 'Legal Coordinator',
          description: 'Specialized in managing legal cases and coordinating between different agents',
          avatar: '👨‍⚖️',
          model: 'claude-3-opus',
          capabilities: [
            'case-management',
            'client-communication',
            'knowledge-base',
            'summarization'
          ],
          systemPrompt: 'You are a specialized legal case coordinator. Your role is to manage legal cases, coordinate between different agents, and ensure all tasks are completed efficiently.',
          temperature: 0.3,
          maxTokens: 2000,
          createdAt: new Date(),
        },
        {
          id: 'legal-researcher',
          name: 'Legal Researcher',
          description: 'Specialized in legal research and case law analysis',
          avatar: '📚',
          model: 'claude-3-sonnet',
          capabilities: [
            'legal-research',
            'search',
            'summarization',
            'knowledge-base'
          ],
          systemPrompt: 'You are a specialized legal researcher. Your role is to conduct in-depth legal research, analyze case law, and provide comprehensive legal insights.',
          temperature: 0.2,
          maxTokens: 4000,
          createdAt: new Date(),
        },
        {
          id: 'medical-analyst',
          name: 'Medical Evidence Analyst',
          description: 'Specialized in analyzing medical records and evidence for legal cases',
          avatar: '🩺',
          model: 'gpt-4',
          capabilities: [
            'medical-record-analysis',
            'summarization',
            'data-analysis'
          ],
          systemPrompt: 'You are a specialized medical evidence analyst for legal cases. Your role is to analyze medical records, identify key medical evidence, and provide insights for legal proceedings.',
          temperature: 0.2,
          maxTokens: 3000,
          createdAt: new Date(),
        },
        {
          id: 'hearing-prep',
          name: 'Hearing Specialist',
          description: 'Specialized in preparing for legal hearings and court appearances',
          avatar: '🏛️',
          model: 'gemini-pro',
          capabilities: [
            'hearing-preparation',
            'court-appearance-preparation',
            'text-generation'
          ],
          systemPrompt: 'You are a specialized hearing preparation specialist. Your role is to prepare for legal hearings, draft questions for witnesses, and develop hearing strategies.',
          temperature: 0.4,
          maxTokens: 2500,
          createdAt: new Date(),
        },
        {
          id: 'document-manager',
          name: 'Document Manager',
          description: 'Specialized in managing legal documents and filings',
          avatar: '📄',
          model: 'claude-3-sonnet',
          capabilities: [
            'document-filing',
            'text-generation',
            'summarization'
          ],
          systemPrompt: 'You are a specialized legal document manager. Your role is to prepare legal documents, manage filings, and ensure all documentation is properly organized.',
          temperature: 0.3,
          maxTokens: 2000,
          createdAt: new Date(),
        },
        {
          id: 'negotiator',
          name: 'Settlement Negotiator',
          description: 'Specialized in settlement negotiations and strategy',
          avatar: '🤝',
          model: 'claude-3-opus',
          capabilities: [
            'settlement-negotiation',
            'client-communication',
            'text-generation'
          ],
          systemPrompt: 'You are a specialized settlement negotiator. Your role is to develop settlement strategies, analyze offers, and negotiate favorable outcomes.',
          temperature: 0.5,
          maxTokens: 3000,
          createdAt: new Date(),
        }
      ],
      selectedAgentId: null,
      
      createAgent: (agent) => {
        const id = nanoid();
        set((state) => ({
          agents: [
            ...state.agents,
            {
              ...agent,
              id,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        }));
        return id;
      },
      
      updateAgent: (id, updates) => {
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === id
              ? { ...agent, ...updates, updatedAt: new Date() }
              : agent
          ),
        }));
      },
      
      deleteAgent: (id) => {
        set((state) => ({
          agents: state.agents.filter((agent) => agent.id !== id),
          selectedAgentId: state.selectedAgentId === id ? null : state.selectedAgentId,
        }));
      },
      
      getAgentById: (id) => {
        return get().agents.find((agent) => agent.id === id);
      },
      
      selectAgent: (id) => {
        set({ selectedAgentId: id });
      },
      
      addCapability: (id, capability) => {
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === id && !agent.capabilities.includes(capability)
              ? {
                  ...agent,
                  capabilities: [...agent.capabilities, capability],
                  updatedAt: new Date(),
                }
              : agent
          ),
        }));
      },
      
      removeCapability: (id, capability) => {
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === id
              ? {
                  ...agent,
                  capabilities: agent.capabilities.filter((c) => c !== capability),
                  updatedAt: new Date(),
                }
              : agent
          ),
        }));
      },
      
      hasCapability: (id, capability) => {
        const agent = get().getAgentById(id);
        return agent ? agent.capabilities.includes(capability) : false;
      },
      
      getAgentsByCapability: (capability) => {
        return get().agents.filter((agent) => agent.capabilities.includes(capability));
      },
      
      getAgentsByCapabilities: (capabilities) => {
        return get().agents.filter((agent) =>
          capabilities.every((capability) => agent.capabilities.includes(capability))
        );
      },
    }),
    {
      name: 'agent-storage',
    }
  )
); 