import React, { useState } from 'react';
import { AssistantList } from '../components/assistants/AssistantList';
import { AssistantChat } from '../components/assistants/AssistantChat';
import { AssistantConfig } from '../components/assistants/AssistantConfig';
import { useAssistantStore } from '../store/assistantStore';
import { AIAssistant } from '../types/ai';

export function AssistantsPage() {
  const [selectedAssistant, setSelectedAssistant] = useState<AIAssistant | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const handleSelectAssistant = (assistant: AIAssistant) => {
    setSelectedAssistant(assistant);
    setIsCreating(false);
  };
  
  const handleCreateAssistant = () => {
    setIsCreating(true);
    setSelectedAssistant(null);
  };
  
  const handleBack = () => {
    setSelectedAssistant(null);
    setIsCreating(false);
  };
  
  const handleSaveNewAssistant = (assistant: AIAssistant) => {
    setIsCreating(false);
    setSelectedAssistant(assistant);
  };
  
  return (
    <div className="container mx-auto p-4 h-full flex flex-col">
      <h1 className="text-3xl font-bold mb-6">AI Assistants</h1>
      
      <div className="flex-1 overflow-hidden">
        {isCreating ? (
          <div className="h-full overflow-y-auto">
            <button 
              onClick={handleBack}
              className="mb-4 text-primary hover:underline flex items-center gap-1"
            >
              ← Back to assistants
            </button>
            <AssistantConfig onSave={handleSaveNewAssistant} onCancel={handleBack} />
          </div>
        ) : selectedAssistant ? (
          <div className="h-full">
            <AssistantChat 
              assistant={selectedAssistant} 
              onBack={handleBack} 
            />
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <AssistantList 
              onSelectAssistant={handleSelectAssistant}
              onCreateAssistant={handleCreateAssistant}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default AssistantsPage; 