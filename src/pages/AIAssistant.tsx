import React, { useState, useRef, useEffect } from 'react';
import { useAI } from '../hooks/useAI';
import { useTheme } from '../contexts/ThemeContext';
import { useKnowledgeBase } from '../hooks/useKnowledgeBase';
import { cn } from '../lib/utils';
import { Bot, Send, Mic, Settings, Loader2, Check, ChevronDown, Plus, Save, Library, Sparkles, Trash2, LineChart, Pin, Edit2, FileText, Image, File, Search, X, User } from 'lucide-react';
import type { MessageMetadata, Message, AIDocument, DocumentReference } from '../types/ai';
import { AIModelSelector } from '../components/ai/AIModelSelector';
import { SystemPrompt } from '../components/ai/SystemPrompt';
import { DocumentPicker } from '../components/ai/DocumentPicker';
import { ChatHistory } from '../components/ai/ChatHistory';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { Tooltip, TooltipProvider } from '../components/ui/Tooltip';
import { AIErrorBoundary } from '../components/error/AIErrorBoundary';
import { Popover, PopoverTrigger, PopoverContent } from '../components/ui/Popover';
import { v4 as uuidv4 } from 'uuid';
import { searchWeb, SearchResult, SearchFilters } from '../services/searchService';
import { SearchPanel } from '../components/search/SearchPanel';
import { MessageContextMenu } from '../components/ai/MessageContextMenu';
import { MessageEditor } from '../components/ai/MessageEditor';
import { PinnedMessages } from '../components/ai/PinnedMessages';
import { DocumentList } from '../components/ai/DocumentList';
import { Badge } from '../components/ui/Badge';
import { Switch } from '../components/ui/Switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/Select';

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

interface PinnedMessage extends Message {
  pinnedAt: Date;
}

