import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../../types/ai';
import { Button } from '../ui/Button';
import { Send, Loader2 } from 'lucide-react';
import { chatWithAssistant } from '../../services/documentChatService';

interface AIChatProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  assistant?: any;
  isLoading?: boolean;
}

export function AIChat({ messages, onSendMessage, assistant, isLoading: externalLoading }: AIChatProps) {
  const [input, setInput] = useState('');
  const [internalLoading, setInternalLoading] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  // Use either external loading state or internal loading state
  const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    
    // If parent component handles message sending, use that
    if (onSendMessage) {
      onSendMessage(userMessage);
      setInput('');
      return;
    }
    
    // Otherwise handle internally if assistant is provided
    if (assistant) {
      setInternalLoading(true);
      try {
        // Call real API service directly
        const result = await chatWithAssistant(
          assistant,
          userMessage,
          messages.slice(-10) // Use last 10 messages for context
        );
        
        // Handle successful response - this will be implemented by parent component
        // since we don't have direct access to the messages state here
      } catch (error) {
        console.error('Error getting AI response:', error);
      } finally {
        setInternalLoading(false);
      }
    }
    
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-white'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <div className="mt-1 text-xs opacity-50">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messageEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-gray-800 text-white placeholder:text-gray-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
} 