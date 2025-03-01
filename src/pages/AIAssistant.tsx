import React, { useState, useRef, useEffect } from 'react';
import { useAI } from '../hooks/useAI';
import { useTheme } from '../contexts/ThemeContext';
import { useKnowledgeBase } from '../hooks/useKnowledgeBase';
import { cn } from '../lib/utils';
import { Bot, Send, Mic, Settings, Loader2, Check, ChevronDown, Plus, Save, Library, Sparkles, Trash2, LineChart, Pin, Edit2, FileText, Image, File } from 'lucide-react';
import type { MessageMetadata, Message, AIDocument, DocumentReference } from '../types/ai';
import { AIModelSelector } from '../components/ai/AIModelSelector';
import { SystemPrompt } from '../components/ai/SystemPrompt';
import { DocumentPicker } from '../components/ai/DocumentPicker';
import { ChatHistory } from '../components/ai/ChatHistory';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { Tooltip } from '../components/ui/Tooltip';
import { AIErrorBoundary } from '../components/error/AIErrorBoundary';
import { Popover, PopoverTrigger, PopoverContent } from '../components/ui/Popover';
import { v4 as uuidv4 } from 'uuid';

interface MessageActions {
  like: () => void;
  dislike: () => void;
  copy: () => void;
  share: () => void;
  toggleCode: () => void;
  bookmark: () => void;
}

interface ModelConfig {
  name: string;
  description: string;
  temperature: number;
  maxTokens: number;
  features?: string[];
  category?: 'general' | 'code' | 'analysis' | 'productivity';
}

interface ModelGroup {
  name: string;
  description: string;
  models: Record<string, ModelConfig>;
  features?: string[];
}

interface SavedPrompt {
  id: string;
  name: string;
  content: string;
  category: 'work' | 'learning' | 'productivity' | 'custom';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  model: string;
  provider: string;
  systemPrompt?: string;
  category?: 'work' | 'learning' | 'productivity' | 'personal';
  tags?: string[];
  pinned?: boolean;
  documents?: AIDocument[];
  clientId?: string;
  caseType?: string;
  caseStatus?: 'active' | 'pending' | 'closed';
  lastAccessed?: Date;
}

interface WorkflowSuggestion {
  id: string;
  title: string;
  description: string;
  category: 'efficiency' | 'learning' | 'focus' | 'organization';
  impact: 'high' | 'medium' | 'low';
  timeToImplement: number; // in minutes
  steps: string[];
  aiAgent?: string;
}

const modelGroups: Record<string, ModelGroup> = {
  gemini: {
    name: 'Gemini',
    description: 'Google\'s most capable AI models',
    models: {
      'gemini-2.0-flash': {
        name: 'Gemini 2.0 Flash',
        description: 'Next-gen features and improved capabilities',
        temperature: 0.7,
        maxTokens: 4096,
        category: 'general',
        features: ['Multimodal support', 'Next-gen features', 'Improved capabilities']
      },
      'gemini-2.0-flash-lite': {
        name: 'Gemini 2.0 Flash-Lite',
        description: 'Fast and cost-efficient for high-frequency tasks',
        temperature: 0.5,
        maxTokens: 2048,
        category: 'productivity',
        features: ['High performance', 'Cost-efficient', 'Fast response time']
      },
      'gemini-2.0-pro': {
        name: 'Gemini 2.0 Pro',
        description: 'Best performing for reasoning tasks',
        temperature: 0.9,
        maxTokens: 8192,
        category: 'analysis',
        features: ['Advanced reasoning', 'Wide task support', 'Best performance']
      },
      'gemini-1.5-flash': {
        name: 'Gemini 1.5 Flash',
        description: 'Optimized for quick responses and real-time applications',
        temperature: 0.7,
        maxTokens: 4096,
        category: 'productivity',
        features: ['Real-time processing', 'Low latency', 'Efficient scaling']
      },
      'gemini-1.5-pro': {
        name: 'Gemini 1.5 Pro',
        description: 'Balanced model for complex reasoning and analysis',
        temperature: 0.8,
        maxTokens: 8192,
        category: 'analysis',
        features: ['Complex reasoning', 'Detailed analysis', 'Balanced performance']
      }
    }
  },
  xai: {
    name: 'xAI/Grok',
    description: 'Advanced AI models with real-time knowledge',
    models: {
      'grok-1': {
        name: 'Grok-1',
        description: 'Latest model with real-time data access',
        temperature: 0.8,
        maxTokens: 8192,
        category: 'general',
        features: ['Real-time knowledge', 'Contextual understanding', 'Advanced reasoning']
      },
      'grok-1-pro': {
        name: 'Grok-1 Pro',
        description: 'Enhanced version for professional applications',
        temperature: 0.9,
        maxTokens: 12288,
        category: 'analysis',
        features: ['Professional tools', 'Advanced analytics', 'Enterprise features']
      }
    }
  },
  openai: {
    name: 'OpenAI',
    description: 'Powerful and versatile language models',
    models: {
      'gpt-4': {
        name: 'GPT-4',
        description: 'Most capable model for complex tasks',
        temperature: 0.7,
        maxTokens: 8192,
        category: 'general',
        features: ['Advanced reasoning', 'Complex problem solving', 'Creative generation']
      },
      'gpt-3.5-turbo': {
        name: 'GPT-3.5 Turbo',
        description: 'Fast and efficient for most tasks',
        temperature: 0.7,
        maxTokens: 4096,
        category: 'productivity',
        features: ['Quick responses', 'Cost effective', 'General purpose']
      }
    }
  }
};

