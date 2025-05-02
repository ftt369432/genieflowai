import React, { useState, useRef, useEffect, useContext } from 'react';
import { useAI } from '../hooks/useAI';
import { useTheme } from '../contexts/ThemeContext';
import { useKnowledgeBase } from '../hooks/useKnowledgeBase';
import { cn } from '../lib/utils';
import { Bot, Send, Mic, Settings, Loader2, Check, ChevronDown, Plus, Save, Library, Sparkles, Trash2, LineChart, Pin, Edit2, FileText, Image, File, Search, X, User, ExternalLink, Code, PenTool, BarChart, GraduationCap, Brain, Zap, Eye, Menu, ChevronRight, ChevronLeft, Sliders, Copy, MessageSquare, Users } from 'lucide-react';
import type { Message, AIDocument, DocumentReference, SearchFilters, DocumentProcessingOptions, AIAssistant } from '../types/ai';
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
import { FolderPlus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { readFileContent, extractTextFromDocument, generateDocumentSummary, detectDocumentLanguage, extractDocumentMetadata, performOCROnImage, splitIntoChunks, generateEmbedding } from '../utils/documentProcessing';
import { Separator } from '../components/ui/Separator';
import { AISettings } from '../components/AISettings';
import { defaultAIConfig, AIConfig } from '../config/ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MarkdownMessage } from '../components/ai/MarkdownMessage';
import { ProfessionalModeService } from '../services/legalDoc/professionalModeService';
import { AIContext } from '../contexts/AIContext';
import { useAssistantStore } from '../store/assistantStore';
import { Card } from '../components/ui/Card';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
  google: {
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
  balanced: {
    id: 'balanced',
    name: 'Balanced Mode',
    description: 'General purpose assistance with balanced responses',
    icon: Settings,
    style: 'text-primary',
    systemPrompt: 'You are a helpful assistant providing balanced, accurate information.',
    temperature: 0.7,
    maxTokens: 4096,
    features: ['General knowledge', 'Balanced responses', 'Helpful guidance'],
    tools: ['search', 'summarize', 'assist'],
    contextWindow: 8192
  },
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

// Consolidate document processing functions 
const documentUtils = {
  /**
   * Process a file upload and convert it to an AIDocument
   */
  processDocument: async (file: File, options: DocumentProcessingOptions): Promise<AIDocument> => {
    try {
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
        content: processedContent,
        metadata: {
          source: 'upload',
          title: file.name,
          author: '',
          date: new Date(),
          category: '',
          tags: []
        },
        summary: summary || 'No summary available',
        language,
        chunks: chunks.length > 0 ? chunks : [processedContent],
        embedding: embedding.length > 0 ? embedding : new Array(384).fill(0)
      };
    } catch (error) {
      console.error(`Error processing document ${file.name}:`, error);
      throw error;
    }
  },

  /**
   * Process multiple files and add them to the conversation
   */
  processFiles: async (files: File[], options?: DocumentProcessingOptions): Promise<AIDocument[]> => {
    const processedDocs: AIDocument[] = [];
    
    const processingOpts = options || {
      extractText: true,
      generateSummary: true,
      detectLanguage: true,
      extractMetadata: true,
      performOCR: false,
      splitIntoChunks: true,
      chunkSize: 1000
    };
    
    for (const file of files) {
      try {
        const doc = await documentUtils.processDocument(file, processingOpts);
        processedDocs.push(doc);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }
    
    return processedDocs;
  },
  
  /**
   * Upload document(s) from user input and add to the current conversation
   */
  handleDocumentUpload: async (type: 'document' | 'image', conversations: Conversation[], currentConversation: string | null, setSelectedDocs: React.Dispatch<React.SetStateAction<AIDocument[]>>, setDocumentGroups: React.Dispatch<React.SetStateAction<DocumentGroup[]>>, processingOptions: DocumentProcessingOptions) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = type === 'document' 
      ? '.pdf,.doc,.docx,.txt,.md'
      : '.jpg,.jpeg,.png,.gif';
    
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;

      const newDocs = await documentUtils.processFiles(Array.from(files), processingOptions);
      
      if (newDocs.length > 0) {
        // Create document group
        const groupId = uuidv4();
        const groupName = `Upload ${new Date().toLocaleString()}`;
        
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
        
        // Add to selected docs for current conversation
        setSelectedDocs(prev => [...prev, ...newDocs]);
        
        // Update current conversation if one is selected
        if (currentConversation) {
          // We'll need to use the setConversations function to update the current conversation
          // But since this is part of a utility object, we'll need to have that passed in
          // For now, we'll just log that the docs were processed
          console.log(`Added ${newDocs.length} documents to conversation ${currentConversation}`);
        }
      }
    };

    input.click();
  },
  
  /**
   * Handle file input from a file input element
   */
  handleFileInput: async (event: React.ChangeEvent<HTMLInputElement>, processingOptions: DocumentProcessingOptions): Promise<AIDocument[]> => {
    const files = event.target.files;
    if (!files) return [];
    
    return await documentUtils.processFiles(Array.from(files), processingOptions);
  }
};

