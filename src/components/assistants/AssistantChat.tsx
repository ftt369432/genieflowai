import React, { useState, useRef, useEffect } from 'react';
import { AIAssistant, Message } from '../../types/ai';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Send, ArrowLeft, Book, Loader2, AlertTriangle } from 'lucide-react';
import { chatWithAssistant } from '../../services/documentChatService';

interface AssistantChatProps {
  assistant: AIAssistant;
  onBack?: () => void;
}

export function AssistantChat({ assistant, onBack }: AssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<any[]>([]);
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  // Initial message from the assistant
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Hello! I'm ${assistant.name}. ${assistant.description || ''} How can I help you today?`,
        timestamp: new Date()
      }
    ]);
  }, [assistant]);
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    // Reset error state
    setError(null);
    
    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    // Save input before clearing
    const userInput = input.trim();
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      console.log(`Sending message to assistant: "${userInput.substring(0, 50)}${userInput.length > 50 ? '...' : ''}"`);
      
      // Get response from the assistant using the chatWithAssistant service
      // This returns a string directly, not an object with message property
      const response = await chatWithAssistant(
        assistant,
        userInput
      );
      
      // Since response is a string (not an object with message property),
      // we can check it directly
      if (response && (response.startsWith('Error:') || response.includes('trouble accessing my AI service'))) {
        setError(response);
        // Still add the response to chat but mark it as an error
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response,
          timestamp: new Date(),
          metadata: { isError: true }
        };
        setMessages(prev => [...prev, errorMessage]);
      } else if (response) {
        // Add normal assistant's response to the chat
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Handle empty response
        console.error('Received empty response from assistant');
        setError('Received an empty response from the assistant.');
        const unexpectedResponseMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I received an empty response. Please try again.',
          timestamp: new Date(),
          metadata: { isError: true }
        };
        setMessages(prev => [...prev, unexpectedResponseMessage]);
      }
      
      // Since we're not getting relevantDocuments anymore in this implementation,
      // we'll skip updating sources
    } catch (error) {
      console.error('Error getting assistant response:', error);
      
      // Set the error state
      setError('An error occurred while communicating with the assistant');
      
      // Determine specific error message
      let errorMessage = 'Sorry, I encountered an error while processing your request.';
      if (error instanceof Error) {
        if (error.message.includes('message channel closed')) {
          errorMessage = 'The connection was interrupted. Please try again.';
          console.warn('Message channel closed prematurely:', error);
        } else if (error.message.includes('API key')) {
          errorMessage = 'There seems to be an issue with the API configuration. Please check your Gemini API key.';
        } else if (error.message.includes('quota')) {
          errorMessage = 'The API quota has been exceeded. Please try again later.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      // Add error message to chat
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: errorMessage,
          timestamp: new Date(),
          metadata: { isError: true }
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-4 flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h2 className="text-xl font-semibold">{assistant.name}</h2>
          {assistant.description && (
            <p className="text-muted-foreground text-sm">{assistant.description}</p>
          )}
        </div>
        
        {/* Error banner if needed */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : message.metadata?.isError 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-muted'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {/* Show typing indicator when loading */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          )}
          
          {/* Invisible element to scroll to */}
          <div ref={messageEndRef} />
        </div>
        
        {/* Input form */}
        <form onSubmit={handleSubmit} className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${assistant.name} something...`}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
      
      {/* Sources panel */}
      {sources.length > 0 && (
        <div className="w-80 border-l overflow-y-auto p-4">
          <div className="flex items-center gap-2 mb-3">
            <Book className="h-4 w-4" />
            <h3 className="font-medium">Sources</h3>
          </div>
          
          <div className="space-y-3">
            {sources.map(({ document, similarity }) => (
              <Card key={document.id} className="p-3">
                <h4 className="font-medium text-sm">{document.metadata?.title || 'Untitled'}</h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                  {document.content.substring(0, 150)}...
                </p>
                <div className="mt-2 text-xs">
                  Relevance: {Math.round(similarity * 100)}%
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}