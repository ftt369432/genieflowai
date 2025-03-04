import React, { useState, useMemo, useEffect } from 'react';
import { AIDocument } from '../../types/ai';
import { DocumentPreview } from './DocumentPreview';
import { DocumentViewer } from './DocumentViewer';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/Command';
import { 
  Plus, Upload, Filter, Search, SlidersHorizontal, X, MessageSquarePlus, 
  Sparkles, ArrowLeft, Send, Paperclip, ChevronLeft, ChevronRight,
  ArrowUpDown, Calendar, Tag, Clock, Check, Download, Trash
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { DropZone } from '../ui/DropZone';
import { AnimatePresence, motion } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/Sheet';
import { Textarea } from '../ui/Textarea';
import { DocumentIcon } from '../ui/DocumentIcon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  attachments: AIDocument[];
}

interface DocumentListProps {
  documents: AIDocument[];
  onRemove: (id: string) => void;
  onUpload: (file: File) => void;
  onAddTag: (docId: string, tag: string) => void;
  onRemoveTag: (docId: string, tagToRemove: string) => void;
  onSearch?: (query: string, prompt: string) => Promise<void>;
  onSendMessage?: (message: string, attachments: AIDocument[]) => Promise<void>;
}

type SortOption = 'dateDesc' | 'dateAsc' | 'nameAsc' | 'nameDesc' | 'typeAsc' | 'typeDesc';

// Use the type from AIDocument
type DocumentType = AIDocument['type'];

interface Filters {
  types: DocumentType[];
  tags: string[];
  dateFrom: Date | null;
  dateTo: Date | null;
}

// Add a type for filter preferences
interface FilterPreferences {
  sortBy: SortOption;
  filters: Filters;
}

// Update the type for document icon
const DEFAULT_DOC_TYPE = 'text' as const;

interface FilterPreset {
  id: string;
  name: string;
  filters: Filters;
  sortBy: SortOption;
}

interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: Date;
  filters: Filters;
  sortBy: SortOption;
}