export function AIAssistantPage() {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    clearMessages, 
    professionalMode, 
    toggleProfessionalMode,
    professionalService
  } = useContext(AIContext);
  const { theme, isDark, toggleTheme } = useTheme();
  const { addDocument } = useKnowledgeBase({
    enableDriveSync: true,
    autoIndex: true,
    maxResults: 10
  });

  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<'google'>('google');
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');
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
  
  // Add state variables for panel collapse
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Replace missing setIsLoading

  // Add new state variables for agent features
  const [activeTab, setActiveTab] = useState<'chat' | 'agents' | 'workflow' | 'research'>('chat');
  const [agentTrackers, setAgentTrackers] = useState<AgentTracker[]>([
    { id: '1', name: 'Research Agent', status: 'active', progress: 75, tasks: 3, lastAction: new Date() },
    { id: '2', name: 'Content Writer', status: 'idle', progress: 100, tasks: 0, lastAction: new Date(Date.now() - 86400000) },
    { id: '3', name: 'Data Analyzer', status: 'pending', progress: 45, tasks: 7, lastAction: new Date() }
  ]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([
    { 
      id: '1', 
      name: 'Daily Report', 
      trigger: 'schedule', 
      schedule: '0 9 * * 1-5', 
      actions: ['generate_report', 'send_email'],
      enabled: true,
      lastRun: new Date(Date.now() - 86400000)
    },
    { 
      id: '2', 
      name: 'New Task Alert', 
      trigger: 'event', 
      event: 'task_created', 
      actions: ['notification', 'agent_analyze'],
      enabled: true,
      lastRun: null
    }
  ]);
  const [learnedPatterns, setLearnedPatterns] = useState<LearnedPattern[]>([
    { 
      id: '1', 
      type: 'task_pattern', 
      description: 'You create most tasks on Monday mornings', 
      confidence: 0.85,
      suggestion: 'Schedule 30 min on Monday mornings for task planning',
      implemented: false
    },
    { 
      id: '2', 
      type: 'productivity_pattern', 
      description: 'Your focus peaks between 10am-12pm', 
      confidence: 0.92,
      suggestion: 'Schedule deep work sessions during this timeframe',
      implemented: true
    },
    { 
      id: '3', 
      type: 'collaboration_pattern', 
      description: 'You respond to email in batches in the afternoon', 
      confidence: 0.78,
      suggestion: 'Set up an email autoresponder during your focus time',
      implemented: false
    }
  ]);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  
  // Add interfaces for the new features
  interface AgentTracker {
    id: string;
    name: string;
    status: 'active' | 'idle' | 'pending' | 'error';
    progress: number;
    tasks: number;
    lastAction: Date;
  }
  
  interface AutomationRule {
    id: string;
    name: string;
    trigger: 'schedule' | 'event' | 'condition';
    schedule?: string;
    event?: string;
    condition?: string;
    actions: string[];
    enabled: boolean;
    lastRun: Date | null;
  }
  
  interface LearnedPattern {
    id: string;
    type: 'task_pattern' | 'productivity_pattern' | 'collaboration_pattern' | 'workflow_pattern';
    description: string;
    confidence: number;
    suggestion: string;
    implemented: boolean;
  }

  // Add additional state for auto-hide behavior
  const [isLeftPanelHovered, setIsLeftPanelHovered] = useState(false);
  const [isAutoHideEnabled, setIsAutoHideEnabled] = useState(true);

  // Add new state for auto-hiding the top toolbar
  const [isTopToolbarVisible, setIsTopToolbarVisible] = useState(true);
  const [isTopToolbarHovered, setIsTopToolbarHovered] = useState(false);
  const topToolbarRef = useRef<HTMLDivElement>(null);
  
  // Add an effect to hide the toolbar when scrolling down
  useEffect(() => {
    let lastScrollTop = 0;
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLDivElement;
      const scrollTop = target.scrollTop;
      
      if (scrollTop > lastScrollTop && scrollTop > 50) {
        // Scrolling down and not at the top
        setIsTopToolbarVisible(false);
      } else {
        // Scrolling up or at the top
        setIsTopToolbarVisible(true);
      }
      lastScrollTop = scrollTop;
    };
    
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) {
      chatContainer.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (chatContainer) {
        chatContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

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

  // Consolidate message handling functions
  const messageActions = {
    like: (messageId: string) => {
      setMessageReactions(prev => ({ ...prev, [messageId]: 'like' }));
    },
    
    dislike: (messageId: string) => {
      setMessageReactions(prev => ({ ...prev, [messageId]: 'dislike' }));
    },
    
    copy: (messageId: string) => {
      const message = chatMessages.find(m => m.id === messageId);
      if (message) {
        navigator.clipboard.writeText(message.content);
      }
    },
    
    share: (messageId: string) => {
      // Implement share functionality
      console.log('Sharing message:', messageId);
    },
    
    toggleCode: (messageId: string) => {
      setCodeView(prev => ({ ...prev, [messageId]: !prev[messageId] }));
    },
    
    bookmark: (messageId: string) => {
      setBookmarkedMessages(prev => {
        const newSet = new Set(prev);
        if (newSet.has(messageId)) {
          newSet.delete(messageId);
        } else {
          newSet.add(messageId);
        }
        return newSet;
      });
    },
    
    react: (messageId: string, emoji: string) => {
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
    },
    
    reply: (messageId: string) => {
      const message = chatMessages.find(m => m.id === messageId);
      if (message) {
        setInput(`Replying to: "${message.content.substring(0, 50)}..."\n\n`);
      }
    },
    
    thread: (messageId: string) => {
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
    },
    
    format: (messageId: string, type: 'bold' | 'italic' | 'code', language?: string) => {
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
    },
    
    delete: (messageId: string) => {
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
    },
    
    edit: (message: Message) => {
      setChatMessages(prev => prev.map(msg => msg.id === message.id ? message : msg));
    },
    
    pin: (messageId: string) => {
      const message = chatMessages.find(m => m.id === messageId);
      if (message) {
        const pinnedMessage: PinnedMessage = {
          ...message,
          pinnedAt: new Date()
        };
        setPinnedMessages(prev => {
          // Don't add duplicates
          if (prev.some(m => m.id === messageId)) {
            return prev;
          }
          return [...prev, pinnedMessage];
        });
      }
    },
    
    unpin: (messageId: string) => {
      setPinnedMessages(prev => prev.filter(m => m.id !== messageId));
    },
    
    download: (messageId: string) => {
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
    },
    
    navigateTo: (messageId: string) => {
      const messageElement = document.getElementById(`message-${messageId}`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        messageElement.classList.add('highlight');
        setTimeout(() => messageElement.classList.remove('highlight'), 2000);
      }
    }
  };

  // Replace the existing handler functions with the consolidated ones
  const handleMessageAction = (messageId: string, action: keyof typeof messageActions) => {
    if (action in messageActions) {
      (messageActions as any)[action](messageId);
    }
  };

  // Replace existing renderMessageActions with consolidated version
  const renderMessageActions = (message: Message): MessageActions => ({
    like: () => messageActions.like(message.id),
    dislike: () => messageActions.dislike(message.id),
    copy: () => messageActions.copy(message.id),
    share: () => messageActions.share(message.id),
    toggleCode: () => messageActions.toggleCode(message.id),
    bookmark: () => messageActions.bookmark(message.id),
    react: (emoji: string) => messageActions.react(message.id, emoji),
    reply: () => messageActions.reply(message.id),
    thread: () => messageActions.thread(message.id),
    format: (type: 'bold' | 'italic' | 'code', language?: string) => messageActions.format(message.id, type, language)
  });

  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = event.target.files;
    if (files) {
      await documentUtils.handleFileInput(event, processingOptions);
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
            content,
            // Fix metadata to match expected format
            metadata: {
              source: 'upload',
              date: new Date(),
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
          const doc = await documentUtils.processDocument(file, processingOptions);
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

  // Use theme values in the UI
  const containerClassName = `min-h-screen bg-${theme === 'dark' ? 'gray-900' : 'white'} text-${isDark ? 'white' : 'gray-900'}`;
  const headerClassName = `flex items-center justify-between p-4 border-b border-${isDark ? 'gray-700' : 'gray-200'}`;

  // Helper to fix document references type
  const createDocumentReference = (doc: AIDocument): DocumentReference => ({
    id: doc.id,
    title: doc.metadata?.title || 'Unknown document',
    excerpt: doc.content?.substring(0, 200) + '...',
    type: 'document',
    relevance: 1
  });

  // Enhanced handleSubmit function with better Gemini integration
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!input.trim() || isProcessing) return;
    
    setInput('');
    setIsProcessing(true);
    
    try {
      // Add the user message
      const userMessage: Message = {
        id: Date.now().toString(),
        content: input,
        role: 'user',
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, userMessage]);
      
      // Create a typing indicator
      const typingIndicatorId = (Date.now() + 1).toString();
      setChatMessages(prev => [
        ...prev,
        {
          id: typingIndicatorId,
          content: '',
          role: 'assistant',
          timestamp: new Date(),
          metadata: { 
            isTyping: true,
            model: selectedModel,
            provider: selectedProvider
          }
        }
      ]);
      
      let response = '';
      
      const options = {
        systemPrompt: systemPrompt,
        context: selectedDocs.map(doc => ({
          id: doc.id,
          title: doc.name,
          excerpt: doc.content.substring(0, 200),
          type: doc.type,
          relevance: 1.0
        })),
        model: selectedModel,
        temperature: temperature,
        maxTokens: maxTokens,
        provider: selectedProvider
      };
      
      if (selectedProvider === 'google') {
        response = await sendMessage(input, options);
      }
      
      // Remove typing indicator and add the actual response
      setChatMessages(prev => 
        prev.filter(msg => msg.id !== typingIndicatorId).concat({
          id: (Date.now() + 2).toString(),
          content: response,
          role: 'assistant',
          timestamp: new Date(),
          metadata: {
            model: selectedModel,
            provider: selectedProvider,
            mode: getModelMode(selectedModel),
          }
        })
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setChatMessages(prev => 
        prev.filter(msg => msg.id !== typingIndicatorId).concat({
          id: (Date.now() + 2).toString(),
          content: error instanceof Error 
            ? `Error: ${error.message}` 
            : 'An unknown error occurred',
          role: 'error',
          timestamp: new Date()
        })
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Add an enhanced typing effect component for better UX
  const TypingIndicator = () => (
    <div className="flex space-x-3 p-5 rounded-xl bg-card shadow-md border border-border/30 mb-6 ml-11">
      <div className="flex items-center gap-2.5">
        <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-sm animate-bounce" />
        <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-sm animate-bounce delay-150" />
        <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-sm animate-bounce delay-300" />
        <span className="ml-2 text-sm text-muted-foreground">AI is thinking...</span>
      </div>
    </div>
  );

  // Render function for messages to handle typing indicators
  const renderMessage = (message: Message) => {
    if (message.role === 'error') {
      return <div className="text-destructive">{message.content}</div>;
    }
    
    // For streaming messages
    if (message.metadata && (message.metadata as MessageMetadata).isTyping) {
      return <MarkdownMessage content={message.content} isStreaming={true} />;
    }
    
    // For regular messages
    return <MarkdownMessage content={message.content} />;
  };

  // Implement the missing handleKeyDown function
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Add AI configuration state
  const [aiConfig, setAIConfig] = useState<AIConfig>(() => {
    try {
      const savedSettings = localStorage.getItem('genieflow_ai_settings');
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }
    } catch (error) {
      console.error('Failed to load saved AI settings:', error);
    }
    return defaultAIConfig;
  });
  const [showAISettings, setShowAISettings] = useState(false);

  // Add useEffect to apply settings when component mounts or aiConfig changes
  useEffect(() => {
    if (aiConfig) {
      // Apply settings to current state
      if (aiConfig.systemPrompt) {
        setSystemPrompt(aiConfig.systemPrompt);
      }
      
      if (aiConfig.thinkingMode !== undefined) {
        // Apply thinking mode if needed
      }
      
      if (aiConfig.formatStyle) {
        // Apply format style if needed
      }
      
      // If there's a mode in the config, apply related settings
      if (aiConfig.mode && aiModePresets[aiConfig.mode]) {
        setSelectedMode(aiConfig.mode as keyof typeof aiModePresets);
      }
    }
  }, [aiConfig]);

  // Add this to the existing render function, in the settings area
  const renderProfessionalModeSettings = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-sm">Professional Elite Mode</h3>
          <p className="text-muted-foreground text-xs">
            Enable specialized legal document assistance with case law lookup
          </p>
        </div>
        <Switch 
          checked={professionalMode} 
          onCheckedChange={toggleProfessionalMode} 
        />
      </div>
      
      {professionalMode && (
        <div className="border-l-2 border-primary/30 pl-3 py-1 space-y-2 text-xs">
          <p>Professional Elite Mode activated. Features include:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Legal document drafting assistance</li>
            <li>Case law search and citation</li>
            <li>Writing style adaptation</li>
            <li>Document analysis</li>
          </ul>
          <p>
            <a 
              href="/documents" 
              className="text-primary underline hover:no-underline"
            >
              Manage your documents →
            </a>
          </p>
        </div>
      )}
    </div>
  );

  // Fix the provider mapping when loading a conversation
  const mapProviderToSupported = (provider: string): 'google' => {
    return 'google'; // Default fallback
  };

  // Add a new state for the right sidebar
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(false);
  
  // Assistants state
  const { assistants } = useAssistantStore();
  const [showAssistantsDialog, setShowAssistantsDialog] = useState<boolean>(false);
  const [selectedAssistant, setSelectedAssistant] = useState<AIAssistant | null>(null);

  // Add dialog state for editing an assistant
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [assistantToEdit, setAssistantToEdit] = useState<AIAssistant | null>(null);
  
  // Add state for creating a new assistant
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [newAssistantData, setNewAssistantData] = useState<Partial<AIAssistant>>({
    name: '',
    description: '',
    type: 'general',
    capabilities: [],
    systemPrompt: '',
    isActive: true
  });

  return (
    <AIErrorBoundary>
      <TooltipProvider>
        <div className={cn(containerClassName, "ai-assistant-container")}>
          {/* Main 3-column layout with flex */}
          <div className="flex h-screen overflow-hidden">
            {/* Left sidebar - showing conversations */}
            <div className={cn(
              "border-r border-border/50 bg-muted/30 transition-all duration-300 overflow-hidden",
              isLeftPanelCollapsed ? "w-0" : "w-64"
            )}>
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-border/50">
                  <Link 
                    to="/assistants"
                    className="w-full justify-start gap-2 mb-2 bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center px-4 py-2 rounded-md text-sm font-medium"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/assistants', { state: { user, session } });
                    }}
                  >
                    <Users className="h-4 w-4" />
                    Assistants
                  </Link>
                  <Button 
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={handleNewChat}
                  >
                    <Plus className="h-4 w-4 interactive-icon" />
                    New Chat
                  </Button>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  {conversations.map(conversation => (
                    <div 
                      key={conversation.id}
                      className={cn(
                        "flex items-start gap-2 p-3 cursor-pointer hover:bg-muted/80 transition-colors sidebar-item",
                        currentConversation === conversation.id ? "bg-muted active" : ""
                      )}
                      onClick={() => {
                        if (currentConversation !== conversation.id) {
                          setCurrentConversation(conversation.id);
                          setChatMessages(conversation.messages);
                        }
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mt-1 interactive-icon" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {conversation.title || 'New Chat'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(conversation.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Main content area - chat messages and input */}
            <div className="flex-1 flex flex-col h-full">
              {/* Header */}
              <header className="flex items-center justify-between p-3 border-b bg-background/95 backdrop-blur-md ai-header">
                <div className="flex items-center gap-2">
                  {isLeftPanelCollapsed && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setIsLeftPanelCollapsed(false)}
                    >
                      <Menu className="h-4 w-4 interactive-icon" />
                    </Button>
                  )}
                  
                  <h1 className="text-lg font-semibold">
                    {currentConversation 
                      ? conversations.find(c => c.id === currentConversation)?.title || 'Chat'
                      : 'New Chat'
                    }
                  </h1>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Replace the Assistants button with a navigation link */}
                  <Link 
                    to="/assistants"
                    className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/assistants', { state: { user, session } });
                    }}
                  >
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Assistants</span>
                  </Link>
                  
                  <Tooltip content="Model Settings">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => setShowSettings(!showSettings)}
                    >
                      <Sparkles className="w-4 h-4 text-primary interactive-icon" />
                      <span className="text-sm hidden md:inline">
                        {selectedProvider && modelGroups[selectedProvider] && modelGroups[selectedProvider].models[selectedModel] 
                          ? modelGroups[selectedProvider].models[selectedModel].name 
                          : 'Model'}
                      </span>
                    </Button>
                  </Tooltip>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                  >
                    <ChevronLeft className={cn(
                      "h-4 w-4 transition-transform interactive-icon",
                      isRightSidebarOpen && "rotate-180"
                    )} />
                  </Button>
                </div>
              </header>
              
              {/* Chat area */}
              <div className="flex-1 overflow-y-auto p-4">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <Bot className="h-12 w-12 mb-4 text-muted-foreground interactive-icon" />
                    <h2 className="text-2xl font-semibold mb-2">How can I help you today?</h2>
                    <p className="text-muted-foreground max-w-md mb-8">
                      I can answer questions, generate content, help with research, and more.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                      {/* Example prompts */}
                      {['Write a summary about climate change', 
                        'Generate a JavaScript function to sort an array', 
                        'Create a marketing email template',
                        'Explain quantum computing in simple terms'].map(prompt => (
                        <Button 
                          key={prompt}
                          variant="outline" 
                          className="justify-start text-left h-auto py-3 recent-query"
                          onClick={() => {
                            setInput(prompt);
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-2 interactive-icon" />
                          {prompt}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {chatMessages.map(message => (
                      <div 
                        key={message.id}
                        className={cn(
                          "flex",
                          message.role === 'user' ? "justify-end" : "justify-start"
                        )}
                      >
                        <div 
                          className={cn(
                            "max-w-3xl rounded-lg p-4",
                            message.role === 'user' 
                              ? "bg-primary text-primary-foreground message-user" 
                              : "bg-muted message-assistant"
                          )}
                        >
                          {renderMessage(message)}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg typing-indicator">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                        </div>
                        <span className="text-sm text-muted-foreground">AI is thinking...</span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
              
              {/* Input area */}
              <div className="border-t p-4 bg-background/95 backdrop-blur-md">
                <form onSubmit={handleSubmit} className="flex items-end gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message AI Assistant..."
                    className="flex-1 min-h-[60px] resize-none chat-input"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    className="primary"
                    disabled={isLoading || !input.trim()}
                  >
                    <Send className="h-4 w-4 interactive-icon" />
                  </Button>
                </form>
              </div>
            </div>
            
            {/* Right sidebar - context and tools */}
            <div className={cn(
              "border-l border-border/50 bg-muted/30 transition-all duration-300 overflow-hidden",
              isRightSidebarOpen ? "w-80" : "w-0"
            )}>
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-border/50">
                  <h2 className="font-semibold card-title">Context & Tools</h2>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    {/* System prompt */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium card-title">Custom Instructions</h3>
                      <Textarea
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        placeholder="Add custom instructions for the AI..."
                        className="h-24 text-sm chat-input"
                      />
                    </div>
                    
                    {/* Document references */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium card-title">Reference Documents</h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full justify-start gap-2 secondary"
                        onClick={() => handleDocumentUpload('document')}
                      >
                        <Plus className="h-4 w-4 interactive-icon" />
                        Add Document
                      </Button>
                      
                      {selectedDocs.length > 0 ? (
                        <div className="space-y-1 mt-2">
                          {selectedDocs.map(doc => (
                            <div 
                              key={doc.id}
                              className="flex items-center justify-between text-sm p-2 bg-background rounded-md"
                            >
                              <div className="truncate">
                                <FileText className="h-3 w-3 inline mr-2" />
                                {doc.title || doc.id}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={() => setSelectedDocs(selectedDocs.filter(d => d.id !== doc.id))}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground italic">
                          No documents added
                        </div>
                      )}
                    </div>
                    
                    {/* Web search */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium card-title">Web Search</h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full justify-start gap-2 secondary"
                        onClick={() => setIsSearchPanelOpen(!isSearchPanelOpen)}
                      >
                        <Search className="h-4 w-4 interactive-icon" />
                        Search Web
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>
      
      {/* Assistants Dialog */}
      <Dialog open={showAssistantsDialog} onOpenChange={setShowAssistantsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader className="flex flex-row items-center justify-between">
            <div>
              <DialogTitle>AI Assistants</DialogTitle>
              <DialogDescription>
                Select a trained assistant to use in your conversation. Chat history will be preserved.
              </DialogDescription>
            </div>
            <Button
              onClick={() => {
                setNewAssistantData({
                  name: '',
                  description: '',
                  type: 'general',
                  capabilities: [],
                  systemPrompt: '',
                  isActive: true
                });
                setShowAssistantsDialog(false);
                setIsCreateDialogOpen(true);
              }}
              className="mt-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Assistant
            </Button>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
            {assistants.length > 0 ? (
              assistants.map(assistant => (
                <Card 
                  key={assistant.id}
                  className={cn(
                    "p-4 hover:shadow-md transition-shadow cursor-pointer relative",
                    selectedAssistant?.id === assistant.id ? "border-2 border-primary" : ""
                  )}
                  onClick={() => setSelectedAssistant(assistant)}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 hover:bg-background"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAssistantToEdit(assistant);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-start pr-8">
                      <h3 className="text-lg font-semibold">{assistant.name}</h3>
                      <div className={cn(
                        "px-2 py-1 rounded-full text-xs",
                        assistant.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      )}>
                        {assistant.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    
                    {assistant.description && (
                      <p className="text-muted-foreground text-sm mt-2 flex-grow">{assistant.description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-1 mt-3">
                      {assistant.capabilities?.slice(0, 3).map((capability, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{capability}</Badge>
                      ))}
                      {assistant.capabilities?.length > 3 && (
                        <Badge variant="outline" className="text-xs">+{assistant.capabilities.length - 3} more</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/10">
                <p className="text-muted-foreground mb-4">You haven't created any assistants yet.</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  Create Your First Assistant
                </Button>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssistantsDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedAssistant) {
                  // Apply the selected assistant's system prompt and configuration
                  setSystemPrompt(selectedAssistant.systemPrompt || '');
                  setShowAssistantsDialog(false);
                  
                  // Update the conversation title to reflect the selected assistant
                  if (currentConversation) {
                    updateConversationTitle(
                      currentConversation, 
                      `Chat with ${selectedAssistant.name}`
                    );
                  }
                  
                  // Add a system message indicating the assistant change
                  const systemMessage: Message = {
                    id: uuidv4(),
                    role: 'system',
                    content: `Switched to ${selectedAssistant.name} assistant. ${selectedAssistant.description || ''}`,
                    timestamp: new Date()
                  };
                  setChatMessages(prev => [...prev, systemMessage]);
                }
              }}
              disabled={!selectedAssistant}
            >
              Use Selected Assistant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Assistant Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Assistant</DialogTitle>
            <DialogDescription>
              Modify the assistant's details and capabilities.
            </DialogDescription>
          </DialogHeader>
          
          {assistantToEdit && (
            <div className="space-y-4">
              <Input
                value={assistantToEdit.name}
                onChange={(e) => setAssistantToEdit({ ...assistantToEdit, name: e.target.value })}
                placeholder="Assistant Name"
              />
              <Textarea
                value={assistantToEdit.description}
                onChange={(e) => setAssistantToEdit({ ...assistantToEdit, description: e.target.value })}
                placeholder="Assistant Description"
              />
              <Textarea
                value={assistantToEdit.systemPrompt}
                onChange={(e) => setAssistantToEdit({ ...assistantToEdit, systemPrompt: e.target.value })}
                placeholder="System Prompt"
              />
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (assistantToEdit) {
                  // Save changes to the assistant
                  setAssistantToEdit(null);
                  setIsEditDialogOpen(false);
                }
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create Assistant Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Assistant</DialogTitle>
            <DialogDescription>
              Define the assistant's details and capabilities.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Input
              value={newAssistantData.name}
              onChange={(e) => setNewAssistantData({ ...newAssistantData, name: e.target.value })}
              placeholder="Assistant Name"
            />
            <Textarea
              value={newAssistantData.description}
              onChange={(e) => setNewAssistantData({ ...newAssistantData, description: e.target.value })}
              placeholder="Assistant Description"
            />
            <Textarea
              value={newAssistantData.systemPrompt}
              onChange={(e) => setNewAssistantData({ ...newAssistantData, systemPrompt: e.target.value })}
              placeholder="System Prompt"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                // Save the new assistant
                setIsCreateDialogOpen(false);
              }}
            >
              Create Assistant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AIErrorBoundary>
  );
} 

// Helper functions - unchanged