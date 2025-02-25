import React, { useState, useEffect } from 'react';
import { Bot, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AILayout } from '../components/layout/AILayout';
import { ActiveAgentsPanel } from '../components/ai/ActiveAgentsPanel';
import { AnalyticsPanel } from '../components/ai/AnalyticsPanel';
import { AgentSuggestionPanel } from '../components/agents/AgentSuggestionPanel';
import { AgentSettingsPanel } from '../components/ai/AgentSettingsPanel';

interface AgentMetrics {
  totalAgents: number;
  activeAgents: number;
  completedTasks: number;
  successRate: number;
  averageResponseTime: number;
  lastAction: {
    agentId: string;
    action: string;
    timestamp: string;
  } | undefined;
}

interface AgentPattern {
  id: string;
  name: string;
  description: string;
  type: string;
  capabilities: string[];
}

interface AgentSettings {
  id: string;
  name: string;
  type: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  allowedAPIs: string[];
  rateLimit: number;
  isActive: boolean;
}

export function AIAgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AgentMetrics>({
    totalAgents: 12,
    activeAgents: 5,
    completedTasks: 156,
    successRate: 98.5,
    averageResponseTime: 1.2,
    lastAction: {
      agentId: 'agent-1',
      action: 'Completed task: Data analysis',
      timestamp: new Date().toISOString()
    }
  });

  const [selectedAgentSettings, setSelectedAgentSettings] = useState<AgentSettings | null>(null);

  useEffect(() => {
    if (selectedAgent) {
      // In a real app, fetch the agent settings from an API
      setSelectedAgentSettings({
        id: selectedAgent,
        name: 'Data Analysis Agent',
        type: 'analysis',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2048,
        systemPrompt: 'You are a data analysis assistant...',
        allowedAPIs: ['OpenAI', 'HuggingFace'],
        rateLimit: 10,
        isActive: true
      });
    } else {
      setSelectedAgentSettings(null);
    }
  }, [selectedAgent]);

  const handleSaveSettings = (settings: AgentSettings) => {
    // In a real app, save the settings to an API
    console.log('Saving settings:', settings);
    setSelectedAgentSettings(settings);
  };

  const handleDeleteAgent = (id: string) => {
    // In a real app, delete the agent via API
    console.log('Deleting agent:', id);
    setSelectedAgent(null);
    setSelectedAgentSettings(null);
  };

  const actions = (
    <Button variant="outline" className="gap-2">
      <Plus className="h-4 w-4" />
      New Agent
    </Button>
  );

  return (
    <AILayout 
      title="AI Agents" 
      icon={<Bot />}
      actions={actions}
    >
      <div className="grid grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="col-span-8 space-y-6">
          <ActiveAgentsPanel onSelectAgent={setSelectedAgent} />
          {selectedAgentSettings ? (
            <AgentSettingsPanel 
              settings={selectedAgentSettings}
              onSave={handleSaveSettings}
              onDelete={handleDeleteAgent}
            />
          ) : (
            <AnalyticsPanel />
          )}
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-6">
          <AgentSuggestionPanel 
            patterns={[
              { 
                id: '1', 
                name: 'Data Analysis', 
                description: 'Process and analyze data sets',
                type: 'analysis',
                capabilities: ['data processing', 'statistical analysis', 'visualization']
              },
              { 
                id: '2', 
                name: 'Customer Support', 
                description: 'Handle customer inquiries',
                type: 'support',
                capabilities: ['chat', 'email', 'ticket management']
              },
              { 
                id: '3', 
                name: 'Code Review', 
                description: 'Review and suggest code improvements',
                type: 'development',
                capabilities: ['code analysis', 'best practices', 'security review']
              }
            ]}
            onCreateAgent={(pattern: AgentPattern) => console.log('Create agent from pattern:', pattern)}
          />
        </div>
      </div>
    </AILayout>
  );
} 