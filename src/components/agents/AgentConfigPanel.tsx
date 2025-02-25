import React from 'react';
import { Settings, Shield, Zap } from 'lucide-react';
import { Card } from '../ui/Card';
import { useAgentStore } from '../../store/agentStore';
import type { Agent, AutonomyLevel } from '../../types/agents';

interface AgentConfigPanelProps {
  agent: Agent;
  onUpdate: (updates: Partial<Agent>) => void;
}

export function AgentConfigPanel({ agent, onUpdate }: AgentConfigPanelProps) {
  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Model Configuration
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Model</label>
            <select 
              value={agent.config.modelName}
              onChange={(e) => onUpdate({ config: { ...agent.config, modelName: e.target.value }})}
              className="w-full p-2 border rounded-lg"
            >
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="claude-2">Claude 2</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Temperature</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={agent.config.temperature}
              onChange={(e) => onUpdate({ 
                config: { ...agent.config, temperature: parseFloat(e.target.value) }
              })}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Permissions
        </h3>
        <div className="space-y-4">
          {Object.entries(agent.permissions).map(([key, values]) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1">
                {key.replace('can', 'Can ').replace(/([A-Z])/g, ' $1').trim()}
              </label>
              <select
                multiple
                value={values}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                  onUpdate({
                    permissions: { ...agent.permissions, [key]: selected }
                  });
                }}
                className="w-full p-2 border rounded-lg"
              >
                {getPermissionOptions(key).map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Capabilities
        </h3>
        <div className="space-y-2">
          {availableCapabilities.map(capability => (
            <label key={capability} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={agent.capabilities.includes(capability)}
                onChange={(e) => {
                  const newCapabilities = e.target.checked
                    ? [...agent.capabilities, capability]
                    : agent.capabilities.filter(c => c !== capability);
                  onUpdate({ capabilities: newCapabilities });
                }}
              />
              <span>{capability}</span>
            </label>
          ))}
        </div>
      </Card>
    </div>
  );
}

const availableCapabilities = [
  'document-processing',
  'email-management',
  'calendar-scheduling',
  'task-automation',
  'data-analysis',
  'communication',
  'research'
];

function getPermissionOptions(type: string): string[] {
  switch (type) {
    case 'canRead':
      return ['emails', 'documents', 'calendar', 'contacts', 'tasks'];
    case 'canWrite':
      return ['email-drafts', 'documents', 'calendar-events', 'tasks'];
    case 'canExecute':
      return ['send-emails', 'schedule-meetings', 'create-tasks', 'analyze-data'];
    default:
      return [];
  }
} 