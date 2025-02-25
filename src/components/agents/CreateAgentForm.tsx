import React, { useState } from 'react';
import { useAgentStore } from '../../store/agentStore';
import type { AgentType, AutonomyLevel } from '../../store/agentStore';

interface CreateAgentFormProps {
  onClose: () => void;
}

export function CreateAgentForm({ onClose }: CreateAgentFormProps) {
  const addAgent = useAgentStore(state => state.addAgent);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'custom' as AgentType,
    autonomyLevel: 'supervised' as AutonomyLevel,
    capabilities: [] as string[],
    permissions: {
      canRead: [] as string[],
      canWrite: [] as string[],
      canExecute: [] as string[]
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addAgent({
      ...formData,
      status: 'training',
      metrics: {
        tasksCompleted: 0,
        accuracy: 1,
        responseTime: '0ms',
        lastActive: new Date()
      },
      config: {
        modelName: 'gpt-4',
        maxTokens: 2000,
        temperature: 0.7
      }
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-2 border rounded-lg"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full p-2 border rounded-lg"
          rows={3}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Type</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as AgentType })}
          className="w-full p-2 border rounded-lg"
        >
          <option value="email">Email Assistant</option>
          <option value="document">Document Processor</option>
          <option value="calendar">Calendar Manager</option>
          <option value="task">Task Manager</option>
          <option value="research">Research Assistant</option>
          <option value="custom">Custom Agent</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Initial Autonomy Level</label>
        <select
          value={formData.autonomyLevel}
          onChange={(e) => setFormData({ ...formData, autonomyLevel: e.target.value as AutonomyLevel })}
          className="w-full p-2 border rounded-lg"
        >
          <option value="supervised">Supervised</option>
          <option value="semi-autonomous">Semi-Autonomous</option>
          <option value="autonomous">Autonomous</option>
        </select>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create Agent
        </button>
      </div>
    </form>
  );
} 