import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Play, Pause, Settings, Trash2, Bot, Activity, Power } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAgent } from '../../hooks/useAgent';
import type { Agent } from '../../types/agent';
import type { AgentType, AgentStatus, AutonomyLevel } from '../../store/agentStore';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../ui/Badge';

interface AgentCardProps {
  agent: Agent;
  onActivate?: (id: string) => void;
  onDeactivate?: (id: string) => void;
}

export function AgentCard({ agent, onActivate, onDeactivate }: AgentCardProps) {
  const navigate = useNavigate();
  const { isActive, activate, deactivate } = useAgent(agent?.id);

  const statusColors = {
    active: 'bg-green-500',
    inactive: 'bg-gray-500',
    training: 'bg-yellow-500'
  };

  if (!agent) {
    return null;
  }

  const handleToggleActive = () => {
    if (isActive) {
      deactivate();
    } else {
      activate();
    }
  };

  const capabilities = agent?.capabilities || [];
  const metrics = agent?.metrics || { 
    tasksCompleted: 0,
    accuracy: 0,
    responseTime: 0
  };

  return (
    <Card 
      className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => navigate(`/agents/monitor/${agent.id}`)}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">{agent.name}</h3>
        <Badge className={statusColors[agent.status]}>
          {agent.status}
        </Badge>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-gray-600">Type: {agent.type}</p>
        <div className="flex flex-wrap gap-2">
          {capabilities.map((capability) => (
            <Badge key={capability} variant="outline">
              {capability}
            </Badge>
          ))}
        </div>
      </div>

      {agent.metrics && (
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-gray-600">Success Rate</p>
            <p className="font-medium">{agent.metrics.successRate}%</p>
          </div>
          <div>
            <p className="text-gray-600">Response Time</p>
            <p className="font-medium">{agent.metrics.responseTime}ms</p>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end gap-2">
        {isActive ? (
          <button
            onClick={onDeactivate}
            className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
          >
            Deactivate
          </button>
        ) : (
          <button
            onClick={onActivate}
            className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
          >
            Activate
          </button>
        )}
      </div>
    </Card>
  );
} 