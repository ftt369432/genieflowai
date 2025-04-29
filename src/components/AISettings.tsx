import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './ui/Dialog';
import { Button } from './ui/Button';
import { Label } from './ui/Label';
import { Switch } from './ui/Switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { Textarea } from './ui/Textarea';
import { Input } from './ui/Input';
import { aiModePresets, defaultAIConfig, AIConfig, availableModels } from '../config/ai';
import { Sparkles, Lightbulb, MessageSquare, Save, Plus, Wand2, Trash2, Copy, PenSquare, CheckCircle } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from './ui/DropdownMenu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import { cn } from '../lib/utils';

// Sample AI assistance function - this would be replaced with your actual implementation
const getAIAssistance = async (prompt: string, instruction: string): Promise<string> => {
  // In a real implementation, this would call your AI API
  // For now, return a placeholder
  return prompt + "\n\n# Enhanced by AI\n" + 
    "The AI will now provide unrestricted legal and medical analysis as requested. " +
    "All information will be presented clearly and comprehensively, structured in well-defined paragraphs with key points highlighted.";
};

interface SavedPrompt {
  id: string;
  name: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AISettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentConfig: AIConfig;
  onSave: (config: AIConfig) => void;
}

// Key for storing settings in localStorage
const AI_SETTINGS_STORAGE_KEY = 'genieflow_ai_settings';
const SAVED_PROMPTS_STORAGE_KEY = 'genieflow_saved_prompts';

