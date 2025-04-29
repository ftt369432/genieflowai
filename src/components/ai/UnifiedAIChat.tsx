import React, { useState, useEffect, useCallback } from 'react';
import { AIAssistant, Message, AIDocument } from '../../types/ai';
import { ChatBase } from './ChatBase';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { FileText, Book, Info, Star, Copy, Share } from 'lucide-react';
import { Button } from '../ui/Button';
import { chatWithAssistant } from '../../services/documentChatService';
import { useToast } from '../../hooks/useToast';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { processFile } from '../../utils/documentProcessing';

// Types for sources panel
interface SourceReference {
  document: AIDocument;
  similarity: number;
}

interface UnifiedAIChatProps {
  assistant?: AIAssistant;
  initialMessages?: Message[];
  welcomeMessage?: string;
  onBack?: () => void;
  className?: string;
  variant?: 'default' | 'minimal' | 'assistant' | 'document';
  enableKnowledgeBaseUpload?: boolean;
  onAssistantUpdate?: (assistant: AIAssistant) => void;
  chatTitle?: string;
}

export function UnifiedAIChat({
  assistant,
  initialMessages = [],
  welcomeMessage,
  onBack,
  className,
  variant = 'default',
  enableKnowledgeBaseUpload = false,
  onAssistantUpdate,
  chatTitle
}: UnifiedAIChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<SourceReference[]>([]);
  const [activeTab, setActiveTab] = useState<string>('chat');
  const { toast } = useToast();
  const { addDocumentToFolder } = useKnowledgeBaseStore();

  // Initialize with welcome message if provided
  useEffect(() => {
    if (welcomeMessage && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: welcomeMessage,
          timestamp: new Date()
        }
      ]);
    }
  }, [welcomeMessage, messages.length]);

  // Create a customized welcome message when an assistant is selected
  useEffect(() => {
    if (assistant && messages.length === 0) {
      const assistantWelcome = {
        id: 'welcome',
        role: 'assistant',
        content: `Hello! I'm ${assistant.name}. ${assistant.description || ''} How can I help you today?`,
        timestamp: new Date()
      };
      setMessages([assistantWelcome]);
    }
  }, [assistant, messages.length]);

  // Handle sending messages
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || loading) return;

    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    // Add to messages
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      let response;
      
      // If we have an assistant, use the specialized assistant chat
      if (assistant) {
        console.log(`Sending message to assistant: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`);
        
        // Get response using chatWithAssistant service
        const result = await chatWithAssistant(
          assistant,
          content,
          messages.filter(m => m.id !== 'welcome') // Filter out welcome message
        );
        
        response = {
          content: result.message,
          sources: result.relevantDocuments || []
        };
        
        // Update sources for the sidebar
        if (result.relevantDocuments && result.relevantDocuments.length > 0) {
          setSources(result.relevantDocuments);
        }
      } else {
        // Use general AI service for non-assistant chats
        // This should be replaced with your actual general AI service call
        const result = await chatWithAssistant("general", content, messages);
        response = {
          content: result.message,
          sources: []
        };
      }

      // Create and add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        metadata: {
          sources: response.sources,
          assistantId: assistant?.id
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting response:', error);
      
      // Create error message
      let errorMessage = 'Sorry, I encountered an error while processing your request.';
      if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
      }
      
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: errorMessage,
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handle file uploads to knowledge base
  const handleFileUpload = async (file: File) => {
    if (!assistant || !assistant.knowledgeBase || assistant.knowledgeBase.length === 0) {
      toast({
        title: "Upload Error",
        description: "This assistant doesn't have a knowledge base folder configured.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Process the file (extract text, create embeddings, etc.)
      const processedDocument = await processFile(file);
      
      // Add to the first knowledge base folder of the assistant
      const targetFolderId = assistant.knowledgeBase[0].id;
      await addDocumentToFolder(processedDocument, targetFolderId);
      
      // Update the assistant's knowledge
      if (onAssistantUpdate) {
        onAssistantUpdate({
          ...assistant,
          lastUpdated: new Date()
        });
      }
      
      // Add system message about the upload
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `I've added "${file.name}" to my knowledge base. I'll use this information to better assist you.`,
          timestamp: new Date()
        }
      ]);
      
      toast({
        title: "File Added",
        description: `${file.name} has been added to the assistant's knowledge base.`
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to process the file.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Render custom message actions (copy, share, etc.)
  const renderMessageActions = useCallback((message: Message) => {
    if (message.role !== 'assistant') return null;
    
    return (
      <div className="flex gap-2 mt-2">
        <Button variant="ghost" size="xs" onClick={() => {
          navigator.clipboard.writeText(message.content);
          toast({ title: "Copied to clipboard" });
        }}>
          <Copy className="h-3 w-3 mr-1" /> Copy
        </Button>
        
        {message.metadata?.sources && message.metadata.sources.length > 0 && (
          <Button variant="ghost" size="xs" onClick={() => setActiveTab('sources')}>
            <Info className="h-3 w-3 mr-1" /> Sources
          </Button>
        )}
      </div>
    );
  }, [toast]);

  // Render the sources sidebar
  const renderSourcesSidebar = () => {
    if (sources.length === 0) return null;
    
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Book className="h-4 w-4" />
          <h3 className="font-medium">Knowledge Sources</h3>
        </div>
        
        <Tabs defaultValue="relevant" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="relevant" className="flex-1">Relevant</TabsTrigger>
            <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
          </TabsList>
          
          <TabsContent value="relevant" className="mt-4 space-y-3">
            {sources.map(({ document, similarity }) => (
              <Card key={document.id} className="p-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-sm">{document.metadata?.title || document.name || 'Untitled'}</h4>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(similarity * 100)}%
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                  {document.content.substring(0, 150)}...
                </p>
                <div className="flex gap-2 mt-2">
                  <Button variant="ghost" size="xs">
                    <FileText className="h-3 w-3 mr-1" /> View
                  </Button>
                </div>
              </Card>
            ))}
          </TabsContent>
          
          <TabsContent value="all" className="mt-4">
            {assistant?.knowledgeBase && assistant.knowledgeBase.flatMap(folder => (
              <div key={folder.id} className="mb-4">
                <h4 className="text-sm font-medium mb-2">{folder.name}</h4>
                <div className="space-y-2">
                  {folder.documents?.map(doc => (
                    <Card key={doc.id} className="p-2">
                      <div className="text-xs">{doc.name || doc.metadata?.title || 'Untitled'}</div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // Header with title and back button
  const renderHeader = () => {
    if (!onBack && !chatTitle && !assistant) return null;
    
    return (
      <div className="border-b p-4 flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Button>
        )}
        
        <div>
          <h2 className="text-xl font-semibold">{assistant?.name || chatTitle || "Chat"}</h2>
          {assistant?.description && (
            <p className="text-muted-foreground text-sm">{assistant.description}</p>
          )}
        </div>
        
        {assistant && (
          <Badge variant="outline" className="ml-auto">
            <Star className="h-3 w-3 mr-1 text-yellow-500" /> 
            Assistant
          </Badge>
        )}
      </div>
    );
  };

  return (
    <ChatBase
      messages={messages}
      onSendMessage={handleSendMessage}
      onFileUpload={enableKnowledgeBaseUpload ? handleFileUpload : undefined}
      loading={loading}
      showSources={!!assistant}
      className={className}
      variant={variant}
      headerComponent={renderHeader()}
      sidebarComponent={sources.length > 0 ? renderSourcesSidebar() : undefined}
      messageActionsComponent={renderMessageActions}
      placeholder={assistant ? `Ask ${assistant.name} something...` : "Type your message..."}
    />
  );
} 