export function DocumentList({
  documents,
  onRemove,
  onUpload,
  onAddTag,
  onRemoveTag,
  onSearch,
  onSendMessage
}: DocumentListProps) {
  const [viewingDocument, setViewingDocument] = useState<AIDocument | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [attachedDocs, setAttachedDocs] = useState<AIDocument[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const saved = localStorage.getItem('documentFilterPreferences');
    if (saved) {
      const preferences = JSON.parse(saved) as FilterPreferences;
      return preferences.sortBy;
    }
    return 'dateDesc';
  });
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  const [filters, setFilters] = useState<Filters>(() => {
    const saved = localStorage.getItem('documentFilterPreferences');
    if (saved) {
      const preferences = JSON.parse(saved) as FilterPreferences;
      return preferences.filters;
    }
    return {
      types: [],
      tags: [],
      dateFrom: null,
      dateTo: null
    };
  });

  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>(() => {
    const saved = localStorage.getItem('documentFilterPresets');
    return saved ? JSON.parse(saved) : [];
  });

  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>(() => {
    const saved = localStorage.getItem('documentSearchHistory');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());

  const [presetName, setPresetName] = useState('');

  const activeConversation = useMemo(() => 
    conversations.find(conv => conv.id === activeConversationId),
    [conversations, activeConversationId]
  );

  // Get unique document types and tags
  const uniqueTypes = useMemo(() => 
    Array.from(new Set(documents.map(doc => doc.type))),
    [documents]
  );

  const uniqueTags = useMemo(() => 
    Array.from(new Set(documents.flatMap(doc => doc.metadata.tags || []))),
    [documents]
  );

  // Filter and sort documents
  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = documents;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(query) ||
        doc.metadata.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply filters
    if (filters.types.length > 0) {
      filtered = filtered.filter(doc => filters.types.includes(doc.type as DocumentType));
    }
    if (filters.tags.length > 0) {
      filtered = filtered.filter(doc => 
        filters.tags.every(tag => doc.metadata.tags?.includes(tag))
      );
    }
    if (filters.dateFrom) {
      filtered = filtered.filter(doc => 
        new Date(doc.metadata.dateCreated) >= filters.dateFrom!
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(doc => 
        new Date(doc.metadata.dateCreated) <= filters.dateTo!
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dateDesc':
          return new Date(b.metadata.dateCreated).getTime() - new Date(a.metadata.dateCreated).getTime();
        case 'dateAsc':
          return new Date(a.metadata.dateCreated).getTime() - new Date(b.metadata.dateCreated).getTime();
        case 'nameAsc':
          return a.title.localeCompare(b.title);
        case 'nameDesc':
          return b.title.localeCompare(a.title);
        case 'typeAsc':
          return a.type.localeCompare(b.type);
        case 'typeDesc':
          return b.type.localeCompare(a.type);
        default:
          return 0;
      }
    });
  }, [documents, searchQuery, filters, sortBy]);

  const createNewChat = () => {
    const newConversation: Conversation = {
      id: Math.random().toString(36).substring(7),
      title: 'New Chat',
      lastMessage: '',
      timestamp: new Date(),
      attachments: []
    };
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    setMessage('');
    setAttachedDocs([]);
  };

  const handleSend = async () => {
    if (!message.trim() && attachedDocs.length === 0) return;

    if (onSendMessage) {
      await onSendMessage(message, attachedDocs);
    }

    if (activeConversationId) {
      setConversations(prev =>
        prev.map(conv =>
          conv.id === activeConversationId
            ? {
                ...conv,
                lastMessage: message,
                timestamp: new Date(),
                attachments: [...conv.attachments, ...attachedDocs]
              }
            : conv
        )
      );
    }

    setMessage('');
    setAttachedDocs([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const attachDocument = (doc: AIDocument) => {
    if (!attachedDocs.find(d => d.id === doc.id)) {
      setAttachedDocs(prev => [...prev, doc]);
    }
  };

  const removeAttachment = (docId: string) => {
    setAttachedDocs(prev => prev.filter(doc => doc.id !== docId));
  };

  const handleDownload = (document: AIDocument) => {
    const a = window.document.createElement('a');
    const blob = new Blob([document.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = document.title;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => onUpload(file));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => onUpload(file));
  };

  const renderCodePreview = (content: string, language: string) => {
    return (
      <SyntaxHighlighter
        language={language}
        style={oneLight}
        customStyle={{ margin: 0, background: 'transparent' }}
      >
        {content}
      </SyntaxHighlighter>
    );
  };

  // Save filter preferences when they change
  useEffect(() => {
    const preferences: FilterPreferences = {
      sortBy,
      filters
    };
    localStorage.setItem('documentFilterPreferences', JSON.stringify(preferences));
  }, [sortBy, filters]);

  useEffect(() => {
    localStorage.setItem('documentFilterPresets', JSON.stringify(filterPresets));
  }, [filterPresets]);

  useEffect(() => {
    localStorage.setItem('documentSearchHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      types: [],
      tags: [],
      dateFrom: null,
      dateTo: null
    });
    setSearchQuery('');
  };

  // Add keyboard shortcut handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + F to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder="Search documents..."]') as HTMLInputElement;
        searchInput?.focus();
      }
      // Cmd/Ctrl + [ to toggle left sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === '[') {
        e.preventDefault();
        setLeftSidebarCollapsed(prev => !prev);
      }
      // Cmd/Ctrl + ] to toggle right sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === ']') {
        e.preventDefault();
        setRightSidebarCollapsed(prev => !prev);
      }
      // Cmd/Ctrl + Backspace to clear filters
      if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace') {
        e.preventDefault();
        clearFilters();
      }
      // Esc to clear search and filters
      if (e.key === 'Escape') {
        setConversations([]);
        setActiveConversationId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const saveFilterPreset = (name: string) => {
    const newPreset: FilterPreset = {
      id: Math.random().toString(36).substring(7),
      name,
      filters,
      sortBy
    };
    setFilterPresets(prev => [...prev, newPreset]);
  };

  const applyFilterPreset = (preset: FilterPreset) => {
    setFilters(preset.filters);
    setSortBy(preset.sortBy);
  };

  const deleteFilterPreset = (id: string) => {
    setFilterPresets(prev => prev.filter(preset => preset.id !== id));
  };

  const addToSearchHistory = () => {
    if (!searchQuery) return;
    
    const historyItem: SearchHistoryItem = {
      id: Math.random().toString(36).substring(7),
      query: searchQuery,
      timestamp: new Date(),
      filters,
      sortBy
    };
    
    setSearchHistory(prev => [historyItem, ...prev.slice(0, 9)]);
  };

  const applySearchHistory = (item: SearchHistoryItem) => {
    setSearchQuery(item.query);
    setFilters(item.filters);
    setSortBy(item.sortBy);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
  };

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  };

  const selectAllDocuments = () => {
    setSelectedDocuments(new Set(filteredAndSortedDocuments.map(doc => doc.id)));
  };

  const clearSelection = () => {
    setSelectedDocuments(new Set());
  };

  const batchDownload = () => {
    selectedDocuments.forEach(docId => {
      const doc = documents.find(d => d.id === docId);
      if (doc) handleDownload(doc);
    });
  };

  const batchRemove = () => {
    selectedDocuments.forEach(docId => onRemove(docId));
    clearSelection();
  };

  const batchAddTag = (tag: string) => {
    selectedDocuments.forEach(docId => onAddTag(docId, tag));
  };

  // Add drag state
  const [isDragging, setIsDragging] = useState(false);

  // Add drag handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, document: AIDocument) => {
    e.dataTransfer.setData('text/plain', document.id);
    setIsDragging(true);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetDocument: AIDocument) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    const sourceDoc = documents.find(d => d.id === sourceId);
    
    if (sourceDoc && targetDocument.id !== sourceId) {
      // Add both documents to selection if not already selected
      setSelectedDocuments(prev => {
        const next = new Set(prev);
        next.add(sourceId);
        next.add(targetDocument.id);
        return next;
      });
    }
    
    setIsDragging(false);
  };

  // Add search suggestions state and functions
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const generateSearchSuggestions = (query: string) => {
    if (!query) {
      setSearchSuggestions([]);
      return;
    }

    // Extract words from document content and titles
    const words = new Set<string>();
    documents.forEach(doc => {
      // Add words from title
      doc.title.toLowerCase().split(/\s+/).forEach(word => words.add(word));
      
      // Add words from content
      if (doc.content) {
        doc.content.toLowerCase().split(/\s+/).forEach(word => words.add(word));
      }
      
      // Add tags
      doc.metadata.tags?.forEach(tag => words.add(tag.toLowerCase()));
    });

    // Filter words that match the query
    const matches = Array.from(words)
      .filter(word => word.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5); // Limit to 5 suggestions

    setSearchSuggestions(matches);
  };

  // Add filter statistics
  const filterStats = useMemo(() => {
    const stats = {
      types: {} as Record<string, number>,
      tags: {} as Record<string, number>
    };

    documents.forEach(doc => {
      // Count document types
      const type = doc.type;
      stats.types[type] = (stats.types[type] || 0) + 1;

      // Count tags
      doc.metadata.tags?.forEach(tag => {
        stats.tags[tag] = (stats.tags[tag] || 0) + 1;
      });
    });

    return stats;
  }, [documents]);

  return (
    <TooltipProvider>
      <div className="flex h-full">
        {/* Left Sidebar - Conversations */}
        <motion.div
          className={cn(
            "border-r flex flex-col h-full bg-background/50 backdrop-blur-sm",
            leftSidebarCollapsed ? "w-12" : "w-80"
          )}
          animate={{ width: leftSidebarCollapsed ? 48 : 320 }}
          transition={{ duration: 0.2 }}
        >
          <div className="p-4 border-b flex items-center justify-between">
            {!leftSidebarCollapsed && (
              <Button
                variant="outline"
                className="flex-1 mr-2"
                onClick={createNewChat}
              >
                <MessageSquarePlus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
            >
              {leftSidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {!leftSidebarCollapsed && (
            <div className="flex-1 overflow-auto p-2">
              <AnimatePresence>
                {conversations.map(conversation => (
                  <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={cn(
                      'p-3 rounded-lg border mb-2 cursor-pointer hover:bg-accent/5',
                      activeConversationId === conversation.id && 'bg-accent/10 border-accent'
                    )}
                    onClick={() => setActiveConversationId(conversation.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {conversation.title}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {conversation.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                      {conversation.attachments.length > 0 && (
                        <div className="flex items-center ml-2">
                          <Paperclip className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground ml-1">
                            {conversation.attachments.length}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Middle - Chat Area */}
        <div className="flex-1 flex flex-col h-full">
          {/* Chat Messages */}
          <div className="flex-1 overflow-auto p-4">
            {/* Chat messages will go here */}
          </div>

          {/* Message Input */}
          <div className="border-t p-4">
            {attachedDocs.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {attachedDocs.map(doc => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10"
                  >
                    <DocumentIcon type={doc.type} className="h-4 w-4" />
                    <span className="text-sm truncate max-w-[150px]">{doc.title}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 hover:text-destructive"
                      onClick={() => removeAttachment(doc.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative">
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Press Enter to send, Shift + Enter for new line)"
                className="pr-24 min-h-[100px] resize-none"
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 p-0">
                    <Command>
                      <CommandInput placeholder="Search documents..." />
                      <CommandList>
                        <CommandEmpty>No documents found.</CommandEmpty>
                        {documents.map(doc => (
                          <CommandItem
                            key={doc.id}
                            onSelect={() => attachDocument(doc)}
                          >
                            <div className="flex items-center">
                              <DocumentIcon type={doc.type} className="h-4 w-4 mr-2" />
                              <span>{doc.title}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button
                  onClick={handleSend}
                  className="h-8"
                  disabled={!message.trim() && attachedDocs.length === 0}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Search & Filters */}
        <motion.div
          className={cn(
            "border-l flex flex-col h-full bg-background/50 backdrop-blur-sm",
            rightSidebarCollapsed ? "w-12" : "w-96"
          )}
          animate={{ width: rightSidebarCollapsed ? 48 : 384 }}
          transition={{ duration: 0.2 }}
        >
          <div className="p-4 border-b">
            <div className="flex items-center gap-2 mb-4">
              {!rightSidebarCollapsed && (
                <>
                  <div className="relative flex-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search documents... (⌘/Ctrl + F)"
                            className="pl-9"
                            value={searchQuery}
                            onChange={e => {
                              setSearchQuery(e.target.value);
                              generateSearchSuggestions(e.target.value);
                              setShowSuggestions(true);
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                addToSearchHistory();
                                setShowSuggestions(false);
                              } else if (e.key === 'Escape') {
                                setShowSuggestions(false);
                              }
                            }}
                            onBlur={() => {
                              setTimeout(() => setShowSuggestions(false), 200);
                            }}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        Press ⌘/Ctrl + F to focus search
                        Press Enter to save to history
                      </TooltipContent>
                    </Tooltip>
                    
                    {showSuggestions && searchSuggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-1 p-1 bg-background border rounded-md shadow-lg z-50"
                      >
                        {searchSuggestions.map((suggestion, index) => (
                          <motion.div
                            key={suggestion}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="px-3 py-2 hover:bg-accent/5 rounded-sm cursor-pointer"
                            onClick={() => {
                              setSearchQuery(suggestion);
                              setShowSuggestions(false);
                              addToSearchHistory();
                            }}
                          >
                            <div className="flex items-center">
                              <Search className="h-3 w-3 mr-2 text-muted-foreground" />
                              <span className="text-sm">{suggestion}</span>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="h-9 w-9">
                        <SlidersHorizontal className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-80">
                      <SheetHeader>
                        <SheetTitle>Filter Documents</SheetTitle>
                      </SheetHeader>
                      <div className="py-4 space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Filters</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="h-8 text-muted-foreground hover:text-foreground"
                          >
                            Clear all filters
                          </Button>
                        </div>

                        {/* Document Types */}
                        <motion.div
                          initial={false}
                          animate={{ height: 'auto' }}
                          transition={{ duration: 0.2 }}
                        >
                          <h4 className="font-medium mb-2 flex items-center justify-between">
                            <div className="flex items-center">
                              <DocumentIcon type={DEFAULT_DOC_TYPE} className="h-4 w-4 mr-2" />
                              <span>Document Types</span>
                            </div>
                            {filters.types.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {filters.types.length} selected
                              </span>
                            )}
                          </h4>
                          <div className="space-y-2">
                            {uniqueTypes.map(type => (
                              <motion.div
                                key={type}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id={`type-${type}`}
                                    checked={filters.types.includes(type as DocumentType)}
                                    onChange={e => {
                                      setFilters(prev => ({
                                        ...prev,
                                        types: e.target.checked
                                          ? [...prev.types, type as DocumentType]
                                          : prev.types.filter(t => t !== type)
                                      }));
                                    }}
                                    className="mr-2"
                                  />
                                  <label htmlFor={`type-${type}`} className="text-sm capitalize">
                                    {type}
                                  </label>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {filterStats.types[type] || 0}
                                </span>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>

                        {/* Tags */}
                        <motion.div
                          initial={false}
                          animate={{ height: 'auto' }}
                          transition={{ duration: 0.2 }}
                        >
                          <h4 className="font-medium mb-2 flex items-center justify-between">
                            <div className="flex items-center">
                              <Tag className="h-4 w-4 mr-2" />
                              <span>Tags</span>
                            </div>
                            {filters.tags.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {filters.tags.length} selected
                              </span>
                            )}
                          </h4>
                          <div className="space-y-2">
                            {uniqueTags.map(tag => (
                              <motion.div
                                key={tag}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id={`tag-${tag}`}
                                    checked={filters.tags.includes(tag)}
                                    onChange={e => {
                                      setFilters(prev => ({
                                        ...prev,
                                        tags: e.target.checked
                                          ? [...prev.tags, tag]
                                          : prev.tags.filter(t => t !== tag)
                                      }));
                                    }}
                                    className="mr-2"
                                  />
                                  <label htmlFor={`tag-${tag}`} className="text-sm">
                                    {tag}
                                  </label>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {filterStats.tags[tag] || 0}
                                </span>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>

                        {/* Date Range */}
                        <motion.div
                          initial={false}
                          animate={{ height: 'auto' }}
                          transition={{ duration: 0.2 }}
                        >
                          <h4 className="font-medium mb-2 flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            Date Range
                          </h4>
                          <div className="space-y-2">
                            <div>
                              <label className="text-sm text-muted-foreground">From</label>
                              <Input
                                type="date"
                                className="w-full mt-1"
                                value={filters.dateFrom?.toISOString().split('T')[0] || ''}
                                onChange={e => {
                                  setFilters(prev => ({
                                    ...prev,
                                    dateFrom: e.target.value ? new Date(e.target.value) : null
                                  }));
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">To</label>
                              <Input
                                type="date"
                                className="w-full mt-1"
                                value={filters.dateTo?.toISOString().split('T')[0] || ''}
                                onChange={e => {
                                  setFilters(prev => ({
                                    ...prev,
                                    dateTo: e.target.value ? new Date(e.target.value) : null
                                  }));
                                }}
                              />
                            </div>
                          </div>
                        </motion.div>

                        {/* Active Filters Summary */}
                        {(filters.types.length > 0 || filters.tags.length > 0 || filters.dateFrom || filters.dateTo) && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="border-t pt-4 mt-4"
                          >
                            <h4 className="font-medium mb-2">Active Filters</h4>
                            <div className="flex flex-wrap gap-2">
                              {filters.types.map(type => (
                                <motion.span
                                  key={type}
                                  initial={{ scale: 0.8 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0.8, opacity: 0 }}
                                  className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-xs"
                                >
                                  <DocumentIcon type={type} className="h-3 w-3 mr-1" />
                                  {type}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 ml-1 hover:text-destructive"
                                    onClick={() => {
                                      setFilters(prev => ({
                                        ...prev,
                                        types: prev.types.filter(t => t !== type)
                                      }));
                                    }}
                                  >
                                    <X className="h-2 w-2" />
                                  </Button>
                                </motion.span>
                              ))}
                              {filters.tags.map(tag => (
                                <motion.span
                                  key={tag}
                                  initial={{ scale: 0.8 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0.8, opacity: 0 }}
                                  className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-xs"
                                >
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 ml-1 hover:text-destructive"
                                    onClick={() => {
                                      setFilters(prev => ({
                                        ...prev,
                                        tags: prev.tags.filter(t => t !== tag)
                                      }));
                                    }}
                                  >
                                    <X className="h-2 w-2" />
                                  </Button>
                                </motion.span>
                              ))}
                              {(filters.dateFrom || filters.dateTo) && (
                                <motion.span
                                  initial={{ scale: 0.8 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0.8, opacity: 0 }}
                                  className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-xs"
                                >
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {filters.dateFrom?.toLocaleDateString()} - {filters.dateTo?.toLocaleDateString()}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 ml-1 hover:text-destructive"
                                    onClick={() => {
                                      setFilters(prev => ({
                                        ...prev,
                                        dateFrom: null,
                                        dateTo: null
                                      }));
                                    }}
                                  >
                                    <X className="h-2 w-2" />
                                  </Button>
                                </motion.span>
                              )}
                            </div>
                          </motion.div>
                        )}

                        {/* Filter Presets */}
                        <div className="border-t pt-4 mt-4">
                          <h4 className="font-medium mb-2">Filter Presets</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Input
                                placeholder="Preset name..."
                                value={presetName}
                                onChange={e => setPresetName(e.target.value)}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (presetName) {
                                    saveFilterPreset(presetName);
                                    setPresetName('');
                                  }
                                }}
                              >
                                Save
                              </Button>
                            </div>
                            {filterPresets.map(preset => (
                              <div
                                key={preset.id}
                                className="flex items-center justify-between p-2 hover:bg-accent/5 rounded-md"
                              >
                                <span className="text-sm">{preset.name}</span>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => applyFilterPreset(preset)}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => deleteFilterPreset(preset.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
              >
                {rightSidebarCollapsed ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>

            {!rightSidebarCollapsed && (
              <div className="flex items-center gap-2">
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as SortOption)}
                >
                  <SelectTrigger className="w-full">
                    <div className="flex items-center">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      <span>Sort by</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dateDesc">Newest first</SelectItem>
                    <SelectItem value="dateAsc">Oldest first</SelectItem>
                    <SelectItem value="nameAsc">Name A-Z</SelectItem>
                    <SelectItem value="nameDesc">Name Z-A</SelectItem>
                    <SelectItem value="typeAsc">Type A-Z</SelectItem>
                    <SelectItem value="typeDesc">Type Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {!rightSidebarCollapsed && (
            <div className="flex-1 overflow-auto p-4">
              <AnimatePresence>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllDocuments}
                      className="text-xs"
                    >
                      Select All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSelection}
                      className="text-xs"
                      disabled={selectedDocuments.size === 0}
                    >
                      Clear Selection
                    </Button>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {filteredAndSortedDocuments.length} documents
                    </span>
                  </div>
                  {filteredAndSortedDocuments.map(document => (
                    <motion.div
                      key={document.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={cn(
                        "p-3 rounded-lg border hover:bg-accent/5 cursor-pointer relative",
                        selectedDocuments.has(document.id) && "border-primary bg-primary/5",
                        isDragging && "opacity-50"
                      )}
                    >
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, document)}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, document)}
                        onClick={(e) => {
                          if (e.ctrlKey || e.metaKey) {
                            toggleDocumentSelection(document.id);
                          } else {
                            setViewingDocument(document);
                          }
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          toggleDocumentSelection(document.id);
                        }}
                        className="h-full"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <DocumentIcon type={document.type} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{document.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              {new Date(document.metadata.dateCreated).toLocaleDateString()}
                            </p>
                          </div>
                          {selectedDocuments.has(document.id) && (
                            <div className="absolute top-2 right-2">
                              <Check className="h-4 w-4 text-primary" />
                            </div>
                          )}
                        </div>
                        {document.metadata.tags && document.metadata.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {document.metadata.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            </div>
          )}

          {/* Batch Operations */}
          {selectedDocuments.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                "sticky bottom-4 left-4 right-4 p-4 bg-background border rounded-lg shadow-lg",
                isDragging && "border-primary border-dashed"
              )}
            >
              <div
                onDragOver={handleDragOver}
                onDrop={(e: React.DragEvent<HTMLDivElement>) => {
                  e.preventDefault();
                  const sourceId = e.dataTransfer.getData('text/plain');
                  if (sourceId) {
                    toggleDocumentSelection(sourceId);
                  }
                }}
                className="h-full"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {selectedDocuments.size} selected
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSelection}
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={batchDownload}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Download selected documents
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const tag = window.prompt('Enter tag to add:');
                            if (tag) batchAddTag(tag);
                          }}
                        >
                          <Tag className="h-4 w-4 mr-2" />
                          Add Tag
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Add tag to selected documents
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to remove selected documents?')) {
                              batchRemove();
                            }
                          }}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Remove selected documents
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        <DocumentViewer
          document={viewingDocument}
          onClose={() => setViewingDocument(null)}
          onDownload={handleDownload}
          renderCodePreview={renderCodePreview}
        />
      </div>
    </TooltipProvider>
  );
} 