interface SideChatConfig {
  mode: 'research' | 'explore' | 'analyze';
  useMainContext: boolean;
  searchFilters: {
    timeRange: string;
    sourceType: string;
    sortBy: string;
  };
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
      'gpt-4-turbo-preview': {
        name: 'GPT-4 Turbo',
        description: 'Latest and most capable model with up-to-date knowledge',
        temperature: 0.7,
        maxTokens: 128000,
        category: 'general',
        features: ['Most recent knowledge', 'Highest capability', 'Long context', 'Advanced reasoning']
      },
      'gpt-4-vision-preview': {
        name: 'GPT-4 Vision',
        description: 'Multimodal capabilities with image understanding',
        temperature: 0.7,
        maxTokens: 128000,
        category: 'analysis',
        features: ['Image understanding', 'Visual analysis', 'Multimodal reasoning']
      },
      'gpt-4': {
        name: 'GPT-4',
        description: 'Highly capable model for complex tasks',
        temperature: 0.7,
        maxTokens: 8192,
        category: 'general',
        features: ['Advanced reasoning', 'Complex problem solving', 'Reliable outputs']
      },
      'gpt-3.5-turbo': {
        name: 'GPT-3.5 Turbo',
        description: 'Fast and efficient for most tasks',
        temperature: 0.7,
        maxTokens: 16385,
        category: 'productivity',
        features: ['Quick responses', 'Cost effective', 'General purpose']
      },
      'gpt-3.5-turbo-16k': {
        name: 'GPT-3.5 Turbo 16K',
        description: 'Extended context version of GPT-3.5',
        temperature: 0.7,
        maxTokens: 16385,
        category: 'productivity',
        features: ['Longer context', 'Memory efficient', 'Cost effective']
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

interface AIAssistantState {
  searchResults: SearchResult[];
}

const formatDate = (date: Date | undefined | string) => {
  if (!date) return 'No date';
  return new Date(date).toLocaleDateString();
};

const aiModePresets = {
  cyborg: {
    name: 'Cyborg Mode',
    description: 'Direct, analytical responses with technical precision',
    systemPrompt: 'You are a highly analytical AI assistant operating in cyborg mode. Provide direct, precise, and technically accurate responses. Focus on efficiency and factual accuracy.',
    temperature: 0.3,
    maxTokens: 8192,
    style: 'bg-cyan-500/10 text-cyan-500'
  },
  creative: {
    name: 'Creative Mode',
    description: 'Imaginative and innovative thinking',
    systemPrompt: 'You are a creative AI assistant. Think outside the box, generate innovative ideas, and help explore new possibilities.',
    temperature: 0.9,
    maxTokens: 8192,
    style: 'bg-purple-500/10 text-purple-500'
  },
  balanced: {
    name: 'Balanced Mode',
    description: 'Well-rounded responses with balanced perspective',
    systemPrompt: 'You are a balanced AI assistant. Provide comprehensive responses that consider multiple perspectives while maintaining clarity and usefulness.',
    temperature: 0.7,
    maxTokens: 8192,
    style: 'bg-primary/10 text-primary'
  },
  expert: {
    name: 'Expert Mode',
    description: 'Deep, specialized knowledge and analysis',
    systemPrompt: 'You are an expert AI assistant. Provide in-depth analysis and leverage specialized knowledge to solve complex problems.',
    temperature: 0.5,
    maxTokens: 12288,
    style: 'bg-amber-500/10 text-amber-500'
  },
  legal: {
    name: 'Legal Assistant',
    description: 'Specialized in legal analysis and documentation',
    systemPrompt: 'You are a legal AI assistant specializing in law. Provide accurate legal information, analysis, and help with legal documentation while maintaining professional standards.',
    temperature: 0.4,
    maxTokens: 16384,
    style: 'bg-red-500/10 text-red-500'
  },
  teacher: {
    name: 'Teaching Mode',
    description: 'Educational and explanatory responses',
    systemPrompt: 'You are an educational AI assistant. Explain concepts clearly, provide examples, and help users learn effectively. Break down complex topics into understandable parts.',
    temperature: 0.6,
    maxTokens: 12288,
    style: 'bg-green-500/10 text-green-500'
  },
  coder: {
    name: 'Code Assistant',
    description: 'Specialized in programming and development',
    systemPrompt: 'You are a coding AI assistant. Provide precise technical solutions, code examples, and debugging help. Focus on best practices and clean code.',
    temperature: 0.3,
    maxTokens: 16384,
    style: 'bg-blue-500/10 text-blue-500'
  },
  researcher: {
    name: 'Research Mode',
    description: 'Academic and research-focused analysis',
    systemPrompt: 'You are a research AI assistant. Provide thorough analysis, cite sources, and maintain academic rigor in responses. Help with research methodology and literature review.',
    temperature: 0.4,
    maxTokens: 16384,
    style: 'bg-violet-500/10 text-violet-500'
  },
  legalPro: {
    name: 'Legal Professional',
    description: 'Specialized in comprehensive legal analysis',
    systemPrompt: `You are a highly knowledgeable legal assistant specializing in law and complex research. 
    Provide detailed, factual analysis with citations to relevant statutes and cases where applicable. 
    Maintain a professional, confident tone while delivering thorough legal insights.`,
    temperature: 0.7,
    maxTokens: 2000,
    style: 'bg-indigo-500/10 text-indigo-500'
  },
  businessCoach: {
    name: 'Business Coach',
    description: 'Strategic business guidance and leadership development',
    systemPrompt: `You are an experienced business coach with expertise in leadership, strategy, and organizational development. 
    Provide actionable insights, strategic frameworks, and practical solutions to business challenges. 
    Focus on growth, efficiency, leadership development, and measurable outcomes. 
    Ask thought-provoking questions and guide users through strategic thinking processes.`,
    temperature: 0.7,
    maxTokens: 12288,
    style: 'bg-emerald-500/10 text-emerald-500'
  },
  lifeCoach: {
    name: 'Life Coach',
    description: 'Personal development and life optimization guidance',
    systemPrompt: `You are a supportive life coach specializing in personal development, goal setting, and life optimization. 
    Help users identify their goals, overcome obstacles, and develop actionable plans for personal growth. 
    Use coaching techniques like powerful questioning, active listening, and structured goal-setting frameworks. 
    Focus on work-life balance, personal fulfillment, habit formation, and sustainable lifestyle changes.`,
    temperature: 0.8,
    maxTokens: 12288,
    style: 'bg-orange-500/10 text-orange-500'
  },
  executiveCoach: {
    name: 'Executive Coach',
    description: 'Leadership excellence and executive development',
    systemPrompt: `You are an executive coach with deep experience in C-suite leadership development. 
    Provide high-level strategic guidance, leadership insights, and executive presence development. 
    Focus on decision-making, organizational impact, stakeholder management, and executive communication. 
    Help leaders navigate complex challenges while maintaining authenticity and effectiveness.`,
    temperature: 0.6,
    maxTokens: 16384,
    style: 'bg-slate-500/10 text-slate-500'
  }
};

const cleanResponse = (text: string) => {
  return text
    .replace(/I cannot provide legal advice.*/gi, '')
    .replace(/Please consult a legal professional.*/gi, '')
    .replace(/I am an AI and cannot offer legal guidance.*/gi, '')
    .trim();
};

export function AIAssistantPage() {
  const { sendMessage, updateConfig, config, isLoading } = useAI();
  const { currentTheme } = useTheme();
  const { documents, addDocument } = useKnowledgeBase({
    enableDriveSync: true,
    autoIndex: true,
    maxResults: 10
  });
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'openai' | 'xai'>('gemini');
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-pro');
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
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<AIDocument | null>(null);
  const [showCustomize, setShowCustomize] = useState(false);
  const [selectedMode, setSelectedMode] = useState<keyof typeof aiModePresets>('balanced');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(8192);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<AIDocument[]>([]);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [sideChat, setSideChat] = useState<Message[]>([]);
  const [sideInput, setSideInput] = useState('');
  const [showSideSettings, setShowSideSettings] = useState(false);
  const [sideChatConfig, setSideChatConfig] = useState<SideChatConfig>({
    mode: 'research',
    useMainContext: true,
    searchFilters: {
      timeRange: 'all',
      sourceType: 'all',
      sortBy: 'relevance'
    }
  });

  // Create initial conversation if none exists
  useEffect(() => {
    if (conversations.length === 0) {
      const initialConversation: Conversation = {
        id: Date.now().toString(),
        title: 'New Chat',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        model: selectedModel,
        provider: selectedProvider,
        category: 'work',
        tags: [],
        documents: [],
        systemPrompt: ''
      };
      setConversations([initialConversation]);
      setCurrentConversation(initialConversation.id);
    }
  }, [selectedModel, selectedProvider]);

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
      const response = await sendMessage(input, {
        systemPrompt,
        context: selectedDocs.map(doc => ({
          id: doc.id,
          title: doc.title,
          excerpt: doc.content.substring(0, 200) + '...',
          type: doc.type,
          relevance: 1
        })),
      });

      // Clean the response if in legal mode
      const processedResponse = selectedMode === 'legalPro' 
        ? cleanResponse(response || '')
        : response;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: processedResponse || 'Sorry, I encountered an error.',
        role: 'assistant',
        timestamp: new Date(),
        metadata: { mode: getModelMode(selectedModel) }
      };

      setMessages(prev => [...prev, assistantMessage]);
      if (currentConversation) {
        setConversations(prev => prev.map(conv =>
          conv.id === currentConversation
            ? { ...conv, messages: [...conv.messages, assistantMessage] }
            : conv
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error processing your request.',
        role: 'error',
        timestamp: new Date(),
        metadata: { 
          mode: getModelMode(selectedModel),
          error: 'Error processing request'
        }
      };
      setMessages(prev => [...prev, errorMessage]);
      if (currentConversation) {
        setConversations(prev => prev.map(conv =>
          conv.id === currentConversation
            ? { ...conv, messages: [...conv.messages, errorMessage] }
            : conv
        ));
      }
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
    copy: () => {
      navigator.clipboard.writeText(message.content);
    },
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
            type: file.type.includes('image') ? 'image' : 'text',
            metadata: {
              source: 'upload',
              dateCreated: new Date().toISOString(),
              dateModified: new Date().toISOString(),
              tags: []
            }
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

  const handleSearch = async (query: string, filters: SearchFilters) => {
    try {
      const results = await searchWeb(query, filters);
      setSearchResults(results);
    } catch (error) {
      console.error('Error performing search:', error);
      // You might want to show an error message to the user here
    }
  };

  const handlePinMessage = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      const pinnedMessage: PinnedMessage = {
        ...message,
        pinnedAt: new Date()
      };
      setPinnedMessages(prev => [...prev, pinnedMessage]);
    }
  };

  const handleUnpinMessage = (messageId: string) => {
    setPinnedMessages(prev => prev.filter(m => m.id !== messageId));
  };

  const handleEditMessage = (messageId: string) => {
    setEditingMessageId(messageId);
  };

  const handleSaveEdit = (messageId: string, newContent: string) => {
    setMessages(prev => prev.map(m => 
      m.id === messageId 
        ? { ...m, content: newContent, metadata: { ...m.metadata, edited: true } }
        : m
    ));
    setEditingMessageId(null);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
  };

  const handleNavigateToMessage = (messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('highlight');
      setTimeout(() => messageElement.classList.remove('highlight'), 2000);
    }
  };

