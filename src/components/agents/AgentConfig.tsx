import React, { useState } from 'react';
import { Agent } from '../../types/agents';
import { useAgentStore } from '../../store/agentStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Slider } from '../ui/Slider';
import { Switch } from '../ui/Switch';
import { Save, RefreshCw } from 'lucide-react';

interface AgentConfigProps {
  agent: Agent;
}

export function AgentConfig({ agent }: AgentConfigProps) {
  const { updateAgent } = useAgentStore();
  const [config, setConfig] = useState(agent.config);
  const [isDirty, setIsDirty] = useState(false);

  const handleSave = async () => {
    await updateAgent(agent.id, { config });
    setIsDirty(false);
  };

  const updateConfig = (updates: Partial<typeof config>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  };

  return (
    <div className="space-y-8">
      {/* Model Configuration */}
      <div>
        <h3 className="text-lg font-medium mb-4">Model Configuration</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm text-white/60">Model</label>
            <Select
              value={config.modelName}
              onChange={(value) => updateConfig({ modelName: value })}
              options={[
                { label: 'GPT-4 Turbo', value: 'gpt-4-turbo-preview' },
                { label: 'GPT-4', value: 'gpt-4' },
                { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
              ]}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-white/60">Context Window</label>
            <Select
              value={config.contextWindow.toString()}
              onChange={(value) => updateConfig({ contextWindow: parseInt(value) })}
              options={[
                { label: '4K tokens', value: '4096' },
                { label: '8K tokens', value: '8192' },
                { label: '16K tokens', value: '16384' },
                { label: '32K tokens', value: '32768' },
              ]}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-white/60">Temperature</label>
            <Slider
              value={[config.temperature]}
              min={0}
              max={2}
              step={0.1}
              onValueChange={([value]) => updateConfig({ temperature: value })}
            />
            <div className="flex justify-between text-xs text-white/40">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-white/60">Max Tokens</label>
            <Input
              type="number"
              value={config.maxTokens}
              onChange={(e) => updateConfig({ maxTokens: parseInt(e.target.value) })}
              min={1}
              max={32768}
            />
          </div>
        </div>
      </div>

      {/* Behavior Settings */}
      <div>
        <h3 className="text-lg font-medium mb-4">Behavior Settings</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm text-white/60">Autonomy Level</label>
            <Select
              value={config.autonomyLevel}
              onChange={(value) => updateConfig({ autonomyLevel: value })}
              options={[
                { label: 'Supervised', value: 'supervised' },
                { label: 'Semi-Autonomous', value: 'semi-autonomous' },
                { label: 'Autonomous', value: 'autonomous' },
              ]}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/60">Auto-Learning</label>
              <Switch
                checked={config.autoLearning}
                onCheckedChange={(checked) => updateConfig({ autoLearning: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/60">Proactive Mode</label>
              <Switch
                checked={config.proactiveMode}
                onCheckedChange={(checked) => updateConfig({ proactiveMode: checked })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* System Prompt */}
      <div>
        <h3 className="text-lg font-medium mb-4">System Prompt</h3>
        <textarea
          value={config.basePrompt}
          onChange={(e) => updateConfig({ basePrompt: e.target.value })}
          className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-3 text-sm"
          placeholder="Enter the base system prompt for this agent..."
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => setConfig(agent.config)}
          disabled={!isDirty}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <Button
          onClick={handleSave}
          disabled={!isDirty}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
} 