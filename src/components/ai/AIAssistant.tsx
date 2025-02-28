import React, { useState, useRef, useEffect } from 'react';
import { useAI } from '../../hooks/useAI';
import { useVoiceCommands } from '../../hooks/useVoiceCommands';
import { useKnowledgeBase } from '../../hooks/useKnowledgeBase';
import { AIMessage } from './AIMessage';
import { AIModelSelector } from './AIModelSelector';
import { SystemPrompt } from './SystemPrompt';
import { DocumentPicker } from './DocumentPicker';
import { FileUpload } from './FileUpload';
import { AgentSuggestionPanel } from '../agents/AgentSuggestionPanel';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Mic, Send, Settings, Loader2 } from 'lucide-react';
import type { Message } from '../../types/ai';

interface AIAssistantProps {
  mode: 'normal' | 'turbo' | 'cyborg';
}

export function AIAssistant({ mode }: AIAssistantProps) {
  const { sendMessage, config, updateConfig, isLoading } = useAI();
  const { searchKnowledge } = useKnowledgeBase();
  const { startListening, stopListening, isListening } = useVoiceCommands({
    onCommand: handleVoiceCommand
  });
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [systemPrompt, setSystemPrompt] = useState(getDefaultSystemPrompt(mode));
  const [showSettings, setShowSettings] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setSystemPrompt(getDefaultSystemPrompt(mode));
  }, [mode]);

  function getDefaultSystemPrompt(mode: 'normal' | 'turbo' | 'cyborg'): string {
    switch (mode) {
      case 'normal':
        return 'You are a helpful AI assistant. Provide clear and concise responses.';
      case 'turbo':
        return 'You are a high-performance AI assistant optimized for speed and efficiency. Provide quick, actionable responses.';
      case 'cyborg':
        return 'You are an advanced cybernetic intelligence with deep technical knowledge. Provide detailed technical analysis and solutions.';
      default:
        return 'You are a helpful AI assistant.';
    }
  }

  async function handleVoiceCommand(command: string) {
    setInput(command);
    await handleMessage(command);
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleMessage = async (content: string) => {
    try {
      setIsThinking(true);
      
      // Add user message
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

      // Search knowledge base for context
      const relevantKnowledge = await searchKnowledge(content);

      // Get AI response with mode-specific settings
      const response = await sendMessage(content, {
        model: config.model,
        systemPrompt,
        temperature: getModeTemperature(mode),
        maxTokens: getMaxTokens(mode),
        context: relevantKnowledge
      });

      // Add AI response
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response || '',
        timestamp: new Date(),
        metadata: {
          mode,
          model: config.model,
          processingTime: Date.now() - userMessage.timestamp.getTime()
        }
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // Clear input
      setInput('');
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, there was an error processing your request.',
        timestamp: new Date(),
        metadata: { error: true }
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  function getModeTemperature(mode: 'normal' | 'turbo' | 'cyborg'): number {
    switch (mode) {
      case 'normal':
        return 0.7;
      case 'turbo':
        return 0.9;
      case 'cyborg':
        return 0.5;
      default:
        return 0.7;
    }
  }

  function getMaxTokens(mode: 'normal' | 'turbo' | 'cyborg'): number {
    switch (mode) {
      case 'normal':
        return 1000;
      case 'turbo':
        return 500;
      case 'cyborg':
        return 2000;
      default:
        return 1000;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    await handleMessage(input);
  };

  const toggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col h-full">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <AIMessage 
              key={message.id} 
              message={message}
              mode={mode}
            />
          ))}
          {isThinking && (
            <div className="flex items-center gap-2 text-cyberpunk-neon">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-cyberpunk-neon/20 p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <FileUpload
              files={files}
              onFilesChange={setFiles}
              mode={mode}
            />
            
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask me anything in ${mode} mode...`}
                disabled={isLoading}
                className="flex-1 bg-cyberpunk-dark/50 border-cyberpunk-neon/30 text-white"
              />
              
              <Button
                type="button"
                variant="outline"
                onClick={toggleVoice}
                className={`${isListening ? 'bg-cyberpunk-pink/20 text-cyberpunk-pink' : 'text-white'}`}
              >
                <Mic className="h-4 w-4" />
              </Button>
              
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="bg-cyberpunk-neon hover:bg-cyberpunk-neon/80 text-black"
              >
                <Send className="h-4 w-4" />
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSettings(!showSettings)}
                className="text-white"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Settings Sidebar */}
      {showSettings && (
        <div className="w-80 border-l border-cyberpunk-neon/20 p-4 space-y-6 bg-cyberpunk-dark/50">
          <div className="space-y-4">
            <h3 className="font-medium text-cyberpunk-neon">Model Settings</h3>
            <AIModelSelector
              selectedModel={config.model}
              onModelChange={(model) => updateConfig({ model })}
              mode={mode}
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-cyberpunk-neon">System Prompt</h3>
            <SystemPrompt
              prompt={systemPrompt}
              onPromptChange={setSystemPrompt}
              isOpen={true}
              onToggle={() => {}}
              mode={mode}
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-cyberpunk-neon">Documents</h3>
            <DocumentPicker
              onDocumentSelect={(doc) => {
                // Handle document selection
                console.log('Selected document:', doc);
              }}
              mode={mode}
            />
          </div>
        </div>
      )}
    </div>
  );
}