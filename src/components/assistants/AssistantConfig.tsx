import React, { useState, useEffect, useRef } from 'react';
import { useAssistantStore } from '../../store/assistantStore';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Card } from '../ui/Card';
import { Checkbox } from '../ui/Checkbox';
import { Label } from '../ui/Label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { FolderOpen, Search, Send, MessageSquare, Bot, User, BarChart2, Wand, Settings, Image as ImageIcon, Upload } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { ScrollArea } from '../ui/ScrollArea';
import { v4 as uuidv4 } from 'uuid';
import { assistantConversationService } from '../../services/ai/assistantConversationService';
import { VisualPromptBuilder } from './VisualPromptBuilder';
import { CapabilityAnalyzer } from './CapabilityAnalyzer';
import { ImageGeneratorModal } from './ImageGeneratorModal';
import type { AIAssistant } from '../../types/ai';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  loading?: boolean;
}

interface AssistantConfigProps {
  assistantId?: string;
  onSave?: (assistant: AIAssistant) => void;
  onCancel?: () => void;
}

type SetupStage = 'start' | 'getName' | 'getDescription' | 'getSystemPrompt' | 'complete';

// Define Gemini Models (similar to AIAssistantPage)
const geminiModels = {
  'gemini-1.5-pro': { name: 'Gemini 1.5 Pro' },
  'gemini-1.0-pro': { name: 'Gemini 1.0 Pro' }, // Assuming this exists based on previous dropdown
  'gemini-2.0-flash': { name: 'Gemini 2.0 Flash' },
  'gemini-2.0-flash-lite': { name: 'Gemini 2.0 Flash-Lite' },
  'gemini-1.5-flash': { name: 'Gemini 1.5 Flash' },
  // Add other Gemini models if available in modelGroups
};

