import React from 'react';
import { Select } from '../ui/Select';
import type { AIModel } from '../../types/ai';

interface AIModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function AIModelSelector({ selectedModel, onModelChange }: AIModelSelectorProps) {
  const models = [
    { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
  ];

  return (
    <select 
      value={selectedModel}
      onChange={(e) => onModelChange(e.target.value)}
      className="p-2 border rounded-lg"
    >
      {models.map(model => (
        <option key={model.id} value={model.id}>
          {model.name}
        </option>
      ))}
    </select>
  );
} 