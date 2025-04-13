import React, { useEffect } from 'react';
import { useAssistantStore } from '../../store/assistantStore';
import { AIAssistant } from '../../types/ai';
import { Card } from '../ui/Card';
import { Gavel, Stethoscope, Brain } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface QuickAccessAssistantsProps {
  onSelectAssistant: (assistant: AIAssistant) => void;
  selectedAssistantId?: string | null;
}

/**
 * Component that displays quick access assistants in the AI Assistant page left sidebar
 */
export function QuickAccessAssistants({ onSelectAssistant, selectedAssistantId }: QuickAccessAssistantsProps) {
  const { assistants, addTemplateAssistants } = useAssistantStore();

  // Initialize with template assistants if needed
  useEffect(() => {
    addTemplateAssistants();
  }, [addTemplateAssistants]);

  // Get the icon for each assistant type
  const getAssistantIcon = (assistant: AIAssistant) => {
    const name = assistant.name.toLowerCase();
    
    if (name.includes('attorney') || name.includes('legal')) {
      return <Gavel className="h-4 w-4 text-blue-700" />;
    } else if (name.includes('medical') || name.includes('health')) {
      return <Stethoscope className="h-4 w-4 text-emerald-600" />;
    } else {
      return <Brain className="h-4 w-4 text-purple-500" />;
    }
  };

  return (
    <div className="space-y-3 pb-4">
      <h3 className="text-sm font-medium px-3">Quick Access Assistants</h3>
      
      <div className="space-y-2 px-2">
        {assistants
          .filter(assistant => 
            assistant.name.includes('Attorney') || 
            assistant.name.includes('Medical') ||
            assistant.name.includes('Research'))
          .map(assistant => (
            <Button
              key={assistant.id}
              variant="ghost"
              className={cn(
                "w-full justify-start text-sm gap-2 h-auto py-2 px-3",
                selectedAssistantId === assistant.id ? 
                  "bg-muted font-medium" : 
                  "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => onSelectAssistant(assistant)}
            >
              {getAssistantIcon(assistant)}
              <span className="truncate">{assistant.name}</span>
            </Button>
          ))}
      </div>
    </div>
  );
} 