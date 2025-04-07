import React, { useState } from 'react';
import { useAssistantStore } from '../../store/assistantStore';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { AIAssistant } from '../../types/ai';
import { PlusCircle, Edit, Trash2, MessageSquare, FolderOpen } from 'lucide-react';
import { AssistantConfig } from './AssistantConfig';

interface AssistantListProps {
  onSelectAssistant?: (assistant: AIAssistant) => void;
  onCreateAssistant?: () => void;
}

export function AssistantList({ onSelectAssistant, onCreateAssistant }: AssistantListProps) {
  const { assistants, removeAssistant, getAssistantFolders } = useAssistantStore();
  const { folders } = useKnowledgeBaseStore();
  
  const [editingAssistantId, setEditingAssistantId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
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
  
  // Handle save after editing or creating
  const handleSave = () => {
    setEditingAssistantId(null);
    setIsCreating(false);
  };
  
  // Handle cancel
  const handleCancel = () => {
    setEditingAssistantId(null);
    setIsCreating(false);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Assistants</h2>
        <Button onClick={handleCreateAssistant} className="flex items-center gap-1">
          <PlusCircle className="h-4 w-4" />
          New Assistant
        </Button>
      </div>
      
      {isCreating && (
        <AssistantConfig 
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
      
      {editingAssistantId && (
        <AssistantConfig 
          assistantId={editingAssistantId}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assistants.length > 0 ? (
          assistants.map(assistant => (
            <Card 
              key={assistant.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleSelectAssistant(assistant)}
            >
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-semibold">{assistant.name}</h3>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => handleEdit(assistant.id, e)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => handleDelete(assistant.id, e)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              
              {assistant.description && (
                <p className="text-muted-foreground text-sm mt-1">{assistant.description}</p>
              )}
              
              <div className="flex items-center gap-1 mt-3 text-sm text-muted-foreground">
                <FolderOpen className="h-4 w-4" />
                <span>{getAssistantFolderNames(assistant.id)}</span>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4 w-full flex items-center justify-center gap-2"
                onClick={() => handleSelectAssistant(assistant)}
              >
                <MessageSquare className="h-4 w-4" />
                Chat with this assistant
              </Button>
            </Card>
          ))
        ) : (
          !isCreating && (
            <div className="col-span-full flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/10">
              <p className="text-muted-foreground mb-4">You haven't created any assistants yet.</p>
              <Button onClick={handleCreateAssistant}>Create Your First Assistant</Button>
            </div>
          )
        )}
      </div>
    </div>
  );
} 