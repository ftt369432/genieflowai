import React, { useState, useEffect } from 'react';
import { useAssistantStore } from '../../store/assistantStore';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Card } from '../ui/Card';
import { Checkbox } from '../ui/Checkbox';
import { Label } from '../ui/Label';
import type { AIAssistant, AIModel, AIFolder } from '../../types/ai';

interface AssistantConfigProps {
  assistantId?: string;
  onSave?: (assistant: AIAssistant) => void;
  onCancel?: () => void;
}

export function AssistantConfig({ assistantId, onSave, onCancel }: AssistantConfigProps) {
  const { 
    assistants, 
    addAssistant, 
    updateAssistant, 
    getAssistantById,
    assignFolderToAssistant,
    removeFolderFromAssistant,
    getAssistantFolders
  } = useAssistantStore();
  
  const { folders } = useKnowledgeBaseStore();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // If editing an existing assistant, load its data
  useEffect(() => {
    if (assistantId) {
      const assistant = getAssistantById(assistantId);
      if (assistant) {
        setName(assistant.name);
        setDescription(assistant.description || '');
        setSystemPrompt(assistant.systemPrompt || '');
        setSelectedFolders(getAssistantFolders(assistantId));
      }
    }
  }, [assistantId, getAssistantById, getAssistantFolders]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Create a default AI model if needed (for simplicity)
      const defaultModel: AIModel = {
        id: 'default-model',
        name: 'Default Model',
        provider: 'openai',
        capabilities: ['text-generation', 'chat'],
        contextSize: 8192
      };
      
      if (assistantId) {
        // Update existing assistant
        updateAssistant(assistantId, {
          name,
          description,
          systemPrompt,
        });
        
        // Update folder assignments
        const currentFolders = getAssistantFolders(assistantId);
        
        // Remove folders that were deselected
        currentFolders.forEach(folderId => {
          if (!selectedFolders.includes(folderId)) {
            removeFolderFromAssistant(assistantId, folderId);
          }
        });
        
        // Add newly selected folders
        selectedFolders.forEach(folderId => {
          if (!currentFolders.includes(folderId)) {
            assignFolderToAssistant(assistantId, folderId);
          }
        });
        
        if (onSave) {
          const updatedAssistant = getAssistantById(assistantId);
          if (updatedAssistant) {
            onSave(updatedAssistant);
          }
        }
      } else {
        // Create new assistant
        const newAssistant = addAssistant({
          name,
          description,
          systemPrompt,
          model: defaultModel,
          settings: {
            temperature: 0.7,
            maxTokens: 2000
          }
        });
        
        // Assign selected folders
        selectedFolders.forEach(folderId => {
          assignFolderToAssistant(newAssistant.id, folderId);
        });
        
        if (onSave) {
          onSave(newAssistant);
        }
      }
    } catch (error) {
      console.error('Error saving assistant:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFolderToggle = (folderId: string) => {
    setSelectedFolders(prev => 
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };
  
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">
        {assistantId ? 'Edit Assistant' : 'Create New Assistant'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Assistant Name"
          />
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this assistant's purpose"
          />
        </div>
        
        <div>
          <Label htmlFor="systemPrompt">System Prompt</Label>
          <Textarea
            id="systemPrompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Instructions that define how the assistant behaves"
            rows={4}
          />
        </div>
        
        <div>
          <Label className="block mb-2">Knowledge Base Folders</Label>
          <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-3">
            {folders.length > 0 ? (
              folders.map(folder => (
                <div key={folder.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`folder-${folder.id}`}
                    checked={selectedFolders.includes(folder.id)}
                    onCheckedChange={() => handleFolderToggle(folder.id)}
                  />
                  <Label htmlFor={`folder-${folder.id}`} className="cursor-pointer">
                    {folder.name}
                  </Label>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">
                No folders found. Create folders in the Knowledge Base to assign them to this assistant.
              </p>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading || !name}>
            {isLoading ? 'Saving...' : (assistantId ? 'Update' : 'Create')}
          </Button>
        </div>
      </form>
    </Card>
  );
} 