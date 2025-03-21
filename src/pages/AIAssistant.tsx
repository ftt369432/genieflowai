import React, { useState, useRef, useEffect } from 'react';
import { useAI } from '../hooks/useAI';
import { useTheme } from '../contexts/ThemeContext';
import { useKnowledgeBase } from '../hooks/useKnowledgeBase';
import { cn } from '../lib/utils';
import { Bot, Send, Mic, Settings, Loader2, Check, ChevronDown, Plus, Save, Library, Sparkles, Trash2, LineChart, Pin, Edit2, FileText, Image, File, Search, X, User, ExternalLink, Code, PenTool, BarChart, GraduationCap } from 'lucide-react';
import type { Message, AIDocument, DocumentReference, SearchFilters, DocumentProcessingOptions } from '../types/ai';
import type { MessageMetadata as BaseMessageMetadata } from '../types/ai';
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
import { searchWeb, SearchResult as SearchResultType, SearchFilters as SearchFiltersType } from '../services/searchService';
import { SearchPanel } from '../components/search/SearchPanel';
import { MessageContextMenu } from '../components/ai/MessageContextMenu';
import { MessageEditor } from '../components/ai/MessageEditor';
import { PinnedMessages } from '../components/ai/PinnedMessages';
import { DocumentList } from '../components/ai/DocumentList';
import { Badge } from '../components/ui/Badge';
import { Switch } from '../components/ui/Switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/Select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/Dialog';
import { Textarea } from '../components/ui/Textarea';
import { Checkbox } from '../components/ui/Checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { FolderPlus, Eye } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { readFileContent, extractTextFromDocument, generateDocumentSummary, detectDocumentLanguage, extractDocumentMetadata, performOCROnImage, splitIntoChunks, generateEmbedding } from '../utils/documentProcessing';
import { Separator } from '../components/ui/Separator';

interface MessageMetadata extends BaseMessageMetadata {
  edited?: boolean;
  threadId?: string;
  parentId?: string;
  reactions?: { [key: string]: string[] };
  formatting?: {
    isBold?: boolean;
    isItalic?: boolean;
    isCode?: boolean;
    language?: string;
  };
}

interface MessageActions {
  like: () => void;
  dislike: () => void;
  copy: () => void;
  share: () => void;
  toggleCode: () => void;
  bookmark: () => void;
  react: (emoji: string) => void;
  reply: () => void;
  thread: () => void;
  format: (type: 'bold' | 'italic' | 'code', language?: string) => void;
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

export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon' | 'xs';

interface WebSearchResult {
  id: string;
  title: string;
  content: string;
  snippet: string;
  link: string;
  credibilityScore: number;
  citations: number;
  date: string;
  type: 'article' | 'news' | 'blog' | 'academic';
  language: string;
  excerpt: string;
  position: number;
  source: string;
  lastUpdated?: Date;
}

interface CitationStyle {
  id: string;
  name: string;
  format: (result: WebSearchResult) => string;
}

const citationStyles: CitationStyle[] = [
  {
    id: 'apa',
    name: 'APA',
    format: (result) => `${result.title}. (${new Date(result.date || Date.now()).getFullYear()}). Retrieved from ${result.link}`
  },
  {
    id: 'mla',
    name: 'MLA',
    format: (result) => `"${result.title}." ${result.link}, ${new Date(result.date || Date.now()).toLocaleDateString()}`
  },
  {
    id: 'chicago',
    name: 'Chicago',
    format: (result) => `${result.title}. Accessed ${new Date(result.date || Date.now()).toLocaleDateString()}`
  }
];

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
  searchResults: WebSearchResult[];
}

const formatDate = (date: Date | undefined | string) => {
  if (!date) return 'No date';
  return new Date(date).toLocaleDateString();
};

interface AIMode {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  style: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  features: string[];
  tools?: string[];
  contextWindow?: number;
}

