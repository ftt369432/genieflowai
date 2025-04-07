import React, { useState, useEffect } from 'react';
import { Brain, Plus, Settings, Activity, Zap, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AgentSuggestionPanel } from '../components/agents/AgentSuggestionPanel';
import { ActiveAgentsPanel } from '../components/ai/ActiveAgentsPanel';
import { useAgentStore } from '../store/agentStore';
import { useNavigate } from 'react-router-dom';
import type { Agent, AgentType, AgentCapability } from '../types/agent';

export function AgentsPageComponent() {
  const { 
    agents, 
    createAgent, 
    activateAgent, 
    deactivateAgent,
    selectedAgentId,
    selectAgent 
  } = useAgentStore();
  
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate metrics from actual agent data
  const metrics = {
    totalAgents: agents.length,
    activeAgents: agents.filter(a => a.status === 'active').length,
    averagePerformance: agents.length > 0 
      ? Math.round(agents.reduce((acc, curr) => acc + curr.metrics.performance, 0) / agents.length)
      : 0,
    totalTasks: agents.reduce((acc, curr) => acc + curr.metrics.tasks.total, 0)
  };

  // Handle selecting an agent to view details
  const handleSelectAgent = (id: string) => {
    selectAgent(id);
    navigate(`/agents/${id}`);
  };

  // Handle creating a new agent from template
  const handleCreateAgent = (template: any) => {
    // Convert template capabilities to proper format for our agent store
    const capabilities = template.capabilities.map((cap: string) => {
      return cap.toLowerCase().replace(/\s+/g, '-') as AgentCapability;
    });
    
    createAgent(template.name, template.type as AgentType, capabilities);
  };

  // Filter agents based on search query
  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">AI Agents</h1>
          <p className="text-muted-foreground">Manage and monitor your AI workforce</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => navigate('/agent-wizard')}>
          <Plus className="w-4 h-4" />
          New Agent
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search agents..."
            className="w-full pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{metrics.totalAgents}</div>
              <div className="text-sm text-muted-foreground">Total Agents</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Activity className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{metrics.activeAgents}</div>
              <div className="text-sm text-muted-foreground">Active Agents</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Zap className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{metrics.averagePerformance}%</div>
              <div className="text-sm text-muted-foreground">Avg. Performance</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{metrics.totalTasks}</div>
              <div className="text-sm text-muted-foreground">Total Tasks</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Agents */}
        <div className="lg:col-span-2">
          <ActiveAgentsPanel 
            onSelectAgent={handleSelectAgent}
          />
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
                  },
                  {
                    id: 'analyst',
                    name: 'Data Analyst',
                    description: 'Analyzes data and generates insights',
                    type: 'analysis',
                    capabilities: ['Data Processing', 'Visualization', 'Statistical Analysis']
                  },
                  {
                    id: 'email',
                    name: 'Email Assistant',
                    description: 'Manages and processes emails',
                    type: 'email',
                    capabilities: ['Email Processing', 'Drafting', 'Task Management']
                  },
                  {
                    id: 'document',
                    name: 'Document Processor',
                    description: 'Analyzes and extracts information from documents',
                    type: 'document', 
                    capabilities: ['Document Analysis', 'Data Extraction', 'Summarization']
                  }
                ]}
                onCreateAgent={handleCreateAgent}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// For backward compatibility
export const AIAgentsPage = AgentsPageComponent; 