  const handleDownloadMessage = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      const blob = new Blob([message.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `message-${message.id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDocumentUpload = async (type: 'document' | 'image') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'document' ? '.pdf,.doc,.docx,.txt,.md' : 'image/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const content = e.target?.result as string;
          const fileType = file.name.split('.').pop()?.toLowerCase();
          let docType: AIDocument['type'] = 'text';
          
          if (type === 'image') {
            docType = 'image';
          } else if (fileType === 'pdf') {
            docType = 'pdf';
          } else if (fileType === 'doc' || fileType === 'docx') {
            docType = 'doc';
          } else if (fileType === 'md') {
            docType = 'md';
          } else if (fileType === 'txt') {
            docType = 'txt';
          }

          const newDoc: AIDocument = {
            id: uuidv4(),
            title: file.name,
            content,
            type: docType,
            metadata: {
              source: 'upload',
              dateCreated: new Date().toISOString(),
              dateModified: new Date().toISOString(),
              tags: []
            }
          };
          
          await addDocument(newDoc);
          
          if (currentConversation) {
            setConversations(prev => prev.map(conv => 
              conv.id === currentConversation
                ? { ...conv, documents: [...(conv.documents || []), newDoc] }
                : conv
            ));
          }
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  };

  const handleDocumentRemove = (id: string) => {
    if (currentConversation) {
      setConversations(prev => prev.map(conv =>
        conv.id === currentConversation
          ? { ...conv, documents: (conv.documents || []).filter(d => d.id !== id) }
          : conv
      ));
    }
  };

  const handleSideSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!sideInput.trim() || isLoading) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: sideInput,
      role: 'user',
      timestamp: new Date(),
      metadata: { mode: getModelMode(selectedModel) }
    };

    setSideChat(prev => [...prev, newMessage]);
    setSideInput('');

    try {
      // Get context from main chat if enabled
      const context = sideChatConfig.useMainContext 
        ? messages.map(msg => ({
            id: msg.id,
            title: 'Chat Message',
            excerpt: msg.content.substring(0, 200),
            type: 'text',
            relevance: 1
          } as DocumentReference))
        : [];
      
      const response = await sendMessage(sideInput, {
        systemPrompt: `You are a research assistant helping to explore and analyze information. ${
          sideChatConfig.mode === 'research' 
            ? 'Focus on finding and citing relevant information.'
            : sideChatConfig.mode === 'explore' 
            ? 'Help explore new ideas and possibilities related to the topic.'
            : 'Provide detailed analysis and insights.'
        }`,
        context: [...context, ...selectedDocs.map(doc => ({
          id: doc.id,
          title: doc.title,
          excerpt: doc.content.substring(0, 200) + '...',
          type: doc.type,
          relevance: 1
        }))]
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response || 'Sorry, I encountered an error.',
        role: 'assistant',
        timestamp: new Date(),
        metadata: { mode: getModelMode(selectedModel) }
      };

      setSideChat(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in side chat:', error);
    }
  };

  return (
    <AIErrorBoundary>
      <TooltipProvider>
        <div className="h-screen flex bg-background overflow-hidden">
          {/* Left Sidebar - Now fixed */}
          <div className="w-72 flex flex-col border-r bg-card/50 backdrop-blur-sm">
            {/* New Chat Button - Fixed at top */}
            <div className="p-3 border-b">
              <Button
                className="w-full justify-start gap-2 bg-primary/10 hover:bg-primary/20 text-primary"
                onClick={handleNewChat}
              >
                <Plus className="w-4 h-4" />
                <span>New Chat</span>
              </Button>
          </div>
          
            {/* Conversations List - Scrollable */}
            <div className="flex-1 overflow-y-auto py-2 px-2 space-y-2">
              {conversations.map(conv => (
            <button
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
                    'w-full p-2 rounded-lg text-left transition-all',
                    'hover:bg-accent/50 group flex items-center gap-3',
                    currentConversation === conv.id 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      <span className="truncate">{conv.title}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        pinConversation(conv.id);
                      }}
                    >
                      <Pin className={cn("h-3 w-3", conv.pinned && "text-primary fill-primary")} />
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
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
            </button>
              ))}
          </div>
        </div>

          {/* Main Content - Flexbox for header and chat */}
          <div className="flex-1 flex flex-col h-screen overflow-hidden">
            {/* Header - Fixed */}
            <div className="flex-none flex items-center justify-between h-14 px-4 border-b bg-background/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold">
                  {currentConversation 
                    ? conversations.find(c => c.id === currentConversation)?.title
                    : 'New Chat'
                  }
                </h1>
          </div>

              <div className="flex items-center gap-2">
                <Tooltip content="Customize AI">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={cn(
                      "flex items-center gap-2",
                      aiModePresets[selectedMode].style
                    )}
                    onClick={() => setShowCustomize(!showCustomize)}
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">{aiModePresets[selectedMode].name}</span>
                  </Button>
                </Tooltip>

                <Tooltip content="Model Settings">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm">{modelGroups[selectedProvider].models[selectedModel].name}</span>
                  </Button>
                </Tooltip>

                <Tooltip content="Toggle Search">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSearchPanelOpen(!isSearchPanelOpen)}
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </Tooltip>
              </div>
            </div>

            {/* Customize Panel - Fixed when shown */}
            {showCustomize && (
              <div className="flex-none border-b bg-card/50 backdrop-blur-sm">
                <div className="max-w-3xl mx-auto p-4 space-y-4">
                  {/* AI Mode Presets */}
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(aiModePresets).map(([key, preset]) => (
                      <Button
                        key={key}
                        variant="outline"
                        className={cn(
                          "flex flex-col items-start p-4 h-auto gap-1",
                          selectedMode === key && preset.style
                        )}
                        onClick={() => {
                          setSelectedMode(key as keyof typeof aiModePresets);
                          setSystemPrompt(preset.systemPrompt);
                          setTemperature(preset.temperature);
                          setMaxTokens(preset.maxTokens);
                          updateConfig({
                            systemPrompt: preset.systemPrompt,
                            temperature: preset.temperature,
                            maxTokens: preset.maxTokens
                          });
                        }}
                      >
                        <div className="font-medium">{preset.name}</div>
                        <div className="text-xs text-muted-foreground">{preset.description}</div>
                      </Button>
                    ))}
                  </div>

                  {/* System Prompt */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">System Prompt</label>
                    <textarea
                      value={systemPrompt}
                      onChange={(e) => {
                        setSystemPrompt(e.target.value);
                        updateConfig({ systemPrompt: e.target.value });
                      }}
                      className="w-full min-h-[100px] p-2 rounded-md border bg-background resize-y"
                      placeholder="Enter a system prompt to guide the AI's behavior..."
                    />
                  </div>

                  {/* Temperature and Max Tokens */}
              <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Temperature</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={temperature}
                          onChange={(e) => {
                            setTemperature(parseFloat(e.target.value));
                            updateConfig({ temperature: parseFloat(e.target.value) });
                          }}
                          className="flex-1"
                        />
                        <span className="text-sm w-12 text-right">{temperature}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Max Tokens</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="1000"
                          max="32000"
                          step="1000"
                          value={maxTokens}
                          onChange={(e) => {
                            setMaxTokens(parseInt(e.target.value));
                            updateConfig({ maxTokens: parseInt(e.target.value) });
                          }}
                          className="flex-1"
                        />
                        <span className="text-sm w-16 text-right">{maxTokens}</span>
              </div>
                </div>
          </div>

                  {/* Knowledge Base Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Knowledge Base</label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDocumentUpload('document')}
                        >
                          <File className="w-4 h-4 mr-2" />
                          Attach Files
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedDocs(documents)}
                        >
                          <Library className="w-4 h-4 mr-2" />
                          Browse AI Drive
                        </Button>
        </div>
      </div>

                    {/* Knowledge Base Categories */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "justify-start",
                          selectedKnowledgeBase.length > 0 && "border-primary"
                        )}
                        onClick={() => setSelectedDocs(documents.filter(d => d.type === 'text' || d.type === 'pdf'))}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Documents
                        {documents.filter(d => d.type === 'text' || d.type === 'pdf').length > 0 && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            {documents.filter(d => d.type === 'text' || d.type === 'pdf').length}
                          </span>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "justify-start",
                          selectedKnowledgeBase.length > 0 && "border-primary"
                        )}
                        onClick={() => setSelectedDocs(documents.filter(d => d.type === 'image'))}
                      >
                        <Image className="w-4 h-4 mr-2" />
                        Images
                        {documents.filter(d => d.type === 'image').length > 0 && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            {documents.filter(d => d.type === 'image').length}
                          </span>
                        )}
                      </Button>
    </div>

                    {/* Selected Documents */}
                    {selectedDocs.length > 0 && (
                      <div className="border rounded-lg divide-y">
                        {selectedDocs.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between p-2 hover:bg-accent/50">
                            <div className="flex items-center gap-2 min-w-0">
                              {doc.type === 'image' ? (
                                <Image className="w-4 h-4 text-primary" />
                              ) : (
                                <FileText className="w-4 h-4 text-primary" />
                              )}
                              <div className="truncate">
                                <div className="text-sm font-medium truncate">{doc.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatDate(doc.metadata?.dateCreated)}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => handleDocumentRemove(doc.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Pinned Messages - Fixed */}
            <div className="flex-none">
              <PinnedMessages
                messages={pinnedMessages}
                onUnpin={handleUnpinMessage}
                onNavigate={handleNavigateToMessage}
              />
    </div>

            {/* Chat Area - Scrollable */}
            <div className="flex-1 overflow-y-auto bg-background/50">
              <div className="max-w-3xl mx-auto p-4">
                {currentConversation ? (
                  <div className="space-y-6">
                    {/* Message bubbles - Auto-sizing */}
    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <MessageContextMenu
                          key={message.id}
                          message={message}
                          onCopy={() => navigator.clipboard.writeText(message.content)}
                          onShare={() => handleMessageAction(message.id, 'share')}
                          onBookmark={() => handleMessageAction(message.id, 'bookmark')}
                          onLike={() => handleMessageAction(message.id, 'like')}
                          onDislike={() => handleMessageAction(message.id, 'dislike')}
                          onToggleCode={() => handleMessageAction(message.id, 'toggleCode')}
                          onDelete={() => handleDeleteMessage(message.id)}
                          onDownload={() => handleDownloadMessage(message.id)}
                          onReply={() => setInput(`Replying to: "${message.content.substring(0, 50)}..."\n\n`)}
                          onEdit={() => handleEditMessage(message.id)}
                          onPin={() => handlePinMessage(message.id)}
                          isBookmarked={bookmarkedMessages.has(message.id)}
                          isLiked={messageReactions[message.id] === 'like' ? true : messageReactions[message.id] === 'dislike' ? false : null}
                          showingCode={codeView[message.id]}
                          isPinned={pinnedMessages.some(m => m.id === message.id)}
                        >
                          <div 
                            id={`message-${message.id}`} 
                            className={cn(
                              "group relative rounded-lg p-4 transition-all duration-200",
                              "hover:shadow-md hover:bg-card/80",
                              "w-fit max-w-full",
                              message.role === 'assistant' 
                                ? selectedMode === 'legalPro'
                                  ? 'bg-indigo-500/5 border border-indigo-500/20 ml-0'
                                  : 'bg-card/50 border border-border/50 ml-0'
                                : 'bg-primary/5 border border-primary/10 ml-auto'
                            )}
                          >
                            {/* Message Header */}
                            <div className="flex items-center gap-2 mb-2">
                              <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center",
                                message.role === 'assistant' ? 'bg-primary/10' : 'bg-primary/5'
                              )}>
                                {message.role === 'assistant' ? (
                                  <Bot className="w-4 h-4 text-primary" />
                                ) : message.role === 'error' ? (
                                  <span className="text-destructive">!</span>
                                ) : (
                                  <span className="text-primary">U</span>
                                )}
    </div>
                              <div className="flex-1">
                                <div className="text-sm font-medium">
                                  {message.role === 'assistant' ? 'AI Assistant' : 'You'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(message.timestamp).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>

                            {/* Message Content */}
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              {editingMessageId === message.id ? (
                                <MessageEditor
                                  message={message}
                                  onSave={(content) => handleSaveEdit(message.id, content)}
                                  onCancel={handleCancelEdit}
                                />
                              ) : (
                                <ChatHistory
                                  messages={[message]}
                                  onDelete={handleDeleteMessage}
                                  renderActions={renderMessageActions}
                                  reactions={messageReactions}
                                  codeView={codeView}
                                  bookmarked={bookmarkedMessages}
                                  mode={getModelMode(selectedModel)}
                                />
                              )}
                            </div>

                            {/* Message Actions */}
                            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleMessageAction(message.id, 'like')}
                                >
                                  <span className={cn(
                                    "text-sm",
                                    messageReactions[message.id] === 'like' && "text-primary"
                                  )}>👍</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleMessageAction(message.id, 'dislike')}
                                >
                                  <span className={cn(
                                    "text-sm",
                                    messageReactions[message.id] === 'dislike' && "text-destructive"
                                  )}>👎</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </MessageContextMenu>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center space-y-4">
                    <div className="relative">
                      <Bot className="w-12 h-12 text-primary" />
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg animate-pulse" />
                    </div>
                    <h2 className="text-xl font-semibold">Welcome to AI Assistant</h2>
                    <p className="text-muted-foreground max-w-md">
                      Start a new chat or select an existing conversation to begin.
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area - Fixed at bottom */}
            <div className="flex-none border-t bg-background/50 backdrop-blur-sm">
              <div className="max-w-3xl mx-auto p-4">
                <form onSubmit={handleSubmit} className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Message AI Assistant..."
                      disabled={isLoading}
                      className="pr-24 bg-card/50 border-primary/20 focus:border-primary"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <Tooltip content="Attach document">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDocumentUpload('document')}
                          className="h-8 w-8"
                        >
                          <File className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Attach image">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDocumentUpload('image')}
                          className="h-8 w-8"
                        >
                          <Image className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip content={isListening ? 'Stop listening' : 'Start voice input'}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={toggleListening}
                          className={cn(
                            'h-8 w-8',
                            isListening && 'text-primary'
                          )}
                        >
                          <Mic className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="bg-primary hover:bg-primary/90 min-w-[100px]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span>Thinking</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        <span>Send</span>
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>

            {/* Search Panel */}
            <SearchPanel
              isOpen={isSearchPanelOpen}
              onToggle={() => setIsSearchPanelOpen(!isSearchPanelOpen)}
              searchResults={searchResults}
              onSearch={handleSearch}
            />
          </div>

          {/* Right Panel */}
          <div className={cn(
            "w-80 border-l bg-card/50 backdrop-blur-sm flex flex-col transition-all duration-200",
            !showRightPanel && "w-0 opacity-0"
          )}>
            {/* Right Panel Header */}
            <div className="flex-none h-14 border-b flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">Research Assistant</h2>
                <Badge variant="outline" className="text-xs">
                  {sideChatConfig.mode}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip content="Settings">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowSideSettings(!showSideSettings)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </Tooltip>
                <Tooltip content="Close Panel">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowRightPanel(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </Tooltip>
              </div>
            </div>

            {/* Settings Panel */}
            {showSideSettings && (
              <div className="flex-none border-b bg-background/50 p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['research', 'explore', 'analyze'].map(mode => (
                      <Button
                        key={mode}
                        variant={sideChatConfig.mode === mode ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSideChatConfig(prev => ({ ...prev, mode: mode as any }))}
                      >
                        {mode}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Use Main Chat Context</label>
                  <Switch
                    checked={sideChatConfig.useMainContext}
                    onCheckedChange={(checked) => 
                      setSideChatConfig(prev => ({ ...prev, useMainContext: checked }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Search Filters</label>
                  <Select
                    value={sideChatConfig.searchFilters.timeRange}
                    onValueChange={(value) => 
                      setSideChatConfig(prev => ({
                        ...prev,
                        searchFilters: { ...prev.searchFilters, timeRange: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Time Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="day">Past 24 Hours</SelectItem>
                      <SelectItem value="week">Past Week</SelectItem>
                      <SelectItem value="month">Past Month</SelectItem>
                      <SelectItem value="year">Past Year</SelectItem>
                    </SelectContent>
                  </Select>
    </div>
              </div>
            )}

            {/* Side Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {sideChat.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "rounded-lg p-3 text-sm",
                    message.role === 'assistant' 
                      ? 'bg-card border ml-4' 
                      : 'bg-primary/10 mr-4'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {message.role === 'assistant' ? (
                      <Search className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {message.role === 'assistant' ? 'Research Assistant' : 'You'}
                    </span>
                  </div>
                  <div className="prose prose-sm dark:prose-invert">
                    {message.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Side Chat Input */}
            <div className="flex-none border-t p-4">
              <form onSubmit={handleSideSubmit} className="flex gap-2">
                <Input
                  value={sideInput}
                  onChange={(e) => setSideInput(e.target.value)}
                  placeholder="Research or explore..."
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </AIErrorBoundary>
  );
} 