import React, { useState } from 'react';
import { Brain, Plus, Settings, Activity, Zap, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AgentSuggestionPanel } from '../components/agents/AgentSuggestionPanel';
import { ActiveAgentsPanel } from '../components/ai/ActiveAgentsPanel';

interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'idle' | 'error';
  lastActive: Date;
  tasks: {
    completed: number;
    total: number;
  };
  performance: number;
}

export function AIAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: '1',
      name: 'Data Analyzer',
      type: 'Analysis',
      status: 'active',
      lastActive: new Date(),
      tasks: { completed: 45, total: 50 },
      performance: 95
    },
    {
      id: '2',
      name: 'Code Assistant',
      type: 'Development',
      status: 'idle',
      lastActive: new Date(Date.now() - 3600000),
      tasks: { completed: 120, total: 150 },
      performance: 88
    },
    {
      id: '3',
      name: 'Research Bot',
      type: 'Research',
      status: 'active',
      lastActive: new Date(),
      tasks: { completed: 75, total: 80 },
      performance: 92
    }
  ]);

  const metrics = {
    totalAgents: agents.length,
    activeAgents: agents.filter(a => a.status === 'active').length,
    averagePerformance: Math.round(
      agents.reduce((acc, curr) => acc + curr.performance, 0) / agents.length
    ),
    totalTasks: agents.reduce((acc, curr) => acc + curr.tasks.total, 0)
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">AI Agents</h1>
          <p className="text-text-secondary">Manage and monitor your AI workforce</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Agent
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search agents..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-paper text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <Button variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{metrics.totalAgents}</div>
              <div className="text-sm text-text-secondary">Total Agents</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <Activity className="w-5 h-5 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{metrics.activeAgents}</div>
              <div className="text-sm text-text-secondary">Active Agents</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Zap className="w-5 h-5 text-warning" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{metrics.averagePerformance}%</div>
              <div className="text-sm text-text-secondary">Avg. Performance</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <Activity className="w-5 h-5 text-info" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{metrics.totalTasks}</div>
              <div className="text-sm text-text-secondary">Total Tasks</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Agents */}
        <div className="lg:col-span-2">
          <ActiveAgentsPanel onSelectAgent={(id) => console.log('Selected agent:', id)} />
        </div>

        {/* Agent Suggestions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Templates</CardTitle>
              <CardDescription>Quick-start with pre-configured agents</CardDescription>
            </CardHeader>
            <CardContent>
              <AgentSuggestionPanel
                patterns={[
                  {
                    id: 'researcher',
                    name: 'Research Assistant',
                    description: 'Helps with research and data analysis',
                    type: 'research',
                    capabilities: ['Web Search', 'Data Analysis', 'Report Generation']
                  },
                  {
                    id: 'coder',
                    name: 'Code Assistant',
                    description: 'Helps with coding and development',
                    type: 'development',
                    capabilities: ['Code Generation', 'Code Review', 'Debugging']
                  }
                ]}
                onCreateAgent={(pattern) => console.log('Create agent:', pattern)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 