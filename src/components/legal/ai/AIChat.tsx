import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Loader } from 'lucide-react';
import type { AIMessage } from '../../../types/legal';
import { generateLegalResponse } from '../../../services/ai/legalAssistant';
import ReactMarkdown from 'react-markdown';

interface AIChatProps {
  messages: AIMessage[];
  onSend: (message: AIMessage) => void;
}

export function AIChat({ messages, onSend }: AIChatProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: AIMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    onSend(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const response = await generateLegalResponse([...messages, userMessage]);
      
      const assistantMessage: AIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      onSend(assistantMessage);
    } catch (error) {
      console.error('Error generating response:', error);
      // Handle error appropriately
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex w-full ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`w-full rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white max-w-[70%] ml-auto'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              {message.role === 'assistant' ? (
                <ReactMarkdown 
                  className="prose dark:prose-invert max-w-none prose-headings:mb-2 prose-headings:mt-2 prose-p:my-1 prose-ul:my-1 prose-li:my-0.5"
                >
                  {message.content}
                </ReactMarkdown>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {message.attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="text-xs flex items-center text-blue-200 dark:text-blue-300"
                    >
                      <Paperclip size={12} className="mr-1" />
                      {attachment}
                    </div>
                  ))}
                </div>
              )}
              <span className="text-xs opacity-70 mt-2 block">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 rounded-lg border dark:border-gray-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? <Loader className="animate-spin" /> : <Send />}
          </button>
        </div>
      </form>
    </div>
  );
}