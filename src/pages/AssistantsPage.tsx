import React, { useState } from 'react';
import { AssistantList } from '../components/assistants/AssistantList';
import { AssistantChat } from '../components/assistants/AssistantChat';
import { AssistantConfig } from '../components/assistants/AssistantConfig';
import { useAssistantStore } from '../store/assistantStore';
import { AIAssistant } from '../types/ai';

export function AssistantsPage() {
  const [selectedAssistant, setSelectedAssistant] = useState<AIAssistant | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const handleSelectAssistant = (assistant: AIAssistant) => {
    setSelectedAssistant(assistant);
    setIsCreating(false);
    setIsEditing(false);
  };
  
  const handleCreateAssistant = () => {
    setIsCreating(true);
    setSelectedAssistant(null);
    setIsEditing(false);
  };
  
  const handleEditAssistant = () => {
    setIsEditing(true);
    setIsCreating(false);
  };
  
  const handleBack = () => {
    setSelectedAssistant(null);
    setIsCreating(false);
    setIsEditing(false);
  };
  
  const handleSaveNewAssistant = (assistant: AIAssistant) => {
    setIsCreating(false);
    setIsEditing(false);
    setSelectedAssistant(assistant);
  };
  
  const handleSaveEditedAssistant = (assistant: AIAssistant) => {
    setIsEditing(false);
    setSelectedAssistant(assistant);
  };
  
  return (
    <div className="h-full flex flex-col">
      <h1 className="text-3xl font-bold mb-6 px-4 pt-4">AI Assistants</h1> 
      
      <div className="flex-1 overflow-hidden px-4 pb-4"> 
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
        ) : isEditing && selectedAssistant ? (
          <div className="h-full overflow-y-auto">
            <button 
              onClick={() => setIsEditing(false)}
              className="mb-4 text-primary hover:underline flex items-center gap-1"
            >
              ← Back to chat with {selectedAssistant.name}
            </button>
            <AssistantConfig 
              assistantId={selectedAssistant.id} 
              onSave={handleSaveEditedAssistant} 
              onCancel={() => setIsEditing(false)}
            />
          </div>
        ) : selectedAssistant ? (
          <div className="h-full">
            <AssistantChat 
              assistant={selectedAssistant} 
              onBack={handleBack} 
              onEdit={handleEditAssistant}
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