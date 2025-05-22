import React from 'react';
import { Activity, Play, Pause, Bot, Zap, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAgentStore } from '../../store/agentStore';
import { Card } from '../ui/Card';
import { formatDistanceToNow } from 'date-fns';
import type { Agent } from '../../types/agent';

interface ActiveAgentsPanelProps {
  onSelectAgent: (agentId: string) => void;
  agents?: Agent[];
}

export function ActiveAgentsPanel({ onSelectAgent, agents: propAgents }: ActiveAgentsPanelProps) {
  const { agents: storeAgents, activateAgent, deactivateAgent } = useAgentStore();
  
  // Use propAgents if provided, otherwise use agents from the store
  const allAgents = propAgents || storeAgents;

  // Get only non-inactive agents for display
  const displayAgents = allAgents.filter(a => a.status !== 'inactive');

  // Calculate metrics based on displayAgents
  const metrics = {
    totalActive: displayAgents.filter(a => a.status === 'active').length,
    averagePerformance: displayAgents.length > 0 
      ? Math.round(displayAgents.reduce((acc, curr) => acc + curr.metrics.performance, 0) / displayAgents.length)
      : 0,
    totalUptime: displayAgents.length > 0 
      ? `${Math.round(displayAgents.reduce((acc, curr) => acc + curr.metrics.uptime, 0) / displayAgents.length)}%`
      : 'N/A'
  };

  return (
    <Card className="p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Active Agents</h2>
        </div>
        <div className="flex items-center gap-4">
          <StatusMetric label="Active" value={`${metrics.totalActive}/${displayAgents.length}`} />
          <StatusMetric label="Avg. Performance" value={`${metrics.averagePerformance}%`} />
          <StatusMetric label="Uptime" value={metrics.totalUptime} />
        </div>
      </div>

      <div className="space-y-4">
        {displayAgents.length > 0 ? (
          displayAgents.map(agent => (
            <AgentStatusCard 
              key={agent.id} 
              agent={agent}
              onSelect={() => onSelectAgent(agent.id)}
              onActivate={activateAgent}
              onDeactivate={deactivateAgent}
            />
          ))
        ) : (
          <div className="text-center p-6 border border-dashed rounded-lg">
            <Bot className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <h3 className="font-medium text-lg mb-1">No Active Agents</h3>
            <p className="text-muted-foreground mb-4">Create an agent to get started with automation</p>
            <Button size="sm" variant="secondary">Create Agent</Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function StatusMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

interface AgentStatusCardProps {
  agent: Agent;
  onSelect: () => void;
  onActivate: (id: string) => void;
  onDeactivate: (id: string) => void;
}

function AgentStatusCard({ agent, onSelect, onActivate, onDeactivate }: AgentStatusCardProps) {
  const statusColors = {
    active: 'text-green-500',
    idle: 'text-yellow-500',
    error: 'text-red-500',
    inactive: 'text-gray-400',
    training: 'text-blue-500',
    paused: 'text-amber-500'
  };

  const statusIcons = {
    active: <Play className="h-4 w-4" />,
    idle: <Pause className="h-4 w-4" />,
    error: <AlertCircle className="h-4 w-4" />,
    inactive: <Pause className="h-4 w-4" />,
    training: <Activity className="h-4 w-4" />,
    paused: <Pause className="h-4 w-4" />
  };

  const toggleActivation = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (agent.status === 'active') {
      onDeactivate(agent.id);
    } else {
      onActivate(agent.id);
    }
  };

  // Format uptime as "X hours ago"
  const uptime = formatDistanceToNow(new Date(agent.lastActive), { addSuffix: true });

  // Current task if any
  const currentTask = agent.status === 'active'
    ? "Processing tasks..."
    : agent.status === 'training'
    ? "Training in progress..."
    : undefined;

  return (
    <div
      onClick={onSelect}
      className="flex items-center justify-between bg-card border border-border rounded-lg p-4 hover:bg-accent/5 cursor-pointer transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <Bot className="h-10 w-10 text-primary" />
          <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background border border-border flex items-center justify-center ${statusColors[agent.status]}`}>
            {statusIcons[agent.status]}
          </div>
        </div>
        <div>
          <h3 className="font-medium">{agent.name}</h3>
          <p className="text-sm text-muted-foreground">{agent.type}</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {currentTask && (
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Current Task</div>
            <div className="text-sm">{currentTask}</div>
          </div>
        )}
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Last Active</div>
          <div className="text-sm">{uptime}</div>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium">{agent.metrics.performance}%</span>
        </div>
        <Button 
          variant={agent.status === 'active' ? 'destructive' : 'secondary'} 
          size="sm"
          onClick={toggleActivation}
        >
          {agent.status === 'active' ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
    </div>
  );
} 