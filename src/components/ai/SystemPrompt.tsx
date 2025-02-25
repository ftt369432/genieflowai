import React from 'react';
import { Settings } from 'lucide-react';
import { Button } from '../ui/Button';

interface SystemPromptProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function SystemPrompt({ prompt, onPromptChange, isOpen, onToggle }: SystemPromptProps) {
  return (
    <div>
      <button 
        onClick={onToggle}
        className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
      >
        System Prompt
      </button>
      
      {isOpen && (
        <div className="absolute mt-2 p-4 bg-white border rounded-lg shadow-lg">
          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Enter system prompt..."
            className="w-full p-2 border rounded-lg"
            rows={4}
          />
        </div>
      )}
    </div>
  );
} 