import React, { useState, useEffect } from 'react';
import { AssistantList } from '../components/assistants/AssistantList';
import { AssistantChat } from '../components/assistants/AssistantChat';
import { AssistantConfig } from '../components/assistants/AssistantConfig';
import { InteractiveAssistantCreator } from '../components/assistants/InteractiveAssistantCreator';
import { useAssistantStore } from '../store/assistantStore';
import { AIAssistant } from '../types/ai';
import { Button } from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

export function AssistantsPage() {
  const [selectedAssistant, setSelectedAssistant] = useState<AIAssistant | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isInteractiveMode, setIsInteractiveMode] = useState(false);
  
  // Listen for custom event to trigger interactive assistant creation
  useEffect(() => {
    const handleCreateInteractiveEvent = (event: CustomEvent) => {
      console.log("Received createInteractiveAssistant event", event.detail);
      setIsCreating(true);
      setSelectedAssistant(null);
      setIsInteractiveMode(true);
    };

    // Debug
    console.log("Setting up event listener for createInteractiveAssistant");
    
    window.addEventListener('createInteractiveAssistant', handleCreateInteractiveEvent as EventListener);
    
    return () => {
      window.removeEventListener('createInteractiveAssistant', handleCreateInteractiveEvent as EventListener);
    };
  }, []);
  
  const handleSelectAssistant = (assistant: AIAssistant) => {
    setSelectedAssistant(assistant);
    setIsCreating(false);
    setIsInteractiveMode(false);
  };
  
  const handleCreateAssistant = () => {
    setIsCreating(true);
    setSelectedAssistant(null);
    setIsInteractiveMode(false);
  };
  
  const handleInteractiveCreate = () => {
    setIsCreating(true);
    setSelectedAssistant(null);
    setIsInteractiveMode(true);
  };
  
  const handleBack = () => {
    setSelectedAssistant(null);
    setIsCreating(false);
    setIsInteractiveMode(false);
  };
  
  const handleSaveNewAssistant = (assistant: AIAssistant) => {
    setIsCreating(false);
    setIsInteractiveMode(false);
    setSelectedAssistant(assistant);
  };
  
  return (
    <div className="container mx-auto p-4 h-full flex flex-col">
      <h1 className="text-3xl font-bold mb-6">AI Assistants</h1>
      
      <div className="flex-1 overflow-hidden">
        {isCreating ? (
          <div className="h-full overflow-y-auto">
            <Button 
              onClick={handleBack}
              variant="ghost"
              className="mb-4 flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              <span>Back to assistants</span>
            </Button>
            
            {isInteractiveMode ? (
              <InteractiveAssistantCreator 
                onSave={handleSaveNewAssistant} 
                onCancel={handleBack} 
              />
            ) : (
              <AssistantConfig 
                onSave={handleSaveNewAssistant} 
                onCancel={handleBack} 
              />
            )}
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