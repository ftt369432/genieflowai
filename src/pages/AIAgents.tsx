/**
 * @deprecated This component is deprecated. Please use AgentsPageComponent from src/pages/AgentsPage.tsx instead.
 * This component is kept for backward compatibility but will be removed in a future version.
 */

import React, { useState, useEffect } from 'react';
import { useAgentStore } from '../store/agentStore';
import { Bot, Plus, Settings, Activity, Zap, Search, Brain, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AgentSuggestionPanel } from '../components/agents/AgentSuggestionPanel';
import { ActiveAgentsPanel } from '../components/ai/ActiveAgentsPanel';
import { AgentSettingsPanel } from '../components/ai/AgentSettingsPanel';
import { AgentChat } from '../components/agents/AgentChat';
import { AnalyticsPanel } from '../components/ai/AnalyticsPanel';
import type { Agent, AgentType, AgentStatus, AutonomyLevel } from '../types/agent';

/**
 * @deprecated Use AgentsPageComponent from src/pages/AgentsPage.tsx instead
 */
export function AIAgentsPage() {
  // Add deprecation warning
  useEffect(() => {
    console.warn('Warning: AIAgentsPage component is deprecated. Please use AgentsPageComponent from src/pages/AgentsPage.tsx instead.');
  }, []);

  const {
    agents,
    addAgent,
    updateAgent,
    removeAgent,
    activateAgent,
    deactivateAgent,
    executeAction
  } = useAgentStore();

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const metrics = {
    totalAgents: agents.length,
    activeAgents: agents.filter(a => a.status === 'active').length,
    averagePerformance: Math.round(
      agents.reduce((acc, curr) => acc + curr.performance, 0) / agents.length
    ),
    totalTasks: agents.reduce((acc, curr) => acc + curr.tasks.total, 0)
  };

  const handleCreateAgent = async (template: AgentType) => {
    const newAgent: Omit<Agent, 'id' | 'metrics'> = {
      name: `${template} Agent`,
      type: template,
      status: 'idle',
      autonomyLevel: 'supervised',
      capabilities: getDefaultCapabilities(template),
      config: getDefaultConfig(template),
      tasks: { completed: 0, total: 0 },
      performance: 0,
      lastActive: new Date()
    };

    await addAgent(newAgent);
  };

  const handleAgentAction = async (agentId: string, action: string, input: any) => {
    try {
      const result = await executeAction(agentId, action, input);
      // Handle result (e.g., update UI, show notification)
    } catch (error) {
      console.error('Error executing agent action:', error);
    }
  };

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">AI Agents</h1>
          <p className="text-muted-foreground">Manage and monitor your AI workforce</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-5 w-5" />
          </Button>
          <Button onClick={() => handleCreateAgent('assistant')}>
            <Plus className="h-4 w-4 mr-2" />
            New Agent
          </Button>
        </div>
      </div>

      {/* Search and Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium">Active Agents</span>
              </div>
              <span className="text-2xl font-bold">{metrics.activeAgents}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium">Success Rate</span>
              </div>
              <span className="text-2xl font-bold">{metrics.averagePerformance}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Agents */}
        <div className="lg:col-span-2 space-y-6">
          <ActiveAgentsPanel
            agents={filteredAgents}
            onSelectAgent={setSelectedAgent}
            onActivate={activateAgent}
            onDeactivate={deactivateAgent}
          />
          
          {selectedAgent && (
            <Card>
              <CardHeader>
                <CardTitle>Agent Interaction</CardTitle>
                <CardDescription>Chat with {selectedAgent.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <AgentChat
                  agent={selectedAgent}
                  onAction={handleAgentAction}
                />
              </CardContent>
            </Card>
          )}

          <AnalyticsPanel agents={agents} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {showSettings && selectedAgent ? (
            <AgentSettingsPanel
              settings={{
                ...selectedAgent,
                onSave: (updates) => updateAgent(selectedAgent.id, updates),
                onDelete: () => {
                  removeAgent(selectedAgent.id);
                  setSelectedAgent(null);
                }
              }}
            />
          ) : (
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
                    }
                  ]}
                  onCreateAgent={handleCreateAgent}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function getDefaultCapabilities(type: AgentType): string[] {
  switch (type) {
    case 'assistant':
      return ['Chat', 'Task Management', 'Knowledge Base Access'];
    case 'research':
      return ['Web Search', 'Data Analysis', 'Report Generation'];
    case 'development':
      return ['Code Generation', 'Code Review', 'Debugging'];
    case 'analysis':
      return ['Data Processing', 'Visualization', 'Statistical Analysis'];
    default:
      return ['Chat'];
  }
}

function getDefaultConfig(type: AgentType) {
  return {
    model: 'gemini-pro',
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: getDefaultSystemPrompt(type)
  };
}

function getDefaultSystemPrompt(type: AgentType): string {
  switch (type) {
    case 'assistant':
      return 'You are a helpful AI assistant. Help users with their tasks and questions.';
    case 'research':
      return 'You are a research assistant. Help users find and analyze information.';
    case 'development':
      return 'You are a code assistant. Help users with programming and development tasks.';
    case 'analysis':
      return 'You are a data analyst. Help users process and analyze data.';
    default:
      return 'You are a helpful AI assistant.';
  }
} 