const getModelMode = (model: string): 'flash' | 'flash-lite' | 'pro' => {
  if (model.includes('flash-lite')) return 'flash-lite';
  if (model.includes('flash')) return 'flash';
  return 'pro';
};

interface FileUploadHandler {
  (fileOrEvent: File | React.ChangeEvent<HTMLInputElement>): Promise<void>;
}

export function AIAssistantPage() {
  const { sendMessage, updateConfig, config, isLoading } = useAI();
  const { currentTheme } = useTheme();
  const { documents, addDocument, syncDriveDocuments, isIndexing, syncStatus } = useKnowledgeBase({
    enableDriveSync: true,
    autoIndex: true,
    maxResults: 10
  });
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'openai' | 'xai'>('gemini');
  const [selectedModel, setSelectedModel] = useState('gemini-pro');
  const [selectedDocs, setSelectedDocs] = useState<AIDocument[]>([]);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isListening, toggleListening, transcript } = useVoiceInput();
  const [messageReactions, setMessageReactions] = useState<Record<string, 'like' | 'dislike' | null>>({});
  const [codeView, setCodeView] = useState<Record<string, boolean>>({});
  const [bookmarkedMessages, setBookmarkedMessages] = useState<Set<string>>(new Set());
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);
  const [promptName, setPromptName] = useState('');
  const [promptCategory, setPromptCategory] = useState<SavedPrompt['category']>('custom');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [workflowSuggestions, setWorkflowSuggestions] = useState<WorkflowSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!input.trim() || isLoading) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date(),
      metadata: { mode: getModelMode(selectedModel) }
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');

    try {
      // Convert AIDocument to DocumentReference
      const documentReferences: DocumentReference[] = selectedDocs.map(doc => ({
        id: doc.id,
        title: doc.title,
        excerpt: doc.content.substring(0, 200) + '...',
        type: doc.type === 'pdf' || doc.type === 'doc' || doc.type === 'txt' || doc.type === 'md' 
          ? doc.type 
          : 'md',
        relevance: 1
      }));

      const response = await sendMessage(input, {
        systemPrompt,
        context: documentReferences,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response || 'Sorry, I encountered an error.',
        role: 'assistant',
        timestamp: new Date(),
        metadata: { mode: getModelMode(selectedModel) }
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error processing your request.',
        role: 'error',
        timestamp: new Date(),
        metadata: { mode: getModelMode(selectedModel), error: true }
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
    setMessageReactions(prev => {
      const newReactions = { ...prev };
      delete newReactions[messageId];
      return newReactions;
    });
    setCodeView(prev => {
      const newCodeView = { ...prev };
      delete newCodeView[messageId];
      return newCodeView;
    });
    setBookmarkedMessages(prev => {
      const newSet = new Set(prev);
      newSet.delete(messageId);
      return newSet;
    });
  };

  const handleMessageAction = (messageId: string, action: keyof MessageActions) => {
    switch (action) {
      case 'like':
        setMessageReactions(prev => ({ ...prev, [messageId]: 'like' }));
        break;
      case 'dislike':
        setMessageReactions(prev => ({ ...prev, [messageId]: 'dislike' }));
        break;
      case 'copy':
        const message = messages.find(m => m.id === messageId);
        if (message) {
          navigator.clipboard.writeText(message.content);
        }
        break;
      case 'share':
        // Implement share functionality
        break;
      case 'toggleCode':
        setCodeView(prev => ({ ...prev, [messageId]: !prev[messageId] }));
        break;
      case 'bookmark':
        setBookmarkedMessages(prev => {
          const newSet = new Set(prev);
          if (newSet.has(messageId)) {
            newSet.delete(messageId);
          } else {
            newSet.add(messageId);
          }
          return newSet;
        });
        break;
    }
  };

  const renderMessageActions = (message: Message): MessageActions => ({
    like: () => handleMessageAction(message.id, 'like'),
    dislike: () => handleMessageAction(message.id, 'dislike'),
    copy: () => handleMessageAction(message.id, 'copy'),
    share: () => handleMessageAction(message.id, 'share'),
    toggleCode: () => handleMessageAction(message.id, 'toggleCode'),
    bookmark: () => handleMessageAction(message.id, 'bookmark')
  });

  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = event.target.files;
    if (files) {
      await processFiles(Array.from(files));
    }
  };

  const processFiles = async (files: File[]): Promise<void> => {
    for (const file of files) {
      const reader = new FileReader();
      await new Promise<void>((resolve, reject) => {
        reader.onload = (e) => {
          const content = e.target?.result as string;
          const newDoc: AIDocument = {
            id: uuidv4(),
            title: file.name,
            content,
            type: file.type.includes('image') ? 'image' : 'doc',
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            folderId: currentConversation || null
          };
          
          if (currentConversation) {
            const conversation = conversations.find(c => c.id === currentConversation);
            if (conversation) {
              conversation.documents = [...(conversation.documents || []), newDoc];
              setConversations([...conversations]);
            }
          }
          resolve();
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSavePrompt = () => {
    if (!systemPrompt.trim() || !promptName.trim()) return;
    
    const newPrompt: SavedPrompt = {
      id: Date.now().toString(),
      name: promptName,
      content: systemPrompt,
      category: promptCategory,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setSavedPrompts(prev => [...prev, newPrompt]);
    setPromptName('');
  };

  const handleNewChat = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'New Case',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      model: selectedModel,
      provider: selectedProvider,
      category: 'work',
      tags: [],
      documents: [],
      caseType: 'Workers Compensation',
      caseStatus: 'active',
      systemPrompt: 'You are a legal assistant specializing in California Workers Compensation law. Help analyze cases, draft documents, and provide relevant legal citations.'
    };
    
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversation(newConversation.id);
    setMessages([]);
    setShowNewChat(false);
    setSystemPrompt(newConversation.systemPrompt ?? '');
  };

  const analyzeWorkflow = async () => {
    setIsAnalyzing(true);
    try {
      // Analyze recent conversations and patterns
      const patterns = conversations.reduce((acc, conv) => {
        const topics = extractTopics(conv.messages);
        const timeSpent = calculateTimeSpent(conv.messages);
        const efficiency = analyzeEfficiency(conv.messages);
        return [...acc, { topics, timeSpent, efficiency }];
      }, [] as any[]);

      // Generate workflow suggestions
      const suggestions: WorkflowSuggestion[] = [
        {
          id: '1',
          title: 'Optimize Meeting Discussions',
          description: 'Use AI to prepare and summarize meeting notes for better efficiency',
          category: 'efficiency',
          impact: 'high',
          timeToImplement: 15,
          steps: [
            'Create meeting agenda template',
            'Use AI to extract key points',
            'Generate action items automatically'
          ]
        },
        {
          id: '2',
          title: 'Learning Path Optimization',
          description: 'Personalized learning recommendations based on your interactions',
          category: 'learning',
          impact: 'medium',
          timeToImplement: 30,
          steps: [
            'Analyze knowledge gaps',
            'Create custom learning plan',
            'Track progress with AI'
          ]
        },
        {
          id: '3',
          title: 'Focus Time Blocks',
          description: 'AI-suggested time blocks for deep work based on your patterns',
          category: 'focus',
          impact: 'high',
          timeToImplement: 20,
          steps: [
            'Analyze productive periods',
            'Schedule focus blocks',
            'Minimize interruptions'
          ]
        }
      ];

      setWorkflowSuggestions(suggestions);
    } catch (error) {
      console.error('Error analyzing workflow:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const extractTopics = (messages: Message[]): string[] => {
    // Extract common topics and themes from messages
    return ['productivity', 'learning', 'meetings', 'coding'];
  };

  const calculateTimeSpent = (messages: Message[]): number => {
    // Calculate time spent on different types of tasks
    return messages.reduce((total, msg) => {
      const processingTime = msg.metadata?.processingTime || 0;
      return total + processingTime;
    }, 0);
  };

  const analyzeEfficiency = (messages: Message[]): number => {
    // Analyze conversation efficiency (response times, task completion, etc.)
    return 0.85; // Example efficiency score
  };

  const updateConversationTitle = (id: string, title: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === id ? { ...conv, title, updatedAt: new Date() } : conv
    ));
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
    if (currentConversation === id) {
      setCurrentConversation(null);
      setMessages([]);
    }
  };

  const pinConversation = (id: string) => {
    setConversations(prev => prev.map(conv =>
      conv.id === id ? { ...conv, pinned: !conv.pinned } : conv
    ));
  };

  const handleTitleEdit = (id: string, title: string) => {
    setEditingTitle(id);
    setNewTitle(title);
  };

  const handleTitleSave = (id: string) => {
    if (newTitle.trim()) {
      updateConversationTitle(id, newTitle);
    }
    setEditingTitle(null);
  };

  return (
    <AIErrorBoundary>
      <div className="flex h-full bg-background">
        {/* Left Sidebar */}
        <div className="w-80 border-r bg-card flex flex-col">
          {/* New Chat Button */}
          <div className="p-4">
            <Button
              className="w-full justify-start space-x-2"
              onClick={handleNewChat}
            >
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </Button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
            {/* Pinned Conversations */}
            {conversations.some(c => c.pinned) && (
              <div className="space-y-2">
                <div className="px-2 text-xs font-medium text-muted-foreground">Pinned Conversations</div>
                {conversations
                  .filter(conv => conv.pinned)
                  .map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setCurrentConversation(conv.id);
                        setMessages(conv.messages);
                        setSystemPrompt(conv.systemPrompt ?? '');
                        setSelectedModel(conv.model);
                        setSelectedProvider(conv.provider as 'gemini' | 'openai' | 'xai');
                      }}
                      className={cn(
                        'w-full p-3 rounded-lg text-left transition-all duration-200',
                        'hover:bg-primary/10 group flex items-center justify-between',
                        currentConversation === conv.id ? 'bg-primary text-primary-foreground' : 'text-foreground'
                      )}
                    >
                      <div className="flex-1 truncate">
                        <div className="flex items-center space-x-2">
                          <Pin className="w-3 h-3 text-primary" />
                          <div className="font-medium truncate">{conv.title}</div>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {conv.messages.length} messages · {new Date(conv.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            pinConversation(conv.id);
                          }}
                        >
                          <Pin className={cn("h-4 w-4", conv.pinned && "text-primary fill-primary")} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </button>
                  ))}
              </div>
            )}

            {/* Recent Conversations */}
            <div className="space-y-2">
              <div className="px-2 text-xs font-medium text-muted-foreground">Recent Conversations</div>
              {conversations
                .filter(conv => !conv.pinned)
                .map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setCurrentConversation(conv.id);
                      setMessages(conv.messages);
                      setSystemPrompt(conv.systemPrompt ?? '');
                      setSelectedModel(conv.model);
                      setSelectedProvider(conv.provider as 'gemini' | 'openai' | 'xai');
                      setSelectedDocs(conv.documents || []);
                    }}
                    className={cn(
                      'w-full p-3 rounded-lg text-left transition-all duration-200 cursor-pointer',
                      'hover:bg-accent/50 group flex items-center justify-between',
                      currentConversation === conv.id 
                        ? 'bg-background border-2 border-primary shadow-lg text-primary font-medium' 
                        : 'text-foreground hover:bg-accent/20'
                    )}
                  >
                    <div className="flex-1 truncate">
                      <div className="flex items-center space-x-2">
                        <span className={cn(
                          'w-2 h-2 rounded-full',
                          conv.caseStatus === 'active' && 'bg-green-500',
                          conv.caseStatus === 'pending' && 'bg-yellow-500',
                          conv.caseStatus === 'closed' && 'bg-gray-500'
                        )} />
                        {editingTitle === conv.id ? (
                          <div className="flex-1 min-w-0">
                            <Input
                              value={newTitle}
                              onChange={(e) => setNewTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleTitleSave(conv.id);
                                } else if (e.key === 'Escape') {
                                  setEditingTitle(null);
                                }
                              }}
                              className="h-6 text-sm"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div className="font-medium truncate flex items-center gap-2">
                            {conv.title}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 opacity-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTitleEdit(conv.id, conv.title);
                              }}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        {conv.documents && conv.documents.length > 0 && (
                          <span className="text-xs bg-primary/10 px-2 py-0.5 rounded-full">
                            {conv.documents.length} docs
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate flex items-center space-x-2">
                        <span>{conv.messages.length} messages</span>
                        <span>·</span>
                        <span>{new Date(conv.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          pinConversation(conv.id);
                        }}
                      >
                        <Pin className={cn("h-4 w-4", conv.pinned && "text-primary fill-primary")} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Workflow Insights */}
          <div className="p-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-sm">Workflow Insights</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAnalyzing(!isAnalyzing)}
                className="text-xs"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <LineChart className="w-3 h-3 mr-1" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
            <div className="space-y-2">
              {workflowSuggestions.map(suggestion => (
                <div
                  key={suggestion.id}
                  className="p-2 rounded-lg bg-primary/5 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{suggestion.title}</span>
                    <span className={cn(
                      'px-1.5 py-0.5 rounded-full text-xs',
                      suggestion.impact === 'high' && 'bg-green-100 text-green-800',
                      suggestion.impact === 'medium' && 'bg-yellow-100 text-yellow-800',
                      suggestion.impact === 'low' && 'bg-blue-100 text-blue-800'
                    )}>
                      {suggestion.impact}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header with animation */}
          <div className="flex items-center justify-between px-6 py-3 border-b bg-gradient-to-r from-primary/5 to-primary/10 backdrop-blur-sm transition-all duration-300">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bot className="w-6 h-6 text-primary animate-pulse" />
                <div className="absolute -inset-1 bg-primary/20 rounded-full blur-sm animate-pulse" />
              </div>
              <h1 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
                AI Assistant
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex items-center space-x-2 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300"
                  >
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    <span>{modelGroups[selectedProvider].models[selectedModel].name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-2 backdrop-blur-md bg-card/95">
                  {Object.entries(modelGroups).map(([provider, group]) => (
                    <div key={provider} className="space-y-2 p-2 rounded-lg hover:bg-primary/5 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm">{group.name}</h3>
                        <span className="text-xs text-muted-foreground">{group.description}</span>
                      </div>
                      <div className="space-y-1">
                        {Object.entries(group.models).map(([id, model]) => (
                          <button
                            key={id}
                            onClick={() => {
                              setSelectedProvider(provider as 'gemini' | 'openai' | 'xai');
                              setSelectedModel(id);
                              updateConfig({ model: id });
                            }}
                            className={cn(
                              'w-full p-2 rounded-lg text-left transition-all duration-200',
                              'hover:bg-primary/10',
                              selectedModel === id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{model.name}</div>
                              <span className={cn(
                                'px-2 py-1 rounded-full text-xs',
                                model.category === 'general' && 'bg-blue-100 text-blue-800',
                                model.category === 'productivity' && 'bg-green-100 text-green-800',
                                model.category === 'analysis' && 'bg-purple-100 text-purple-800',
                                model.category === 'code' && 'bg-orange-100 text-orange-800'
                              )}>
                                {model.category}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">{model.description}</div>
                            {model.features && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {model.features.map((feature, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-xs"
                                  >
                                    {feature}
                                  </span>
                                ))}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </PopoverContent>
              </Popover>

              <Tooltip content="Settings">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(!showSettings)}
                  className="relative"
                >
                  <Settings className="w-5 h-5 transition-transform duration-300 hover:rotate-90" />
                  {showSettings && (
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-sm animate-pulse" />
                  )}
                </Button>
              </Tooltip>
            </div>
          </div>

          {/* Settings Panel with animation */}
          {showSettings && (
            <div className="border-b bg-card/50 divide-y animate-in slide-in-from-top duration-300">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">System Prompt</h3>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPromptLibrary(true)}
                    >
                      <Library className="w-4 h-4 mr-2" />
                      Prompt Library
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSavePrompt()}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Prompt
                    </Button>
                  </div>
                </div>
                <div className="space-y-4">
                  <Input
                    placeholder="Prompt Name"
                    value={promptName}
                    onChange={e => setPromptName(e.target.value)}
                    className="mb-2"
                  />
                  <select
                    value={promptCategory}
                    onChange={e => setPromptCategory(e.target.value as SavedPrompt['category'])}
                    className="w-full p-2 rounded-md border bg-background"
                  >
                    <option value="work">Work</option>
                    <option value="learning">Learning</option>
                    <option value="productivity">Productivity</option>
                    <option value="custom">Custom</option>
                  </select>
                  <SystemPrompt
                    value={systemPrompt}
                    onChange={setSystemPrompt}
                  />
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Knowledge Base</h3>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPromptLibrary(true)}
                    >
                      <Library className="w-4 h-4 mr-2" />
                      Prompt Library
                    </Button>
                  </div>
                </div>
                
                {/* Global Knowledge Base */}
                <div className="space-y-4 mb-6">
                  <h4 className="text-sm font-medium">Global References</h4>
                  <DocumentPicker
                    documents={documents}
                    selectedDocs={selectedDocs}
                    onSelect={setSelectedDocs}
                    onUpload={handleFileInput}
                    onDriveSync={syncDriveDocuments}
                    isSyncing={syncStatus === 'syncing'}
                    categories={['Case Law', 'Labor Codes', 'Petitions', 'Templates']}
                  />
                </div>

                {/* Conversation-specific documents */}
                {currentConversation && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Case-Specific Documents</h4>
                    <DocumentPicker
                      documents={conversations.find(c => c.id === currentConversation)?.documents || []}
                      selectedDocs={selectedDocs}
                      onSelect={(docs) => {
                        setSelectedDocs(docs);
                        setConversations(prev => prev.map(conv =>
                          conv.id === currentConversation
                            ? { ...conv, documents: docs }
                            : conv
                        ));
                      }}
                      onUpload={handleFileInput}
                      categories={['Client Documents', 'Case Files', 'Evidence', 'Communications']}
                    />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Attachments</h3>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Upload Files
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      <Image className="w-4 h-4 mr-2" />
                      Upload Images
                    </Button>
                    {syncDriveDocuments && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={syncDriveDocuments}
                        disabled={isIndexing}
                      >
                        <File className={cn("w-4 h-4 mr-2", isIndexing && "animate-spin")} />
                        {isIndexing ? 'Syncing...' : 'From Drive'}
                      </Button>
                    )}
                  </div>
                </div>

                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileInput}
                  accept=".pdf,.doc,.docx,.txt,.md"
                  multiple
                />
                <input
                  id="image-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileInput}
                  accept="image/*"
                  multiple
                />

                {currentConversation && conversations.find(c => c.id === currentConversation)?.documents && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium">Attached Files</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {conversations.find(c => c.id === currentConversation)?.documents?.map(doc => (
                        <div
                          key={doc.id}
                          className="flex items-center p-2 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-shrink-0 mr-2">
                            {doc.type === 'pdf' && <File className="w-4 h-4 text-red-500" />}
                            {doc.type === 'doc' && <File className="w-4 h-4 text-blue-500" />}
                            {doc.type === 'txt' && <FileText className="w-4 h-4 text-gray-500" />}
                            {doc.type === 'image' && <Image className="w-4 h-4 text-green-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{doc.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(doc.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              if (currentConversation) {
                                setConversations(prev => prev.map(conv =>
                                  conv.id === currentConversation
                                    ? {
                                        ...conv,
                                        documents: conv.documents?.filter(d => d.id !== doc.id)
                                      }
                                    : conv
                                ));
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-background/50">
            <div className="max-w-3xl mx-auto p-6 space-y-6">
              {currentConversation ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className={cn(
                        'w-2 h-2 rounded-full',
                        conversations.find(c => c.id === currentConversation)?.caseStatus === 'active' && 'bg-green-500',
                        conversations.find(c => c.id === currentConversation)?.caseStatus === 'pending' && 'bg-yellow-500',
                        conversations.find(c => c.id === currentConversation)?.caseStatus === 'closed' && 'bg-gray-500'
                      )} />
                      {editingTitle === currentConversation ? (
                        <Input
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleTitleSave(currentConversation);
                            } else if (e.key === 'Escape') {
                              setEditingTitle(null);
                            }
                          }}
                          className="h-8 text-lg font-semibold"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center space-x-2">
                          <h2 className="text-lg font-semibold">
                            {conversations.find(c => c.id === currentConversation)?.title}
                          </h2>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={() => handleTitleEdit(currentConversation, conversations.find(c => c.id === currentConversation)?.title || '')}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Add Files
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('image-upload')?.click()}
                      >
                        <Image className="w-4 h-4 mr-2" />
                        Add Images
                      </Button>
                    </div>
                  </div>
                  <ChatHistory
                    messages={messages}
                    onDelete={handleDeleteMessage}
                    renderActions={renderMessageActions}
                    reactions={messageReactions}
                    codeView={codeView}
                    bookmarked={bookmarkedMessages}
                    mode={getModelMode(selectedModel)}
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <Bot className="w-12 h-12 text-primary animate-pulse" />
                  <h2 className="text-xl font-semibold">Welcome to AI Assistant</h2>
                  <p className="text-muted-foreground max-w-md">
                    Start a new chat or select an existing conversation to begin. Your AI assistant is ready to help with any task.
                  </p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area with animation */}
          <div className="border-t bg-card/95 backdrop-blur-sm">
            <div className="max-w-3xl mx-auto p-4">
              <form onSubmit={handleSubmit} className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything..."
                    disabled={isLoading}
                    className="pr-12 bg-background/50 backdrop-blur-sm transition-all duration-300 focus:bg-background text-base"
                  />
                  <Tooltip content={isListening ? 'Stop listening' : 'Start voice input'}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={toggleListening}
                      className={cn(
                        'absolute right-2 top-1/2 -translate-y-1/2 transition-colors duration-300',
                        isListening && 'text-red-500 animate-pulse'
                      )}
                    >
                      <Mic className="w-5 h-5" />
                    </Button>
                  </Tooltip>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className={cn(
                    "min-w-[100px] transition-all duration-300",
                    isLoading ? "bg-primary/80" : "bg-primary hover:bg-primary/90"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AIErrorBoundary>
  );
} 