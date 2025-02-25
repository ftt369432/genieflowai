import React, { useState } from 'react';
import { Agent } from '../../types/agents';
import { useAgentStore } from '../../store/agentStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Play, Pause, RefreshCw, Trash2 } from 'lucide-react';

interface AgentActionsProps {
  agent: Agent;
}

export function AgentActions({ agent }: AgentActionsProps) {
  const [input, setInput] = useState('');
  const { activateAgent, deactivateAgent, deleteAgent, executeAction } = useAgentStore();

  const handleExecute = async () => {
    if (!input.trim()) return;
    await executeAction(agent.id, 'process', input);
    setInput('');
  };

  return (
    <div className="space-y-6">
      {/* Action Controls */}
      <div className="flex items-center gap-4">
        {agent.status === 'active' ? (
          <Button
            onClick={() => deactivateAgent(agent.id)}
            variant="outline"
            className="gap-2 text-red-400 border-red-400/20 hover:bg-red-400/10"
          >
            <Pause className="w-4 h-4" />
            Deactivate
          </Button>
        ) : (
          <Button
            onClick={() => activateAgent(agent.id)}
            variant="outline"
            className="gap-2 text-green-400 border-green-400/20 hover:bg-green-400/10"
          >
            <Play className="w-4 h-4" />
            Activate
          </Button>
        )}
        
        <Button
          onClick={() => executeAction(agent.id, 'retrain', null)}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retrain
        </Button>
        
        <Button
          onClick={() => {
            if (confirm('Are you sure you want to delete this agent?')) {
              deleteAgent(agent.id);
            }
          }}
          variant="outline"
          className="gap-2 text-red-400 border-red-400/20 hover:bg-red-400/10 ml-auto"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </Button>
      </div>

      {/* Direct Input */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Direct Command</h3>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter a command or query..."
            className="flex-1"
          />
          <Button onClick={handleExecute}>
            Execute
          </Button>
        </div>
      </div>

      {/* Capabilities */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Capabilities</h3>
        <div className="flex flex-wrap gap-2">
          {agent.capabilities.map((cap, i) => (
            <span
              key={i}
              className="px-3 py-1 rounded-full bg-white/5 text-sm"
            >
              {cap}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
} 