export function AssistantConfig({ assistantId, onSave, onCancel }: AssistantConfigProps) {
  // Assistant Store
  const { getAssistantById, updateAssistant } = useAssistantStore();
  
  // Knowledge Base Store
  const { folders: allFolders } = useKnowledgeBaseStore();
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-1.5-pro');
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [illustrationUrl, setIllustrationUrl] = useState<string | null>(null);
  const [showFolderSelector, setShowFolderSelector] = useState(false);
  const [folderSearch, setFolderSearch] = useState('');

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isProcessingMessage, setIsProcessingMessage] = useState(false);
  const [systemPromptSuggestion, setSystemPromptSuggestion] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Add state for setup interview
  const [setupStage, setSetupStage] = useState<SetupStage>(assistantId ? 'complete' : 'start');

  // Analysis state
  const [showInsights, setShowInsights] = useState(false);
  const [activeInsightsTab, setActiveInsightsTab] = useState<'system-prompt' | 'capabilities'>('system-prompt');

  // Initialize from existing assistant or start setup interview
  useEffect(() => {
    if (assistantId) {
      const assistant = getAssistantById(assistantId);
      if (assistant) {
        setName(assistant.name);
        setDescription(assistant.description || '');
        setSystemPrompt(assistant.systemPrompt || '');
        setAvatarUrl(assistant.avatar || null);
        setSelectedFolders(assistant.linkedFolders || []);

        // Add a welcome message from the assistant
        const welcomeMessage = assistantConversationService.generateWelcomeMessage(assistant);
        setMessages([{
          id: uuidv4(),
          content: welcomeMessage,
          role: 'assistant',
          timestamp: new Date()
        }]);
        setSetupStage('complete'); // Mark setup as complete if editing
      }
    } else {
      // Start setup interview for new assistants
      setSetupStage('start');
      const welcomeMessage = "Hello! I can help you create a new AI assistant. First, what would you like to name your assistant?";
      setMessages([{
        id: uuidv4(),
        content: welcomeMessage,
        role: 'assistant',
        timestamp: new Date()
      }]);
      setSetupStage('getName'); // Move to the next stage
    }
  }, [assistantId, getAssistantById]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      // Show some validation error
      return;
    }
    
    const assistantData: AIAssistant = {
      id: assistantId || uuidv4(),
      name,
      description,
      type: 'general',
      capabilities: [],
      systemPrompt,
      linkedFolders: selectedFolders,
      avatar: avatarUrl || undefined,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    if (assistantId) {
      updateAssistant(assistantId, assistantData);
    }
    
    if (onSave) {
      onSave(assistantData);
    }
  };

  // Knowledge folder management
  const handleFolderSelect = (folderId: string, selected: boolean) => {
    setSelectedFolders(prev => 
      selected 
        ? [...prev, folderId] 
        : prev.filter(id => id !== folderId)
    );
  };
  
  const filteredFolders = folderSearch
    ? allFolders.filter(folder => 
        folder.name.toLowerCase().includes(folderSearch.toLowerCase())
      )
    : allFolders;

  // Chat functionality
  const handleSendMessage = async () => {
    if (!newMessage.trim() || isProcessingMessage) return;

    const userMessage: Message = {
      id: uuidv4(),
      content: newMessage.trim(),
      role: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    const userInput = newMessage.trim();
    setNewMessage('');

    // Handle setup interview stages
    if (setupStage !== 'complete') {
      let nextStage: SetupStage = setupStage;
      let assistantResponse = '';

      switch (setupStage) {
        case 'getName':
          setName(userInput);
          assistantResponse = `Great! Got the name "${userInput}". Now, could you briefly describe what this assistant will do?`;
          nextStage = 'getDescription';
          break;
        case 'getDescription':
          setDescription(userInput);
          assistantResponse = `Okay, description set. Finally, please provide the core instructions or system prompt for how this assistant should behave. This defines its personality and task focus.`;
          nextStage = 'getSystemPrompt';
          break;
        case 'getSystemPrompt':
          setSystemPrompt(userInput);
          assistantResponse = `Excellent! I've saved the system prompt. Your new assistant "${name}" is configured. You can review everything in the 'Configuration' tab or continue chatting with me here to refine it further.`;
          nextStage = 'complete';
          break;
      }

      // Add assistant's response for the next stage
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          content: assistantResponse,
          role: 'assistant',
          timestamp: new Date(),
        },
      ]);
      setSetupStage(nextStage);
      return; // Skip regular AI processing during setup
    }

    // --- Regular AI response generation (only runs if setupStage is 'complete') ---
    setIsProcessingMessage(true);
    const assistantMessageId = uuidv4();
    const assistantMessagePlaceholder: Message = {
      id: assistantMessageId,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      loading: true,
    };
    setMessages((prev) => [...prev, assistantMessagePlaceholder]);

    try {
      // ... existing AI response generation logic ...
      const currentAssistant = assistantId ? getAssistantById(assistantId) : null;
      const context = {
        name: name || (currentAssistant?.name || 'New Assistant'),
        description: description || currentAssistant?.description,
        systemPrompt: systemPrompt || currentAssistant?.systemPrompt,
        linkedFolders: selectedFolders.map(id => {
          const folder = allFolders.find(f => f.id === id);
          return folder ? folder.name : 'Unknown folder';
        })
      };
      
      const historyForAI = messages.filter(m => m.id !== assistantMessageId).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      const response = await assistantConversationService.generateResponse(
        userMessage.content,
        context,
        historyForAI
      );
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId 
            ? { ...msg, content: response, loading: false } 
            : msg
        )
      );
      
      const extractedPrompt = assistantConversationService.extractSystemPromptSuggestion(userMessage.content);
      if (extractedPrompt) {
        const updateMessage: Message = {
          id: uuidv4(),
          content: `Would you like me to update my system prompt with your suggestion? Click "Update System Prompt" below if you'd like to use this.`,
          role: 'system',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, updateMessage]);
        setSystemPromptSuggestion(extractedPrompt);
        setShowInsights(true);
        setActiveInsightsTab('system-prompt');
      }
    } catch (error) {
      // ... existing error handling ...
    } finally {
      setIsProcessingMessage(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleUpdateSystemPrompt = () => {
    if (systemPromptSuggestion) {
      setSystemPrompt(systemPromptSuggestion);
      const updatedMessage: Message = {
        id: uuidv4(),
        content: `System prompt updated successfully!`,
        role: 'system',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, updatedMessage]);
      setSystemPromptSuggestion('');
    }
  };
  
  // Apply a suggestion from the capability analyzer
  const handleApplySuggestion = (suggestion: string) => {
    setNewMessage(suggestion);
    // Scroll to the input
    setTimeout(() => {
      const messageInput = document.getElementById('message-input');
      if (messageInput) {
        messageInput.focus();
      }
    }, 100);
  };
  
  // Handle image generation
  const handleImageGenerated = (imageUrl: string, type: 'icon' | 'avatar' | 'illustration') => {
    if (type === 'icon') {
      setIconUrl(imageUrl);
    } else if (type === 'avatar') {
      setAvatarUrl(imageUrl);
    } else if (type === 'illustration') {
      setIllustrationUrl(imageUrl);
    }
    
    // Add a message about the image
    const imageMessage: Message = {
      id: uuidv4(),
      content: `I've generated a new ${type} image for your assistant. You can see it in the configuration tab.`,
      role: 'system',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, imageMessage]);
  };
  
  // Add handler for file uploads
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // TODO: Implement actual file upload logic
      // - Upload files to storage (e.g., AI Drive)
      // - Potentially create a new knowledge folder or add to existing
      // - Link the new/updated folder to the assistant (update selectedFolders state)
      console.log('Uploaded files:', files);
      // Example: Add a system message
      const uploadMessage: Message = {
        id: uuidv4(),
        content: `Successfully uploaded ${files.length} file(s). You may need to select the folder they were added to.`,
        role: 'system',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, uploadMessage]);
    }
    // Reset the input value to allow uploading the same file again
    event.target.value = ''; 
  };
  
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">
        {assistantId ? 'Edit Assistant' : 'Create New Assistant'}
      </h2>
      
      <Tabs defaultValue="config" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="conversation">Conversation</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="config">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Assistant Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter a name for your assistant"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <select
                  id="model"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md"
                >
                  {Object.entries(geminiModels).map(([key, model]) => (
                    <option key={key} value={key}>{model.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a description of what this assistant does"
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="system-prompt">System Prompt</Label>
              </div>
              <Textarea
                id="system-prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Instructions that define how the assistant should behave"
                rows={6}
                className="font-mono text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-2">
                <Label>Knowledge Folders</Label>
                <div className="flex gap-2">
                  {/* Add Upload File Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('assistant-file-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFolderSelector(!showFolderSelector)}
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    {showFolderSelector ? 'Hide Folders' : 'Browse Folders'}
                  </Button>
                </div>
              </div>
              {/* Hidden File Input */}
              <input 
                type="file" 
                id="assistant-file-upload" 
                className="hidden" 
                onChange={handleFileUpload} 
                multiple // Allow multiple files if desired
              />
              
              <div className="flex flex-wrap gap-2">
                {selectedFolders.length > 0 ? (
                  selectedFolders.map((folderId) => {
                    const folder = allFolders.find((f) => f.id === folderId);
                    return (
                      <Badge key={folderId} variant="secondary" className="flex items-center gap-1">
                        <FolderOpen className="h-3 w-3" />
                        {folder?.name || 'Unknown folder'}
                        <button
                          type="button"
                          className="ml-1 rounded-full hover:bg-muted p-0.5"
                          onClick={() => handleFolderSelect(folderId, false)}
                        >
                          ×
                        </button>
                      </Badge>
                    );
                  })
                ) : (
                  <div className="text-sm text-muted-foreground">No folders selected</div>
                )}
              </div>
              
              {showFolderSelector && (
                <Card className="p-4 mt-2 border">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Input
                        value={folderSearch}
                        onChange={(e) => setFolderSearch(e.target.value)}
                        placeholder="Search folders..."
                        className="h-8"
                      />
                    </div>
                    <ScrollArea className="h-48">
                      <div className="space-y-1">
                        {filteredFolders.map((folder) => (
                          <div
                            key={folder.id}
                            className="flex items-center space-x-2 rounded-md px-2 py-1.5 hover:bg-accent"
                          >
                            <Checkbox
                              id={`folder-${folder.id}`}
                              checked={selectedFolders.includes(folder.id)}
                              onCheckedChange={(checked) =>
                                handleFolderSelect(folder.id, Boolean(checked))
                              }
                            />
                            <Label
                              htmlFor={`folder-${folder.id}`}
                              className="flex-grow cursor-pointer text-sm"
                            >
                              {folder.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </Card>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Images</Label>
                <ImageGeneratorModal
                  assistantName={name || 'Assistant'}
                  assistantDescription={description}
                  onImageGenerated={handleImageGenerated}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center space-y-2">
                  <div 
                    className="w-20 h-20 rounded-md border flex items-center justify-center overflow-hidden bg-muted"
                  >
                    {iconUrl ? (
                      <img src={iconUrl} alt="Assistant icon" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-center">Icon</p>
                </div>
                
                <div className="flex flex-col items-center space-y-2">
                  <div 
                    className="w-20 h-20 rounded-full border flex items-center justify-center overflow-hidden bg-muted"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Assistant avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-center">Avatar</p>
                </div>
                
                <div className="flex flex-col items-center space-y-2">
                  <div 
                    className="w-32 h-20 rounded-md border flex items-center justify-center overflow-hidden bg-muted"
                  >
                    {illustrationUrl ? (
                      <img src={illustrationUrl} alt="Assistant illustration" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-center">Illustration</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit">
                {assistantId ? 'Update Assistant' : 'Create Assistant'}
              </Button>
            </div>
          </form>
        </TabsContent>
        
        <TabsContent value="conversation" className="space-y-4">
          <div className="space-y-4">
            <div className="border rounded-md p-4 bg-muted/20 min-h-[400px] flex flex-col">
              <ScrollArea className="flex-1 pr-4 max-h-[350px]">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`flex items-start gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      
                      <div 
                        className={`rounded-lg p-3 max-w-[80%] ${
                          message.role === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : message.role === 'system'
                            ? 'bg-muted border border-border'
                            : 'bg-card border border-border'
                        }`}
                      >
                        <div className="text-sm whitespace-pre-line">
                          {message.content.includes('**') 
                            ? message.content.split('\n').map((line, i) => {
                                if (line.startsWith('**') && line.endsWith('**')) {
                                  return <p key={i} className="font-bold">{line.replace(/\*\*/g, '')}</p>;
                                }
                                return <p key={i}>{line}</p>;
                              })
                            : message.content
                          }
                        </div>

                        {message.loading && (
                          <div className="flex items-center gap-1 mt-1">
                            <div className="w-1 h-1 rounded-full bg-current animate-pulse"></div>
                            <div className="w-1 h-1 rounded-full bg-current animate-pulse delay-150"></div>
                            <div className="w-1 h-1 rounded-full bg-current animate-pulse delay-300"></div>
                          </div>
                        )}
                        
                        {message.role === 'system' && systemPromptSuggestion && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="mt-2"
                            onClick={handleUpdateSystemPrompt}
                          >
                            Update System Prompt
                          </Button>
                        )}
                      </div>
                      
                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              <div className="flex gap-2 mt-4">
                <Input
                  id="message-input"
                  placeholder={setupStage !== 'complete' ? `Enter assistant ${setupStage.replace('get', '').toLowerCase()}...` : "How would you like to improve this assistant?"}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isProcessingMessage}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isProcessingMessage}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Wand className="h-4 w-4" />
                Assistant Insights
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInsights(!showInsights)}
              >
                {showInsights ? 'Hide' : 'Show'}
              </Button>
            </div>
            
            {showInsights && (
              <div className="space-y-4">
                <Tabs 
                  value={activeInsightsTab}
                  onValueChange={(value) => setActiveInsightsTab(value as 'system-prompt' | 'capabilities')}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="system-prompt" className="text-xs">
                      <Settings className="h-3 w-3 mr-1" />
                      System Prompt
                    </TabsTrigger>
                    <TabsTrigger value="capabilities" className="text-xs">
                      <BarChart2 className="h-3 w-3 mr-1" />
                      Capabilities
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="system-prompt" className="space-y-4 mt-4">
                    <VisualPromptBuilder 
                      initialPrompt={systemPrompt}
                      onChange={(newPrompt) => setSystemPrompt(newPrompt)}
                    />
                  </TabsContent>
                  
                  <TabsContent value="capabilities" className="mt-4">
                    <CapabilityAnalyzer
                      assistant={assistantId ? (getAssistantById(assistantId) || null) : null}
                      onApplySuggestion={handleApplySuggestion}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            )}
            
            {!showInsights && (
              <div className="text-sm text-muted-foreground">
                <p>Click "Show" to view advanced insights about your assistant, including:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>System prompt builder and analyzer</li>
                  <li>Capability strengths and weaknesses</li>
                  <li>Improvement recommendations</li>
                </ul>
              </div>
            )}
          </Card>
          
          <div className="bg-muted/40 p-4 rounded-lg border">
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Assistant Configuration Conversation
            </h3>
            <p className="text-sm text-muted-foreground">
              Use the conversation interface in the 'Conversation' tab to interact with your assistant and provide guidance on how to improve its capabilities.
              Try asking about:
            </p>
            <ul className="text-xs text-muted-foreground list-disc list-inside mt-1 space-y-1">
              <li>Current configuration and capabilities</li>
              <li>System prompt improvements</li>
              <li>Knowledge folder recommendations</li>
              <li>Specialized features for legal tasks</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}