import React, { useState, useRef, useEffect } from 'react';
import { useAssistantStore } from '../../store/assistantStore';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { AIAssistant } from '../../types/ai';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Send, Sparkles, Bot, User, ChevronDown } from 'lucide-react';
import { AIService } from '../../services/ai/aiService';
import { useAIService } from '../../services/ai/aiServiceWrapper';
import { searchDocuments } from '../../services/embeddingService';
import { nanoid } from 'nanoid';
import { useSupabase } from '../../providers/SupabaseProvider';

// Enhanced Message interface
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  error?: boolean;
}

interface AssistantChatProps {
  assistant: AIAssistant;
}

export function AssistantChat({ assistant }: AssistantChatProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const aiService = useAIService();
  const { getAssistantFolders } = useAssistantStore();
  const { documents } = useKnowledgeBaseStore();

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Reset messages when assistant changes
  useEffect(() => {
    setMessages([]);
  }, [assistant.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: Message = {
      id: nanoid(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    // Update messages with user input
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Create a placeholder for the assistant's response
      const assistantMessageId = nanoid();
      setStreamingMessageId(assistantMessageId);
      
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };
      
      // Add the initial empty message that will be streamed to
      setMessages(prev => [...prev, assistantMessage]);
      setIsStreaming(true);

      // Get relevant context from knowledge base
      const folderIds = getAssistantFolders(assistant.id);
      const relevantDocuments = folderIds.length > 0
        ? (await searchRelevantDocuments(userMessage.content, folderIds))
        : [];
      
      // Prepare the messages for the AI service - include current user message
      // Use a copy of the messages array before adding the empty assistant message
      const currentMessages = [...messages, userMessage];
      const historyMessages = formatMessagesForAPI(currentMessages, relevantDocuments);
      
      // Log messages to debug
      console.log('Sending messages to AI:', historyMessages);
      
      // Stream the response
      let responseText = '';
      await aiService.streamChatCompletion(
        historyMessages,
        {
          temperature: assistant.settings?.temperature || 0.7,
          maxTokens: assistant.settings?.maxTokens || 2000,
          frequencyPenalty: assistant.settings?.frequencyPenalty || 0,
          presencePenalty: assistant.settings?.presencePenalty || 0
        },
        (chunk) => {
          responseText += chunk;
          
          // Update the streaming message with each chunk
          setMessages(prev => {
            const updatedMessages = [...prev];
            const assistantMessageIndex = updatedMessages.findIndex(
              msg => msg.id === assistantMessageId
            );
            
            if (assistantMessageIndex !== -1) {
              updatedMessages[assistantMessageIndex] = {
                ...updatedMessages[assistantMessageIndex],
                content: responseText
              };
            }
            
            return updatedMessages;
          });
        }
      );
      
      // Final update once streaming is complete
      setMessages(prev => {
        const updatedMessages = [...prev];
        const assistantMessageIndex = updatedMessages.findIndex(
          msg => msg.id === assistantMessageId
        );
        
        if (assistantMessageIndex !== -1) {
          updatedMessages[assistantMessageIndex] = {
            ...updatedMessages[assistantMessageIndex],
            content: responseText
          };
        }
        
        return updatedMessages;
      });
      
    } catch (error) {
      console.error('Error generating response:', error);
      
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          id: nanoid(),
          role: 'assistant',
          content: 'I encountered an error while generating a response. Please try again.',
          timestamp: new Date(),
          error: true
        }
      ]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingMessageId(null);
    }
  };

  // Format messages for the AI API
  const formatMessagesForAPI = (messageHistory: Message[], relevantDocs: string[]) => {
    const apiMessages = [];
    
    // Add system prompt with context from relevant documents
    let systemPrompt = assistant.systemPrompt || 'You are a helpful AI assistant.';
    
    if (relevantDocs.length > 0) {
      systemPrompt += '\n\nRelevant information from knowledge base:\n' + 
                      relevantDocs.join('\n\n');
    }
    
    apiMessages.push({
      role: 'system',
      content: systemPrompt
    });
    
    // Add conversation history
    messageHistory.forEach(message => {
      if (message.role === 'user' || message.role === 'assistant') {
        apiMessages.push({
          role: message.role,
          content: message.content
        });
      }
    });
    
    // Make sure we have at least one user message
    if (!apiMessages.some(msg => msg.role === 'user')) {
      // Add a default user message if none exists
      apiMessages.push({
        role: 'user',
        content: 'Hello, I need some help.'
      });
    }
    
    console.log('API Messages:', apiMessages);
    
    return apiMessages;
  };

  // Search for relevant documents in the knowledge base
  const searchRelevantDocuments = async (query: string, folderIds: string[]): Promise<string[]> => {
    try {
      // Filter documents by folder IDs
      const folderDocuments = documents.filter(doc => 
        doc.folderId && folderIds.includes(doc.folderId)
      );
      
      if (folderDocuments.length === 0) return [];
      
      // Search for relevant documents
      const results = await searchDocuments(query, folderDocuments, 3);
      
      // Format results for context
      return results.map(result => {
        const doc = result.document;
        return `DOCUMENT: ${doc.title}\nCONTENT: ${doc.content}\nSIMILARITY: ${result.similarity.toFixed(2)}`;
      });
    } catch (error) {
      console.error('Error searching documents:', error);
      return [];
    }
  };

  // Format message content with line breaks
  const formatMessageContent = (content: string) => {
    return content.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        <br />
      </React.Fragment>
    ));
  };

  return (
    <div className="flex flex-col h-full pb-5">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Bot size={48} className="mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Start a conversation</h3>
            <p className="text-sm text-center max-w-md mb-6">
              {assistant.description || "I'm ready to assist you. Send a message to begin."}
            </p>
            
            {/* Conversation starters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-md">
              {[
                "Tell me about my legal rights in this situation...",
                "Review this contract clause for potential issues...",
                "Help me draft a response to this legal matter...",
                "What are the key considerations for this case?",
              ].map((starter, i) => (
                <button
                  key={i}
                  className="p-2 text-sm text-left border rounded-lg hover:bg-muted transition-colors"
                  onClick={() => {
                    setInput(starter);
                    if (inputRef.current) {
                      inputRef.current.focus();
                    }
                  }}
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-12'
                  : 'bg-muted mr-12'
              } ${message.error ? 'border border-red-500' : ''}`}
            >
              <div className="flex-shrink-0 mt-1">
                {message.role === 'user' ? (
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Bot size={16} className="text-gray-700 dark:text-gray-200" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="font-medium">
                    {message.role === 'user' ? 'You' : assistant.name}
                  </div>
                  <div className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div className={`${streamingMessageId === message.id ? 'streaming-message' : ''}`}>
                  {formatMessageContent(message.content)}
                  {streamingMessageId === message.id && (
                    <span className="cursor-blink">▋</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex items-end gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 min-h-[60px] max-h-36 resize-none"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            onClick={handleSendMessage}
            disabled={input.trim() === '' || isLoading}
            className="h-10 w-10"
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-white border-opacity-50 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </Button>
        </div>
        
        <div className="mt-2 text-xs text-center text-muted-foreground flex items-center justify-center">
          <Sparkles size={12} className="mr-1" />
          {assistant.capabilities?.join(', ') || 'General purpose assistant'}
        </div>
      </div>
      
      <div className="cursor-blink-container">
        {/* Custom CSS classes are defined in globals.css */}
      </div>
    </div>
  );
} 