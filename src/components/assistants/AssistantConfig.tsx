import React, { useState, useEffect } from 'react';
import { useAssistantStore } from '../../store/assistantStore';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { useKnowledgeBase } from '../../hooks/useKnowledgeBase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Card } from '../ui/Card';
import { Checkbox } from '../ui/Checkbox';
import { Label } from '../ui/Label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogFooter } from '../ui/Dialog';
import { FolderOpen, Plus, Search } from 'lucide-react';
import { Badge } from '../ui/Badge';
import type { AIAssistant, AIModel, AIFolder, Folder } from '../../types/ai';

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
  
  const { folders: knowledgeBaseFolders } = useKnowledgeBaseStore();
  
  const { 
    folders: aiDriveFolders,
    getAllFolders,
    createFolder
  } = useKnowledgeBase({
    enableDriveSync: true
  });
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAIDriveDialogOpen, setIsAIDriveDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const allFolders = [...knowledgeBaseFolders, ...aiDriveFolders];
  
  const filteredFolders = searchQuery 
    ? allFolders.filter(folder => 
        folder.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allFolders;
  
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
      if (assistantId) {
        updateAssistant(assistantId, {
          name,
          description,
          systemPrompt,
        });
        
        const currentFolders = getAssistantFolders(assistantId);
        
        currentFolders.forEach(folderId => {
          if (!selectedFolders.includes(folderId)) {
            removeFolderFromAssistant(assistantId, folderId);
          }
        });
        
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
        const now = new Date();
        const newAssistant = addAssistant({
          name,
          description,
          type: 'general',
          capabilities: [],
          isActive: true,
          createdAt: now,
          updatedAt: now,
          systemPrompt,
        });
        
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
  
  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      try {
        const folder = await createFolder(newFolderName.trim());
        setSelectedFolders(prev => [...prev, folder.id]);
        setNewFolderName('');
      } catch (error) {
        console.error('Error creating folder:', error);
      }
    }
  };
  
  const getSelectedFolderNames = () => {
    return selectedFolders
      .map(id => {
        const folder = allFolders.find(f => f.id === id);
        return folder ? folder.name : 'Unknown folder';
      })
      .join(', ');
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
          <div className="flex items-center justify-between mb-2">
            <Label>Knowledge Base</Label>
            <Dialog open={isAIDriveDialogOpen} onOpenChange={setIsAIDriveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FolderOpen className="w-4 h-4 mr-1" />
                  Browse Folders
                </Button>
              </DialogTrigger>
              
              <DialogContent className="sm:max-w-[525px]">
                <DialogTitle>Select Knowledge Folders</DialogTitle>
                <DialogDescription>
                  Choose folders from AI Drive to link with this assistant.
                </DialogDescription>
                
                <div className="py-4 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search folders..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <Tabs defaultValue="all">
                    <TabsList className="w-full">
                      <TabsTrigger value="all" className="flex-1">All Folders</TabsTrigger>
                      <TabsTrigger value="selected" className="flex-1">Selected</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="all" className="mt-2">
                      <div className="max-h-60 overflow-y-auto border rounded p-2 space-y-1">
                        {filteredFolders.length > 0 ? (
                          filteredFolders.map(folder => (
                            <div
                              key={folder.id}
                              className="flex items-center justify-between p-2 rounded hover:bg-muted"
                            >
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`folder-dialog-${folder.id}`}
                                  checked={selectedFolders.includes(folder.id)}
                                  onCheckedChange={() => handleFolderToggle(folder.id)}
                                />
                                <label 
                                  htmlFor={`folder-dialog-${folder.id}`}
                                  className="cursor-pointer text-sm"
                                >
                                  {folder.name}
                                </label>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            {searchQuery ? 'No matching folders found' : 'No folders available'}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="selected" className="mt-2">
                      <div className="max-h-60 overflow-y-auto border rounded p-2">
                        {selectedFolders.length > 0 ? (
                          selectedFolders.map(id => {
                            const folder = allFolders.find(f => f.id === id);
                            return folder ? (
                              <div
                                key={id}
                                className="flex items-center justify-between p-2 rounded hover:bg-muted"
                              >
                                <span className="text-sm">{folder.name}</span>
                                <Button
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleFolderToggle(id)}
                                >
                                  Remove
                                </Button>
                              </div>
                            ) : null;
                          })
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            No folders selected
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="New folder name"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                    />
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={handleCreateFolder}
                      disabled={!newFolderName.trim()}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Create
                    </Button>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAIDriveDialogOpen(false)}
                  >
                    Done
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="border rounded-md p-3 bg-muted/20 min-h-20">
            {selectedFolders.length > 0 ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {selectedFolders.map(id => {
                    const folder = allFolders.find(f => f.id === id);
                    return folder ? (
                      <Badge 
                        key={id} 
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <FolderOpen className="h-3 w-3" />
                        {folder.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedFolders.length} folder(s) linked to this assistant
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-16 text-muted-foreground">
                <p className="text-sm">No knowledge folders linked</p>
                <p className="text-xs">Click "Browse Folders" to link AI Drive folders</p>
              </div>
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