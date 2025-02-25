import React from 'react';
import { Activity, Play, Pause, Bot, Zap } from 'lucide-react';
import { Button } from '../ui/Button';

interface AgentStatus {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'idle' | 'error';
  currentTask?: string;
  uptime: string;
  performance: number;
}

interface ActiveAgentsPanelProps {
  onSelectAgent: (agentId: string) => void;
}

export function ActiveAgentsPanel({ onSelectAgent }: ActiveAgentsPanelProps) {
  const activeAgents: AgentStatus[] = [
    {
      id: 'agent-1',
      name: 'Data Analyzer',
      type: 'Analysis',
      status: 'active',
      currentTask: 'Processing Q3 sales data',
      uptime: '2h 15m',
      performance: 95
    },
    {
      id: 'agent-2',
      name: 'Support Bot',
      type: 'Support',
      status: 'idle',
      uptime: '45m',
      performance: 88
    },
    {
      id: 'agent-3',
      name: 'Code Reviewer',
      type: 'Development',
      status: 'error',
      currentTask: 'Review failed: timeout',
      uptime: '5h 30m',
      performance: 75
    }
  ];

  const metrics = {
    totalActive: activeAgents.filter(a => a.status === 'active').length,
    averagePerformance: Math.round(
      activeAgents.reduce((acc, curr) => acc + curr.performance, 0) / activeAgents.length
    ),
    totalUptime: '8h 30m'
  };

  return (
    <div className="bg-cyberpunk-dark/50 border border-cyberpunk-neon/30 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-cyberpunk-neon" />
          <h2 className="text-lg font-bold text-white">Active Agents</h2>
        </div>
        <div className="flex items-center gap-4">
          <StatusMetric label="Active" value={`${metrics.totalActive}/3`} />
          <StatusMetric label="Avg. Performance" value={`${metrics.averagePerformance}%`} />
          <StatusMetric label="Total Uptime" value={metrics.totalUptime} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {activeAgents.map(agent => (
          <AgentStatusCard 
            key={agent.id} 
            agent={agent}
            onSelect={() => onSelectAgent(agent.id)}
          />
        ))}
      </div>
    </div>
  );
}

function StatusMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-400">{label}:</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}

function AgentStatusCard({ agent, onSelect }: { agent: AgentStatus; onSelect: () => void }) {
  const statusColors = {
    active: 'text-green-400',
    idle: 'text-yellow-400',
    error: 'text-red-400'
  };

  const statusIcons = {
    active: <Play className="h-4 w-4" />,
    idle: <Pause className="h-4 w-4" />,
    error: <Activity className="h-4 w-4" />
  };

  return (
    <button
      onClick={onSelect}
      className="w-full text-left bg-cyberpunk-dark/30 border border-cyberpunk-neon/20 rounded-lg p-4 hover:bg-cyberpunk-neon/10 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bot className="h-8 w-8 text-cyberpunk-neon" />
            <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-cyberpunk-dark/30 border border-cyberpunk-neon/20 flex items-center justify-center ${statusColors[agent.status]}`}>
              {statusIcons[agent.status]}
            </div>
          </div>
          <div>
            <h3 className="font-medium text-white">{agent.name}</h3>
            <p className="text-sm text-gray-400">{agent.type}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {agent.currentTask && (
            <div className="text-right">
              <div className="text-sm text-gray-400">Current Task</div>
              <div className="text-sm text-white">{agent.currentTask}</div>
            </div>
          )}
          <div className="text-right">
            <div className="text-sm text-gray-400">Uptime</div>
            <div className="text-sm text-white">{agent.uptime}</div>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyberpunk-neon" />
            <span className="text-sm font-medium text-white">{agent.performance}%</span>
          </div>
        </div>
      </div>
    </button>
  );
} 