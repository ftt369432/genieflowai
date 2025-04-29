import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Info, Bot, User, PaperclipIcon } from 'lucide-react';
import type { Message } from '../../types/ai';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';
import { MarkdownMessage } from './MarkdownMessage';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';

export interface ChatBaseProps {
  messages: Message[];
  onSendMessage: (content: string) => void | Promise<void>;
  onFileUpload?: (file: File) => void | Promise<void>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  showSources?: boolean;
  headerComponent?: React.ReactNode;
  footerComponent?: React.ReactNode;
  sidebarComponent?: React.ReactNode;
  messageActionsComponent?: (message: Message) => React.ReactNode;
  variant?: 'default' | 'minimal' | 'assistant' | 'document';
}

export function ChatBase({
  messages,
  onSendMessage,
  onFileUpload,
  placeholder = 'Type your message...',
  className,
  disabled = false,
  loading = false,
  showSources = false,
  headerComponent,
  footerComponent,
  sidebarComponent,
  messageActionsComponent,
  variant = 'default'
}: ChatBaseProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || disabled) return;

    setInput('');
    await onSendMessage(input.trim());
  };
  
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onFileUpload) {
      onFileUpload(e.target.files[0]);
      e.target.value = ''; // Reset input
    }
  };

  // Style variants based on usage context
  const containerStyles = {
    default: 'bg-background',
    minimal: 'bg-transparent',
    assistant: 'bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800',
    document: 'bg-slate-50 dark:bg-slate-900'
  };

  const messageStyles = {
    user: {
      default: 'bg-primary text-primary-foreground',
      minimal: 'bg-blue-500 text-white',
      assistant: 'bg-blue-600 text-white',
      document: 'bg-blue-500 text-white'
    },
    assistant: {
      default: 'bg-muted text-foreground',
      minimal: 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
      assistant: 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100',
      document: 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100'
    }
  };

  return (
    <div className={cn('flex flex-col h-full', containerStyles[variant], className)}>
      {/* Optional Header */}
      {headerComponent && (
        <div className="flex-none">
          {headerComponent}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex w-full max-w-4xl mx-auto',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div className="flex items-start gap-2">
                  {/* Avatar for assistant messages */}
                  {message.role === 'assistant' && variant !== 'minimal' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      'rounded-lg px-4 py-2 max-w-[85%]',
                      message.role === 'user'
                        ? messageStyles.user[variant]
                        : messageStyles.assistant[variant]
                    )}
                  >
                    {/* Message content with markdown support */}
                    <MarkdownMessage content={message.content} />
                    
                    {/* Timestamp */}
                    <div className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                    
                    {/* Show source info if available */}
                    {showSources && message.metadata?.sources && (
                      <div className="mt-2 text-xs flex items-center">
                        <Info className="h-3 w-3 mr-1" />
                        <span>
                          {message.metadata.sources.length} source{message.metadata.sources.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                    
                    {/* Custom message actions */}
                    {messageActionsComponent && messageActionsComponent(message)}
                  </div>
                  
                  {/* Avatar for user messages */}
                  {message.role === 'user' && variant !== 'minimal' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex gap-2 max-w-4xl mx-auto">
              {/* File upload button */}
              {onFileUpload && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={handleFileSelect}
                        disabled={disabled || loading}
                      >
                        <PaperclipIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Upload file to knowledge base
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {/* Hidden file input */}
              {onFileUpload && (
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt,.md"
                />
              )}
              
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder}
                disabled={disabled || loading}
                className="flex-1"
              />
              
              <Button
                type="submit"
                size="icon"
                disabled={disabled || loading || !input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
          
          {/* Optional Footer */}
          {footerComponent && (
            <div className="flex-none">
              {footerComponent}
            </div>
          )}
        </div>
        
        {/* Optional Sidebar */}
        {sidebarComponent && (
          <div className="border-l w-80 overflow-auto hidden md:block">
            {sidebarComponent}
          </div>
        )}
      </div>
    </div>
  );
} 