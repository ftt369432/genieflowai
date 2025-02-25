import React from 'react';
import { AgentCard } from './AgentCard';
import type { Agent } from '../../types/agents';

interface AgentListProps {
  agents: Agent[];
  onAgentActivate?: (agentId: string) => void;
  onAgentDeactivate?: (agentId: string) => void;
}

export function AgentList({ agents, onAgentActivate, onAgentDeactivate }: AgentListProps) {
  if (!agents?.length) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No agents available. Create your first agent to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {agents.map(agent => (
        <AgentCard
          key={agent.id}
          agent={agent}
          onActivate={() => onAgentActivate?.(agent.id)}
          onDeactivate={() => onAgentDeactivate?.(agent.id)}
        />
      ))}
    </div>
  );
} 