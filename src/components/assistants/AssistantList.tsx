import React, { useState } from 'react';
import { useAssistantStore } from '../../store/assistantStore';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { PlusCircle, Edit, Trash, MessageSquare, Brain } from 'lucide-react';
import { InteractiveAssistantCreator } from './InteractiveAssistantCreator';
import type { AIAssistant } from '../../types/ai';

interface AssistantListProps {
  onSelectAssistant?: (assistant: AIAssistant) => void;
  onCreateAssistant?: () => void;
}

export function AssistantList({ onSelectAssistant, onCreateAssistant }: AssistantListProps) {
  const { assistants, removeAssistant, getAssistantFolders } = useAssistantStore();
  const { folders } = useKnowledgeBaseStore();
  
  const [editingAssistantId, setEditingAssistantId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isInteractiveMode, setIsInteractiveMode] = useState(false);
  
  // Function to display folder names assigned to an assistant
  const getAssistantFolderNames = (assistantId: string) => {
    const folderIds = getAssistantFolders(assistantId);
    const folderNames = folderIds.map(id => {
      const folder = folders.find(f => f.id === id);
      return folder ? folder.name : 'Unknown folder';
    });
    
    return folderNames.length > 0 
      ? folderNames.join(', ')
      : 'No folders assigned';
  };
  
  // Handle assistant deletion
  const handleDelete = (assistantId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this assistant?')) {
      removeAssistant(assistantId);
    }
  };
  
  // Handle assistant edit button
  const handleEdit = (assistantId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAssistantId(assistantId);
    setIsCreating(false);
    setIsInteractiveMode(true);
  };
  
  // Handle chat with assistant
  const handleSelectAssistant = (assistant: AIAssistant) => {
    if (onSelectAssistant) {
      onSelectAssistant(assistant);
    }
  };
  
  // Handle assistant creation
  const handleCreateAssistant = () => {
    setIsCreating(true);
    setEditingAssistantId(null);
    if (onCreateAssistant) {
      onCreateAssistant();
    }
  };
  
  // Handle interactive assistant creation
  const handleInteractiveCreate = () => {
    setIsCreating(true);
    setEditingAssistantId(null);
    setIsInteractiveMode(true);
  };
  
  // Handle save after editing or creating
  const handleSave = () => {
    setEditingAssistantId(null);
    setIsCreating(false);
    setIsInteractiveMode(false);
  };
  
  // Handle cancel
  const handleCancel = () => {
    setEditingAssistantId(null);
    setIsCreating(false);
    setIsInteractiveMode(false);
  };
  
  // If we're in editing or creating mode with interactive creator
  if (isInteractiveMode && (isCreating || editingAssistantId)) {
    return (
      <InteractiveAssistantCreator
        assistantId={editingAssistantId || undefined}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">AI Assistants</h2>
        <div className="flex gap-2">
          <Button 
            onClick={handleCreateAssistant}
            className="flex items-center gap-2"
          >
            <PlusCircle size={16} />
            <span>Quick Create</span>
          </Button>
          <Button 
            onClick={handleInteractiveCreate}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Brain size={16} />
            <span>Interactive Create</span>
          </Button>
        </div>
      </div>
      
      {assistants.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-muted">
          <p className="mb-4 text-muted-foreground">No assistants created yet.</p>
          <Button 
            onClick={handleInteractiveCreate}
            className="flex items-center gap-2 mx-auto"
          >
            <Brain size={16} />
            <span>Create Your First Assistant</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assistants.map(assistant => (
            <Card 
              key={assistant.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleSelectAssistant(assistant)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{assistant.name}</h3>
                    <p className="text-sm text-muted-foreground">{assistant.description || 'No description'}</p>
                    
                    <div className="mt-2">
                      <p className="text-xs font-medium mb-1">Knowledge Base:</p>
                      <p className="text-xs">{getAssistantFolderNames(assistant.id)}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2 h-8"
                      onClick={(e) => handleEdit(assistant.id, e)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2 h-8 text-destructive"
                      onClick={(e) => handleDelete(assistant.id, e)}
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full flex items-center justify-center gap-2"
                  onClick={() => handleSelectAssistant(assistant)}
                >
                  <MessageSquare size={16} />
                  <span>Chat with Assistant</span>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 