const aiModePresets: Record<string, AIMode> = {
  researcher: {
    id: 'researcher',
    name: 'Research Mode',
    description: 'Deep analysis and academic research',
    icon: Search,
    style: 'text-blue-500',
    systemPrompt: 'You are a research assistant focused on deep analysis and academic research.',
    temperature: 0.7,
    maxTokens: 4096,
    features: ['Citation support', 'Academic writing', 'Literature review'],
    tools: ['search', 'summarize', 'cite'],
    contextWindow: 8192
  },
  coder: {
    id: 'coder',
    name: 'Code Assistant',
    description: 'Programming and development help',
    icon: Code,
    style: 'text-green-500',
    systemPrompt: 'You are a coding assistant focused on helping with programming tasks.',
    temperature: 0.3,
    maxTokens: 2048,
    features: ['Code completion', 'Bug fixing', 'Code review'],
    tools: ['code', 'debug', 'test'],
    contextWindow: 4096
  },
  writer: {
    id: 'writer',
    name: 'Writing Assistant',
    description: 'Creative and professional writing',
    icon: PenTool,
    style: 'text-purple-500',
    systemPrompt: 'You are a writing assistant focused on helping create and improve written content.',
    temperature: 0.8,
    maxTokens: 3072,
    features: ['Style suggestions', 'Grammar check', 'Content ideas'],
    tools: ['write', 'edit', 'suggest'],
    contextWindow: 6144
  },
  analyst: {
    id: 'analyst',
    name: 'Data Analyst',
    description: 'Data analysis and visualization',
    icon: BarChart,
    style: 'text-yellow-500',
    systemPrompt: 'You are a data analysis assistant focused on helping interpret and visualize data.',
    temperature: 0.4,
    maxTokens: 2048,
    features: ['Data visualization', 'Statistical analysis', 'Trend detection'],
    tools: ['analyze', 'visualize', 'predict'],
    contextWindow: 4096
  },
  teacher: {
    id: 'teacher',
    name: 'Learning Assistant',
    description: 'Educational support and tutoring',
    icon: GraduationCap,
    style: 'text-red-500',
    systemPrompt: 'You are a teaching assistant focused on helping learn and understand concepts.',
    temperature: 0.6,
    maxTokens: 3072,
    features: ['Explanations', 'Practice exercises', 'Learning paths'],
    tools: ['explain', 'quiz', 'guide'],
    contextWindow: 6144
  }
};

const cleanResponse = (text: string) => {
  return text
    .replace(/I cannot provide legal advice.*/gi, '')
    .replace(/Please consult a legal professional.*/gi, '')
    .replace(/I am an AI and cannot offer legal guidance.*/gi, '')
    .trim();
};

interface DocumentGroup {
  id: string;
  name: string;
  description: string;
  documents: AIDocument[];
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  type: 'collection' | 'project' | 'research';
  status: 'active' | 'archived';
}

