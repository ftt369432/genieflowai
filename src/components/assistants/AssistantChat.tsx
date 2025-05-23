import React, { useState, useRef, useEffect } from 'react';
import { AIAssistant, Message } from '../../types/ai';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Send, ArrowLeft, Book, Loader2 } from 'lucide-react';
import { chatWithAssistant } from '../../services/documentChatService';

interface AssistantChatProps {
  assistant: AIAssistant;
  onBack?: () => void;
}

export function AssistantChat({ assistant, onBack }: AssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
    
    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Get response from the assistant using the chatWithAssistant service
      const result = await chatWithAssistant(
        assistant,
        input,
        messages.filter(m => m.id !== 'welcome') // Filter out welcome message from context
      );
      
      // Add assistant's response to the chat
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.message,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update document sources
      if (result.relevantDocuments && result.relevantDocuments.length > 0) {
        setSources(result.relevantDocuments);
      }
    } catch (error) {
      console.error('Error getting assistant response:', error);
      // Add error message to chat
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error while processing your request.',
          timestamp: new Date()
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