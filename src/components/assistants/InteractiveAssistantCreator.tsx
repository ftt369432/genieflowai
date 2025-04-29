import React, { useState, useRef, useEffect } from 'react';
import { useAssistantStore } from '../../store/assistantStore';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Label } from '../ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Badge } from '../ui/Badge';
import { Upload, Brain, MessageSquare, PlusCircle, Save, FolderPlus } from 'lucide-react';
import { nanoid } from 'nanoid';
import type { AIAssistant, AIFolder, AIDocument } from '../../types/ai';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { UnifiedAIChat } from '../ai/UnifiedAIChat';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/AlertDialog';
import { Switch } from '../ui/Switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';

interface InteractiveAssistantCreatorProps {
  assistantId?: string;
}

export function InteractiveAssistantCreator({ assistantId }: InteractiveAssistantCreatorProps) {
  const {
    assistants,
    addAssistant,
    updateAssistant,
    getAssistantById,
    getAssistantFolders
  } = useAssistantStore();

  const {
    folders,
    addFolder,
    addDocument,
    generateEmbedding
  } = useKnowledgeBaseStore();

  const navigate = useNavigate();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [assistantPurpose, setAssistantPurpose] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [uploadMode, setUploadMode] = useState(false);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptContent, setNewPromptContent] = useState('');
  const [newPromptTags, setNewPromptTags] = useState<string[]>([]);
  const [showSaveConfirmDialog, setShowSaveConfirmDialog] = useState(false);

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

  const createNewFolder = () => {
    if (!newFolderName.trim()) return;

    const newFolder: AIFolder = {
      id: `folder-${nanoid()}`,
      name: newFolderName,
      documents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId: null,
    };

    addFolder(newFolder);
    setSelectedFolders(prev => [...prev, newFolder.id]);
    setNewFolderName('');
    setShowNewFolderDialog(false);
  };

  const handleSaveAssistant = async () => {
    if (!name) {
      toast({
        title: "Missing Information",
        description: "Please provide a name for your assistant.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let finalSystemPrompt = systemPrompt;
      if ((systemPrompt?.length || 0) < 50 && description) {
        finalSystemPrompt = `${systemPrompt}\nYou are specialized in: ${description}`;
        setSystemPrompt(finalSystemPrompt);
      }

      const keywords = [
        ...extractKeywords(name || ''),
        ...extractKeywords(description || '')
      ];

      const finalAssistant: AIAssistant = {
        id: assistantId || `asst-${nanoid()}`,
        name,
        description,
        systemPrompt: finalSystemPrompt,
        tags: keywords,
        model: assistants.find(a => a.id === assistantId)?.model || 'gemini-2.0-flash',
        provider: assistants.find(a => a.id === assistantId)?.provider || 'google',
        capabilities: assistants.find(a => a.id === assistantId)?.capabilities || ['chat'],
        createdAt: assistants.find(a => a.id === assistantId)?.createdAt || new Date(),
        updatedAt: new Date()
      };

      if (assistantId) {
        await updateAssistant(assistantId, finalAssistant);
        toast({
          title: "Assistant Updated",
          description: `"${finalAssistant.name}" has been updated successfully.`
        });
      } else {
        await addAssistant(finalAssistant);
        toast({
          title: "Assistant Created",
          description: `"${finalAssistant.name}" has been created successfully.`
        });
      }

      setShowSaveConfirmDialog(false);
      navigate('/assistants');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save assistant');
    } finally {
      setIsLoading(false);
    }
  };

  function extractKeywords(text: string): string[] {
    if (!text) return [];

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter((word, i, arr) => arr.indexOf(word) === i)
      .slice(0, 10);
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <Brain className="mr-2 h-6 w-6" />
        {assistantId ? 'Edit Assistant' : 'Create New Assistant'}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Assistant Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="My Custom Assistant"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what this assistant is specialized in..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="systemPrompt">System Prompt</Label>
                    <Textarea
                      id="systemPrompt"
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      placeholder="Instructions for the assistant..."
                      rows={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      The system prompt provides base instructions for the assistant's behavior.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="knowledge" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-2">
                      <Label>Knowledge Base Folders</Label>
                      <Button variant="outline" size="sm" onClick={() => setShowNewFolderDialog(true)}>
                        <FolderPlus className="h-4 w-4 mr-1" />
                        New Folder
                      </Button>
                    </div>

                    {showNewFolderDialog && (
                      <div className="flex gap-2 mb-4">
                        <Input
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          placeholder="Folder name"
                          className="flex-1"
                        />
                        <Button onClick={createNewFolder} size="sm">
                          Create
                        </Button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Select
                        value={selectedFolders.join(',')}
                        onValueChange={(value) => setSelectedFolders(value.split(','))}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select folders" />
                        </SelectTrigger>
                        <SelectContent>
                          {folders.map((folder) => (
                            <SelectItem key={folder.id} value={folder.id}>
                              {folder.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={() => setActiveTab('knowledge')} disabled={selectedFolders.length === 0}>
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-4 space-y-2">
                      <Label>Selected Folders</Label>
                      {selectedFolders.length > 0 ? (
                        <div className="space-y-2">
                          {selectedFolders.map((folderId) => (
                            <div key={folderId} className="flex justify-between items-center p-2 border rounded">
                              <span>{folders.find(f => f.id === folderId)?.name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedFolders(prev => prev.filter(id => id !== folderId))}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground p-2 border rounded">
                          No folders selected. Add folders to enhance your assistant with specific knowledge.
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enableTraining">Interactive Training</Label>
                      <Switch
                        id="enableTraining"
                        checked={uploadMode}
                        onCheckedChange={setUploadMode}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enable to chat with your assistant during creation to test and refine its behavior.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={() => navigate('/assistants')}>
                  Cancel
                </Button>
                <Button onClick={() => setShowSaveConfirmDialog(true)}>
                  <Save className="h-4 w-4 mr-2" /> Save Assistant
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                {uploadMode ? (
                  <>
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Interactive Training
                  </>
                ) : (
                  <>
                    <Brain className="h-5 w-5 mr-2" />
                    Assistant Preview
                  </>
                )}
                {name && (
                  <Badge variant="outline" className="ml-2">
                    {name}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[600px]">
              <UnifiedAIChat
                assistant={{
                  id: assistantId || `preview-${nanoid()}`,
                  name: name || 'Assistant Preview',
                  systemPrompt: systemPrompt || '',
                  model: 'gemini-2.0-flash',
                  provider: 'google',
                  capabilities: ['chat'],
                  createdAt: new Date(),
                  updatedAt: new Date()
                }}
                initialMessages={[]}
                welcomeMessage={uploadMode
                  ? "I'm in training mode. Chat with me to help refine my capabilities and knowledge."
                  : "This is a preview of how your assistant will respond. You can interact with it to test its behavior."}
                enableKnowledgeBaseUpload={true}
                onAssistantUpdate={(updatedAssistant) => {
                  setName(updatedAssistant.name);
                  setDescription(updatedAssistant.description || '');
                  setSystemPrompt(updatedAssistant.systemPrompt || '');
                  setSelectedFolders(updatedAssistant.knowledgeBase?.map(b => b.id) || []);
                }}
                variant="assistant"
                selectedFolderIds={selectedFolders}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={showSaveConfirmDialog} onOpenChange={setShowSaveConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Assistant</AlertDialogTitle>
            <AlertDialogDescription>
              {assistantId
                ? `Are you sure you want to update "${name}"?`
                : `Are you sure you want to create "${name || 'this assistant'}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveAssistant} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}
    </div>
  );
}