export function AIAssistantPage() {
  const { sendMessage, isLoading } = useAI();
  const { theme, isDark, toggleTheme } = useTheme();
  const { addDocument } = useKnowledgeBase({
    enableDriveSync: true,
    autoIndex: true,
    maxResults: 10
  });

  const [chatMessages, setChatMessages] = useState<Message[]>([]);
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
  const [searchResults, setSearchResults] = useState<SearchResultType[]>([]);
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
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    timeRange: 'any',
    sourceType: 'all',
    sortBy: 'relevance',
    minCredibility: 0,
    excludedDomains: [],
    includedDomains: [],
    language: 'en',
    contentType: 'all'
  });
  const [selectedCitationStyle, setSelectedCitationStyle] = useState<string>('apa');
  const [savedCitations, setSavedCitations] = useState<{ result: WebSearchResult; style: string }[]>([]);
  const [enabledTools, setEnabledTools] = useState<string[]>([]);
  const [documentGroups, setDocumentGroups] = useState<DocumentGroup[]>([]);
  const [processingOptions, setProcessingOptions] = useState<DocumentProcessingOptions>({
    extractText: true,
    generateSummary: true,
    detectLanguage: true,
    extractMetadata: true,
    performOCR: false,
    splitIntoChunks: true,
    chunkSize: 1000
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
  }, [chatMessages]);

  const handleMessageSubmit = (m: Message) => {
    setChatMessages(prev => [...prev, m]);
  };

  const handleMessageDelete = (messageIdOrMessage: string | Message) => {
    const messageId = typeof messageIdOrMessage === 'string' ? messageIdOrMessage : messageIdOrMessage.id;
    setChatMessages(prev => prev.filter(m => m.id !== messageId));
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

  const handleMessageEdit = (m: Message) => {
    setChatMessages(prev => prev.map(msg => msg.id === m.id ? m : msg));
  };

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

    handleMessageSubmit(newMessage);
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

      handleMessageSubmit(assistantMessage);
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
      handleMessageSubmit(errorMessage);
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

  const handleMessageAction = (messageId: string, action: keyof MessageActions) => {
    switch (action) {
      case 'like':
        setMessageReactions(prev => ({ ...prev, [messageId]: 'like' }));
        break;
      case 'dislike':
        setMessageReactions(prev => ({ ...prev, [messageId]: 'dislike' }));
        break;
      case 'copy':
        const message = chatMessages.find(m => m.id === messageId);
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
    copy: () => navigator.clipboard.writeText(message.content),
    share: () => handleMessageAction(message.id, 'share'),
    toggleCode: () => handleMessageAction(message.id, 'toggleCode'),
    bookmark: () => handleMessageAction(message.id, 'bookmark'),
    react: (emoji: string) => handleMessageReaction(message.id, emoji),
    reply: () => setInput(`Replying to: "${message.content.substring(0, 50)}..."\n\n`),
    thread: () => handleMessageThread(message.id),
    format: (type: 'bold' | 'italic' | 'code', language?: string) => handleMessageFormat(message.id, type, language)
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
            type: file.type.includes('image') ? 'image' : 'text' as const,
            metadata: {
              dateCreated: new Date().toISOString(),
              dateModified: new Date().toISOString(),
              tags: [],
              source: 'upload'
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
    setChatMessages([]);
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
      setChatMessages([]);
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
    }
  };

  const handlePinMessage = (messageId: string) => {
    const message = chatMessages.find(m => m.id === messageId);
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

  const handleMessageReaction = (messageId: string, emoji: string) => {
    setChatMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = (msg.metadata as MessageMetadata)?.reactions || {};
        const userReactions = reactions[emoji] || [];
        const hasReacted = userReactions.includes('user');
        
        return {
          ...msg,
          metadata: {
            ...msg.metadata,
            reactions: {
              ...reactions,
              [emoji]: hasReacted 
                ? userReactions.filter(u => u !== 'user')
                : [...userReactions, 'user']
            }
          }
        };
      }
      return msg;
    }));
  };

  const handleMessageFormat = (messageId: string, type: 'bold' | 'italic' | 'code', language?: string) => {
    setChatMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          metadata: {
            ...msg.metadata,
            formatting: {
              ...(msg.metadata as MessageMetadata)?.formatting,
              [type === 'bold' ? 'isBold' : type === 'italic' ? 'isItalic' : 'isCode']: true,
              ...(type === 'code' && language ? { language } : {})
            }
          }
        };
      }
      return msg;
    }));
  };

  const handleMessageThread = (messageId: string) => {
    const threadId = uuidv4();
    setChatMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          metadata: {
            ...msg.metadata,
            threadId
          }
        };
      }
      return msg;
    }));
  };

  const handleTimeRangeChange = (value: 'any' | 'day' | 'week' | 'month' | 'year') => {
    setSearchFilters(prev => ({ ...prev, timeRange: value }));
  };

  const handleDownloadMessage = (messageId: string) => {
    const message = chatMessages.find(m => m.id === messageId);
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

  const handleNavigateToMessage = (messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('highlight');
      setTimeout(() => messageElement.classList.remove('highlight'), 2000);
    }
  };

  const handleDocumentUpload = async (type: 'document' | 'image') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = type === 'document' 
      ? '.pdf,.doc,.docx,.txt,.md'
      : '.jpg,.jpeg,.png,.gif';
    
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;

      const newDocs: AIDocument[] = [];
      const groupId = uuidv4();
      const groupName = `Upload ${new Date().toLocaleString()}`;

      for (const file of Array.from(files)) {
        try {
          const doc = await processDocument(file, processingOptions);
          newDocs.push(doc);
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
        }
      }

      if (newDocs.length > 0) {
        const newGroup: DocumentGroup = {
          id: groupId,
          name: groupName,
          description: `Uploaded ${newDocs.length} files`,
          documents: newDocs,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
          type: 'collection',
          status: 'active'
        };

        setDocumentGroups(prev => [...prev, newGroup]);
        setSelectedDocs(prev => [...prev, ...newDocs]);
      }
    };

    input.click();
  };

  const processDocument = async (
    file: File, 
    options: DocumentProcessingOptions
  ): Promise<AIDocument> => {
    const content = await readFileContent(file);
    let processedContent = content;
    let summary = '';
    let language = 'en';
    let chunks: string[] = [];
    let embedding: number[] = [];

    if (options.extractText) {
      processedContent = await extractTextFromDocument(content);
    }

    if (options.generateSummary) {
      summary = await generateDocumentSummary(processedContent);
    }

    if (options.detectLanguage) {
      language = await detectDocumentLanguage(processedContent);
    }

    if (options.performOCR && file.type.startsWith('image/')) {
      processedContent = await performOCROnImage(file);
    }

    if (options.splitIntoChunks) {
      chunks = splitIntoChunks(processedContent, options.chunkSize || 1000);
    }

    embedding = await generateEmbedding(processedContent);

    return {
      id: uuidv4(),
      title: file.name,
      content: processedContent,
      type: file.type.includes('image') ? 'image' : 'text',
      metadata: {
        dateCreated: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        tags: [],
        source: 'upload',
        size: file.size
      },
      summary: summary || 'No summary available',
      language,
      chunks: chunks.length > 0 ? chunks : [processedContent],
      embedding: embedding.length > 0 ? embedding : new Array(384).fill(0)
    };
  };

  // Use theme values in the UI
  const containerClassName = `min-h-screen bg-${theme === 'dark' ? 'gray-900' : 'white'} text-${isDark ? 'white' : 'gray-900'}`;
  const headerClassName = `flex items-center justify-between p-4 border-b border-${isDark ? 'gray-700' : 'gray-200'}`;

  return (
    <AIErrorBoundary>
      <TooltipProvider>
        <div className={containerClassName}>
          {/* Left Sidebar - Now with gradient */}
          <div className="w-72 flex flex-col border-r bg-card/90 backdrop-blur-md">
            {/* New Chat Button - Fixed at top with improved styling */}
            <div className="p-3 border-b bg-background/50">
              <Button
                className="w-full justify-start gap-2 bg-gradient-to-r from-primary/20 to-primary/10 hover:from-primary/30 hover:to-primary/20 text-primary shadow-sm"
                onClick={handleNewChat}
              >
                <Plus className="w-4 h-4" />
                <span>New Chat</span>
              </Button>
            </div>
          
            {/* Conversations List - With improved styling */}
            <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1.5">
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  className={cn(
                    'w-full rounded-lg text-left transition-all',
                    'group flex items-center gap-2 px-2',
                    currentConversation === conv.id 
                      ? 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary shadow-sm' 
                      : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Button
                    variant="ghost"
                    className="flex-1 justify-start h-9 px-2 hover:bg-transparent"
                    onClick={() => {
                      setCurrentConversation(conv.id);
                      setChatMessages(conv.messages);
                      setSystemPrompt(conv.systemPrompt ?? '');
                      setSelectedModel(conv.model);
                      setSelectedProvider(conv.provider as 'gemini' | 'openai' | 'xai');
                      setSelectedDocs(conv.documents || []);
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Bot className="w-4 h-4 shrink-0" />
                      <span className="truncate">{conv.title}</span>
                    </div>
                  </Button>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-primary"
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
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
            <header className={headerClassName}>
              {/* Main Header */}
              <div className="flex items-center gap-3">
                  <h1 className="text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {currentConversation 
                      ? conversations.find(c => c.id === currentConversation)?.title
                      : 'New Chat'
                    }
            </h1>
                  {currentConversation && (
                    <Badge variant="outline" className="text-xs font-normal">
                      {chatMessages.length} messages
                    </Badge>
                  )}
          </div>
          
                <div className="flex items-center gap-2">
                  <Tooltip content="Customize AI">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className={cn(
                        "flex items-center gap-2 hover:bg-accent/50",
                        aiModePresets[selectedMode].style
                      )}
                      onClick={() => setShowCustomize(!showCustomize)}
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-sm font-medium">{aiModePresets[selectedMode].name}</span>
                      <ChevronDown className="w-3 h-3 opacity-50" />
                    </Button>
                  </Tooltip>

                  <Tooltip content="Model Settings">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="flex items-center gap-2 hover:bg-accent/50"
                      onClick={() => setShowSettings(!showSettings)}
                    >
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">{modelGroups[selectedProvider].models[selectedModel].name}</span>
                      <ChevronDown className="w-3 h-3 opacity-50" />
                    </Button>
                  </Tooltip>

                  <div className="h-4 w-px bg-border/50" />

                  <Tooltip content="Toggle Research Panel">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("hover:bg-accent/50", showRightPanel && "text-primary")}
                      onClick={() => setShowRightPanel(!showRightPanel)}
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </Tooltip>

                  <Tooltip content="Knowledge Base">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-accent/50"
                      onClick={() => setShowCustomize(true)}
                    >
                      <Library className="w-4 h-4" />
                    </Button>
                  </Tooltip>

                  <Tooltip content="Chat Analytics">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-accent/50"
                      onClick={() => analyzeWorkflow()}
                    >
                      <LineChart className="w-4 h-4" />
                    </Button>
                  </Tooltip>
          </div>
        </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto p-4">
                {currentConversation && (
                  <div className="space-y-4">
                    {pinnedMessages.length > 0 && (
                      <div className="bg-card/50 border rounded-lg p-2 space-y-2">
                        <div className="flex items-center justify-between px-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Pin className="w-4 h-4" />
                            <span>Pinned Messages</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-accent/50"
                            onClick={() => setPinnedMessages([])}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        {pinnedMessages.map(message => (
                          <div
                            key={message.id}
                            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent/50 cursor-pointer text-sm"
                            onClick={() => handleNavigateToMessage(message.id)}
                          >
                            <div className="w-1 h-1 rounded-full bg-primary" />
                            <span className="flex-1 truncate">{message.content}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 hover:bg-accent/50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnpinMessage(message.id);
                              }}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    {chatMessages.map((message) => (
                      <MessageContextMenu
                        key={message.id}
                        message={message}
                        onCopy={() => navigator.clipboard.writeText(message.content)}
                        onShare={() => handleMessageAction(message.id, 'share')}
                        onBookmark={() => handleMessageAction(message.id, 'bookmark')}
                        onLike={() => handleMessageAction(message.id, 'like')}
                        onDislike={() => handleMessageAction(message.id, 'dislike')}
                        onToggleCode={() => handleMessageAction(message.id, 'toggleCode')}
                        onDelete={() => handleMessageDelete(message.id)}
                        onDownload={() => handleDownloadMessage(message.id)}
                        onReply={() => setInput(`Replying to: "${message.content.substring(0, 50)}..."\n\n`)}
                        onEdit={() => handleMessageEdit(message)}
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
                            "hover:shadow-lg",
                            message.role === 'assistant' 
                              ? 'bg-card/95 border border-border/50 ml-0 shadow-sm'
                              : 'bg-primary/10 border border-primary/20 ml-auto shadow-sm'
                          )}
                        >
                          {/* Message Header */}
                          <div className="flex items-center gap-2 mb-2">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center",
                              message.role === 'assistant' 
                                ? 'bg-gradient-to-br from-primary/20 to-primary/10' 
                                : 'bg-gradient-to-br from-primary/20 to-primary/5'
                            )}>
                              {message.role === 'assistant' ? (
                                <Bot className="w-4 h-4 text-primary" />
                              ) : message.role === 'error' ? (
                                <span className="text-destructive">!</span>
                              ) : (
                                <User className="w-4 h-4 text-primary" />
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
                            <div className="flex items-center gap-1">
                              {(message.metadata as MessageMetadata)?.edited && (
                                <span className="text-xs text-muted-foreground">(edited)</span>
                              )}
                              {message.metadata?.mode && (
                                <Badge variant="outline" className="text-xs font-normal">
                                  {message.metadata.mode}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Message Content */}
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            {editingMessageId === message.id ? (
                              <MessageEditor
                                message={message}
                                onSave={(content) => handleMessageEdit(message)}
                                onCancel={() => setEditingMessageId(null)}
                              />
                            ) : (
                              <ChatHistory
                                messages={[message]}
                                onDelete={handleMessageDelete}
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
                                className="h-6 w-6 hover:bg-accent/50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMessageAction(message.id, 'like');
                                }}
                              >
                                <span className={cn(
                                  "text-sm",
                                  messageReactions[message.id] === 'like' && "text-primary"
                                )}>👍</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-accent/50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMessageAction(message.id, 'dislike');
                                }}
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
                )}
                <div ref={messagesEndRef} />
    </div>
            </div>

            {/* Input Area - With improved styling */}
            <div className="flex-none border-t bg-background/95 backdrop-blur-md">
              <div className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-accent/50"
                    onClick={() => handleDocumentUpload('document')}
                  >
                    <FileText className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-accent/50"
                    onClick={() => handleDocumentUpload('image')}
                  >
                    <Image className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className={cn(
            "w-80 border-l bg-card/50 backdrop-blur-sm flex flex-col transition-all duration-200",
            !showRightPanel && "w-0 opacity-0"
          )}>
            {/* Right Panel Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Research Panel</h3>
                <Select
                  value={selectedCitationStyle}
                  onValueChange={setSelectedCitationStyle}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Citation Style" />
                  </SelectTrigger>
                  <SelectContent>
                    {citationStyles.map(style => (
                      <SelectItem key={style.id} value={style.id}>
                        {style.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
    </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={searchFilters.timeRange}
                    onValueChange={handleTimeRangeChange}
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

                  <Select
                    value={searchFilters.contentType}
                    onValueChange={(value: 'all' | 'article' | 'paper' | 'book' | 'code') => 
                      setSearchFilters(prev => ({ ...prev, contentType: value }))
                  }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Content Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="article">Articles</SelectItem>
                      <SelectItem value="paper">Papers</SelectItem>
                      <SelectItem value="book">Books</SelectItem>
                      <SelectItem value="code">Code</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Minimum Credibility</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={searchFilters.minCredibility}
                    onChange={(e) => setSearchFilters(prev => ({ 
                      ...prev, 
                      minCredibility: parseInt(e.target.value) 
                    }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="rounded-lg border bg-card p-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge 
                      variant={result.credibilityScore > 80 ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {result.credibilityScore}% Credible
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(result.date).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h4 className="font-medium mb-1">{result.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {result.snippet}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{result.source}</Badge>
                      <Badge variant="outline">{result.language}</Badge>
                      {result.citations > 0 && (
                        <span className="text-muted-foreground">
                          {result.citations} citations
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setSavedCitations(prev => [
                          ...prev,
                          { result, style: selectedCitationStyle }
                        ])}
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                      {result.link && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => window.open(result.link, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Saved Citations */}
            {savedCitations.length > 0 && (
              <div className="flex-none border-t p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Saved Citations</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSavedCitations([])}
                    className="h-6 px-2 text-xs"
                  >
                    Clear All
                  </Button>
                </div>
                <div className="space-y-2">
                  {savedCitations.map(({ result, style }, index) => (
                    <div key={index} className="text-xs text-muted-foreground">
                      {citationStyles.find(s => s.id === style)?.format(result)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </TooltipProvider>

      {/* AI Mode Customization Dialog */}
      {showCustomize && (
        <Dialog open={showCustomize} onOpenChange={setShowCustomize}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Customize AI Assistant</DialogTitle>
              <DialogDescription>
                Choose a preset mode or customize your own AI assistant configuration.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.values(aiModePresets).map((mode) => {
                  const Icon = mode.icon;
  return (
                    <Button
                      key={mode.id}
                      variant={selectedMode === mode.id ? 'default' : 'outline'}
                      className={cn(
                        'h-auto flex flex-col items-start p-4 gap-2',
                        selectedMode === mode.id && 'ring-2 ring-primary'
                      )}
                      onClick={() => {
                        setSelectedMode(mode.id);
                        setSystemPrompt(mode.systemPrompt);
                        setTemperature(mode.temperature);
                        setMaxTokens(mode.maxTokens);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={cn('h-5 w-5', mode.style)} />
                        <span className="font-medium">{mode.name}</span>
    </div>
                      <p className="text-xs text-muted-foreground">
                        {mode.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {mode.features.map((feature, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </Button>
                  );
                })}
              </div>

              <Separator />

    <div className="space-y-4">
                <h4 className="font-medium">Advanced Settings</h4>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">System Prompt</label>
                  <Textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="Enter a custom system prompt..."
                    className="h-20"
                  />
    </div>

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
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground w-12">
                        {temperature}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max Tokens</label>
                    <Select
                      value={maxTokens.toString()}
                      onValueChange={(value) => setMaxTokens(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1024">1K</SelectItem>
                        <SelectItem value="2048">2K</SelectItem>
                        <SelectItem value="4096">4K</SelectItem>
                        <SelectItem value="8192">8K</SelectItem>
                        <SelectItem value="16384">16K</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCustomize(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setShowCustomize(false);
                // Apply settings
                setSystemPrompt(systemPrompt);
                setTemperature(temperature);
                setMaxTokens(maxTokens);
              }}>
                Apply Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AIErrorBoundary>
  );
} 