export function AISettings({ open, onOpenChange, currentConfig, onSave }: AISettingsProps) {
  // Initialize from localStorage if available, otherwise use currentConfig
  const [config, setConfig] = useState<AIConfig>(() => {
    const savedSettings = localStorage.getItem(AI_SETTINGS_STORAGE_KEY);
    let initialConfig = { ...defaultAIConfig, ...currentConfig }; // Start with defaults merged with current
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        // Ensure a valid model is selected, fallback to default if not
        const selectedModel = availableModels.find(m => m.id === parsedSettings.model);
        if (!selectedModel) {
          parsedSettings.model = defaultAIConfig.model;
        }
        initialConfig = { ...initialConfig, ...parsedSettings }; // Merge saved settings
      } catch (e) {
        console.error('Failed to parse saved AI settings:', e);
      }
    }
    // Ensure the final initialConfig has a valid model
    if (!availableModels.some(m => m.id === initialConfig.model)) {
        initialConfig.model = defaultAIConfig.model;
    }
    return initialConfig;
  });

  // State for prompt management
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>(() => {
    const savedPromptsData = localStorage.getItem(SAVED_PROMPTS_STORAGE_KEY);
    if (savedPromptsData) {
      try {
        const parsed = JSON.parse(savedPromptsData);
        return parsed.map((prompt: any) => ({
          ...prompt,
          createdAt: new Date(prompt.createdAt),
          updatedAt: new Date(prompt.updatedAt)
        }));
      } catch (e) {
        console.error('Failed to parse saved prompts:', e);
      }
    }
    return [];
  });
  
  const [newPromptName, setNewPromptName] = useState('');
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [currentPromptId, setCurrentPromptId] = useState<string | null>(null);
  const [aiAssistInstruction, setAiAssistInstruction] = useState('');
  const [isAiAssistModalOpen, setIsAiAssistModalOpen] = useState(false);
  const [isAiAssistLoading, setIsAiAssistLoading] = useState(false);

  // Update localStorage whenever config changes
  useEffect(() => {
    if (config) {
      localStorage.setItem(AI_SETTINGS_STORAGE_KEY, JSON.stringify(config));
    }
  }, [config]);

  // Update localStorage whenever savedPrompts changes
  useEffect(() => {
    localStorage.setItem(SAVED_PROMPTS_STORAGE_KEY, JSON.stringify(savedPrompts));
  }, [savedPrompts]);

  const handleSave = () => {
    // Ensure the saved config has a valid model before saving
    const finalConfig = { ...config };
    if (!availableModels.some(m => m.id === finalConfig.model)) {
        finalConfig.model = defaultAIConfig.model; // Fallback to default if somehow invalid
    }
    localStorage.setItem(AI_SETTINGS_STORAGE_KEY, JSON.stringify(finalConfig));
    onSave(finalConfig);
    onOpenChange(false);
  };

  const formatDescriptions = {
    standard: "Basic formatting with minimal structure",
    structured: "Formal document structure with headers and sections",
    streamlined: "Paragraph-focused with hierarchical organization"
  };

  const saveCurrentPrompt = () => {
    if (!newPromptName.trim()) {
      alert('Please enter a name for the prompt');
      return;
    }

    const now = new Date();
    if (currentPromptId) {
      // Update existing prompt
      setSavedPrompts(prompts => 
        prompts.map(prompt => 
          prompt.id === currentPromptId 
            ? { 
                ...prompt, 
                name: newPromptName, 
                content: config.systemPrompt,
                updatedAt: now
              } 
            : prompt
        )
      );
    } else {
      // Create new prompt
      const newPrompt: SavedPrompt = {
        id: `prompt-${Date.now()}`,
        name: newPromptName,
        content: config.systemPrompt,
        createdAt: now,
        updatedAt: now
      };
      setSavedPrompts(prompts => [...prompts, newPrompt]);
    }

    // Reset state
    setNewPromptName('');
    setCurrentPromptId(null);
    setIsEditingPrompt(false);
  };

  const loadPrompt = (promptId: string) => {
    const prompt = savedPrompts.find(p => p.id === promptId);
    if (prompt) {
      setConfig({
        ...config,
        systemPrompt: prompt.content
      });
      setCurrentPromptId(promptId);
    }
  };

  const deletePrompt = (promptId: string) => {
    setSavedPrompts(prompts => prompts.filter(p => p.id !== promptId));
    if (currentPromptId === promptId) {
      setCurrentPromptId(null);
    }
  };

  const editPrompt = (promptId: string) => {
    const prompt = savedPrompts.find(p => p.id === promptId);
    if (prompt) {
      setNewPromptName(prompt.name);
      setConfig({
        ...config,
        systemPrompt: prompt.content
      });
      setCurrentPromptId(promptId);
      setIsEditingPrompt(true);
    }
  };

  const getAIHelpWithPrompt = async () => {
    if (!aiAssistInstruction.trim()) {
      alert('Please enter instructions for the AI');
      return;
    }

    setIsAiAssistLoading(true);
    try {
      const enhancedPrompt = await getAIAssistance(config.systemPrompt, aiAssistInstruction);
      setConfig({
        ...config,
        systemPrompt: enhancedPrompt
      });
      setIsAiAssistModalOpen(false);
    } catch (error) {
      console.error('Error getting AI assistance:', error);
      alert('Failed to get AI assistance. Please try again.');
    } finally {
      setIsAiAssistLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>AI Assistant Settings</DialogTitle>
          <DialogDescription>
            Configure how your AI assistant processes and displays information
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="prompts">Saved Prompts</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-6">
            {/* Mode Selection */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Assistant Mode</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.values(aiModePresets).map(mode => (
                  <div 
                    key={mode.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      config.mode === mode.id 
                        ? 'border-primary bg-primary/5 shadow-sm' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setConfig({
                      ...config,
                      mode: mode.id,
                      systemPrompt: mode.systemPrompt
                    })}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-1.5 rounded-full bg-primary/10 ${mode.style}`}>
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <h4 className="font-medium">{mode.name}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{mode.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Formatting Options */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Content Formatting</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Choose how information is organized and presented
              </p>
              
              <Tabs 
                value={config.formatStyle} 
                onValueChange={(value) => setConfig({
                  ...config, 
                  formatStyle: value as 'standard' | 'structured' | 'streamlined'
                })}
                className="w-full"
              >
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="standard">Standard</TabsTrigger>
                  <TabsTrigger value="structured">Structured</TabsTrigger>
                  <TabsTrigger value="streamlined">Streamlined</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <p className="text-sm text-muted-foreground mt-2 pb-2 border-b">
                {formatDescriptions[config.formatStyle]}
              </p>
            </div>

            {/* Display Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Display Settings</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="streaming">Real-time Streaming</Label>
                  <p className="text-sm text-muted-foreground">
                    Display responses as they're generated instead of waiting for completion
                  </p>
                </div>
                <Switch 
                  id="streaming"
                  checked={config.streamingEnabled}
                  onCheckedChange={(checked) => setConfig({...config, streamingEnabled: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="thinking">Thinking Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Show step-by-step reasoning process for complex requests
                  </p>
                </div>
                <Switch 
                  id="thinking"
                  checked={config.thinkingMode}
                  onCheckedChange={(checked) => setConfig({...config, thinkingMode: checked})}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="prompts" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Saved Prompts</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setNewPromptName('');
                    setCurrentPromptId(null);
                    setIsEditingPrompt(true);
                  }}
                  className="flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Prompt</span>
                </Button>
              </div>
              
              {isEditingPrompt ? (
                <div className="space-y-3 p-3 border rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="prompt-name">Prompt Name</Label>
                    <Input 
                      id="prompt-name"
                      value={newPromptName}
                      onChange={(e) => setNewPromptName(e.target.value)}
                      placeholder="Enter a name for this prompt..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="prompt-content">Prompt Content</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAiAssistModalOpen(true)}
                        className="flex items-center gap-1 text-primary"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>AI Assist</span>
                      </Button>
                    </div>
                    <Textarea 
                      id="prompt-content"
                      value={config.systemPrompt}
                      onChange={(e) => setConfig({...config, systemPrompt: e.target.value})}
                      className="min-h-[200px] font-mono text-sm"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditingPrompt(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={saveCurrentPrompt}
                      className="flex items-center gap-1"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Prompt</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {savedPrompts.length > 0 ? (
                    <div className="space-y-2">
                      {savedPrompts.map((prompt) => (
                        <div 
                          key={prompt.id} 
                          className={cn(
                            "flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 transition-all",
                            currentPromptId === prompt.id && "border-primary bg-primary/5"
                          )}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="p-1.5 rounded-full bg-primary/10">
                              <MessageSquare className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{prompt.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                Updated {new Date(prompt.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => loadPrompt(prompt.id)}
                              className={cn(
                                "h-8 w-8",
                                currentPromptId === prompt.id && "bg-primary/20"
                              )}
                            >
                              {currentPromptId === prompt.id ? (
                                <CheckCircle className="h-4 w-4 text-primary" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8">
                                  <PenSquare className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => editPrompt(prompt.id)}>
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => deletePrompt(prompt.id)}
                                  className="text-destructive"
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center border rounded-lg border-dashed">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <h4 className="font-medium mb-1">No Saved Prompts</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Save prompts to quickly switch between different AI instructions
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsEditingPrompt(true);
                          setCurrentPromptId(null);
                          setNewPromptName('');
                        }}
                      >
                        Create Your First Prompt
                      </Button>
                    </div>
                  )}
                </>
              )}
              
              {/* AI Assist Modal */}
              {isAiAssistModalOpen && (
                <Dialog open={isAiAssistModalOpen} onOpenChange={setIsAiAssistModalOpen}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>AI Prompt Assistance</DialogTitle>
                      <DialogDescription>
                        Describe how you want the AI to help modify your prompt
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <Textarea
                        value={aiAssistInstruction}
                        onChange={(e) => setAiAssistInstruction(e.target.value)}
                        placeholder="E.g., Make this prompt better for legal document analysis..."
                        className="min-h-[100px]"
                      />
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsAiAssistModalOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={getAIHelpWithPrompt}
                        disabled={isAiAssistLoading}
                      >
                        {isAiAssistLoading ? (
                          <>Processing...</>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4 mr-2" />
                            Enhance Prompt
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-6">
            {/* Advanced Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Advanced Settings</h3>
              
              {/* Model Selection Dropdown - Added */}
              <div className="space-y-2">
                <Label htmlFor="ai-model">AI Model</Label>
                <Select 
                  value={config.model} 
                  onValueChange={(value) => setConfig({...config, model: value})}
                >
                  <SelectTrigger id="ai-model">
                    <SelectValue placeholder="Select AI Model" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose the underlying AI model for generation.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="system-prompt">System Prompt</Label>
                <div className="flex justify-end mb-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAiAssistModalOpen(true)}
                    className="flex items-center gap-1 text-primary h-7"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>AI Assist</span>
                  </Button>
                </div>
                <Textarea 
                  id="system-prompt"
                  value={config.systemPrompt}
                  onChange={(e) => setConfig({...config, systemPrompt: e.target.value})}
                  className="min-h-[200px] font-mono text-sm"
                />
                <div className="flex justify-between mt-1">
                  <p className="text-sm text-muted-foreground">
                    Customize instructions that define your assistant's behavior
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewPromptName('');
                      setCurrentPromptId(null);
                      setIsEditingPrompt(true);
                    }}
                    className="flex items-center gap-1 h-7"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save as Prompt</span>
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature</Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="temperature"
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={config.temperature}
                      onChange={(e) => setConfig({...config, temperature: parseFloat(e.target.value)})}
                      className="w-full"
                    />
                    <span className="text-sm min-w-[2.5rem] text-right">
                      {config.temperature.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Lower values are more focused, higher values more creative
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-tokens">Max Output Length</Label>
                  <select
                    id="max-tokens"
                    value={config.maxTokens}
                    onChange={(e) => setConfig({...config, maxTokens: parseInt(e.target.value)})}
                    className="w-full rounded-md border border-input p-2 text-sm"
                  >
                    <option value="4096">4K tokens</option>
                    <option value="8192">8K tokens</option>
                    <option value="16384">16K tokens</option>
                    <option value="32768">32K tokens</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Maximum response length (higher values allow longer outputs)
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Apply Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}