import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/Card';
import { Brain, Book, MessageSquare, Settings } from 'lucide-react';
import { KnowledgeBaseSelector } from './KnowledgeBaseSelector';
import { useAssistantStore } from '../../store/assistantStore';
import type { AIAssistant } from '../../types/ai';

interface AssistantConfigProps {
  assistantId?: string;
  onSave?: (assistant: AIAssistant) => void;
  onCancel?: () => void;
}

/**
 * Component for configuring an assistant with knowledge base integration
 */
export function AssistantConfig({ assistantId, onSave, onCancel }: AssistantConfigProps) {
  const { 
    addAssistant, 
    updateAssistant, 
    getAssistantById,
    getAssistantFolders 
  } = useAssistantStore();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Load data if editing an existing assistant
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
  
  const handleSave = () => {
    if (!name) return;
    
    setIsLoading(true);
    
    try {
      if (assistantId) {
        // Update existing assistant
        updateAssistant(assistantId, {
          name,
          description,
          systemPrompt,
          updatedAt: new Date()
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
          type: 'general',
          capabilities: ['text-generation', 'chat', 'document-analysis'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // Assign selected folders
        selectedFolders.forEach(folderId => {
          updateAssistant(newAssistant.id, {
            knowledgeBase: [...(newAssistant.knowledgeBase || []), { id: folderId }]
          });
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
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {assistantId ? 'Edit Assistant' : 'Create New Assistant'}
        </CardTitle>
        <CardDescription>
          Configure your AI assistant's capabilities and knowledge
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Brain size={16} />
              <span>Basic Info</span>
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex items-center gap-2">
              <Book size={16} />
              <span>Knowledge</span>
            </TabsTrigger>
            <TabsTrigger value="prompts" className="flex items-center gap-2">
              <MessageSquare size={16} />
              <span>Prompt Templates</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings size={16} />
              <span>Advanced Settings</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Name
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Assistant Name"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Description
              </label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this assistant's purpose"
              />
            </div>
            
            <div>
              <label htmlFor="systemPrompt" className="block text-sm font-medium mb-1">
                System Prompt
              </label>
              <Textarea
                id="systemPrompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Instructions that define how the assistant behaves"
                rows={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                This prompt defines your assistant's personality, knowledge domains, and how it should respond.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="knowledge" className="space-y-4">
            <div className="space-y-4">
              <p className="text-sm">
                Assign knowledge base folders to this assistant. The assistant will use documents in these folders to respond to queries.
              </p>
              
              <KnowledgeBaseSelector
                selectedFolderIds={selectedFolders}
                onSelectFolder={setSelectedFolders}
                assistantId={assistantId}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="prompts" className="space-y-4">
            <div className="space-y-4">
              <p className="text-sm">
                Create template prompts that your assistant can use. This helps the assistant understand common requests.
              </p>
              
              <div className="p-8 text-center border border-dashed rounded-lg">
                <p className="text-sm text-gray-500">Prompt templates feature coming soon</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <p className="text-sm">
                Configure advanced settings for your assistant.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="temperature" className="block text-sm font-medium mb-1">
                    Temperature
                  </label>
                  <Input
                    id="temperature"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    defaultValue="0.7"
                    placeholder="0.7"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Controls randomness. Lower values are more focused, higher values more creative.
                  </p>
                </div>
                
                <div>
                  <label htmlFor="maxTokens" className="block text-sm font-medium mb-1">
                    Max Tokens
                  </label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min="100"
                    max="4000"
                    step="100"
                    defaultValue="1000"
                    placeholder="1000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum length of the assistant's responses.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button 
          onClick={handleSave} 
          disabled={isLoading || !name}
        >
          {isLoading ? 'Saving...' : (assistantId ? 'Update Assistant' : 'Create Assistant')}
        </Button>
      </CardFooter>
    </Card>
  );
} 