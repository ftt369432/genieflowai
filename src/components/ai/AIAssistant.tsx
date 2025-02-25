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
import { Mic, Send, Settings } from 'lucide-react';
import type { Message } from '../../types/ai';

export function AIAssistant() {
  const { sendMessage, config, updateConfig, isLoading } = useAI();
  const { searchKnowledge } = useKnowledgeBase();
  const { startListening, stopListening, isListening } = useVoiceCommands({
    onCommand: handleVoiceCommand
  });
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function handleVoiceCommand(command: string) {
    setInput(command);
    await handleMessage(command);
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleMessage = async (content: string) => {
    try {
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

      // Get AI response
      const response = await sendMessage(content, {
        model: config.model,
        systemPrompt,
        temperature: config.temperature,
        maxTokens: config.maxTokens
      });

      // Add AI response
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response || '',
        timestamp: new Date()
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
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

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
          {messages.map((message, index) => (
            <AIMessage key={index} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <FileUpload
              files={files}
              onFilesChange={setFiles}
            />
            
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
              />
              
              <Button
                type="button"
                variant="outline"
                onClick={toggleVoice}
                className={isListening ? 'bg-red-100' : ''}
              >
                <Mic className="h-4 w-4" />
              </Button>
              
              <Button type="submit" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Settings Sidebar */}
      {showSettings && (
        <div className="w-80 border-l p-4 space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium">Model Settings</h3>
            <AIModelSelector
              selectedModel={config.model}
              onModelChange={(model) => updateConfig({ model })}
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">System Prompt</h3>
            <SystemPrompt
              prompt={systemPrompt}
              onPromptChange={setSystemPrompt}
              isOpen={true}
              onToggle={() => {}}
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Documents</h3>
            <DocumentPicker
              onDocumentSelect={(doc) => {
                // Handle document selection
                console.log('Selected document:', doc);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}