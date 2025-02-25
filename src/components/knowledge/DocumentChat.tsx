import React, { useState, useRef, useEffect } from 'react';
import { Message, SearchResult } from '../../types/ai';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { chatWithDocuments } from '../../services/documentChatService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { MessageSquare, Send, Book } from 'lucide-react';

interface DocumentChatProps {
  initialDocuments?: SearchResult[];
}

export function DocumentChat({ initialDocuments }: DocumentChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { documents } = useKnowledgeBaseStore();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [relevantDocs, setRelevantDocs] = useState<SearchResult[]>(initialDocuments || []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

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
      const { message, relevantDocuments } = await chatWithDocuments(
        input,
        documents,
        messages
      );

      setRelevantDocs(relevantDocuments);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: message,
        timestamp: new Date(),
        documents: relevantDocuments.map(({ document }) => ({
          id: document.id,
          title: document.title,
          excerpt: document.content.slice(0, 100) + '...',
          type: document.type,
          relevance: 1
        }))
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to get response:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'error',
        content: 'Sorry, I encountered an error while processing your request.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
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
                    ? 'bg-blue-500 text-white'
                    : message.role === 'error'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100'
                }`}
              >
                <p>{message.content}</p>
                {message.documents && (
                  <div className="mt-2 text-sm">
                    <p className="font-medium">Referenced Documents:</p>
                    <ul className="list-disc list-inside">
                      {message.documents.map(doc => (
                        <li key={doc.id}>{doc.title}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your documents..."
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <div className="animate-spin">⌛</div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </div>

      {relevantDocs.length > 0 && (
        <div className="w-64 border-l p-4">
          <h3 className="font-medium flex items-center gap-2 mb-3">
            <Book className="h-4 w-4" />
            Relevant Documents
          </h3>
          <div className="space-y-2">
            {relevantDocs.map(({ document, similarity }) => (
              <Card key={document.id} className="p-2">
                <p className="font-medium text-sm">{document.title}</p>
                <p className="text-xs text-gray-500">
                  Relevance: {Math.round(similarity * 100)}%
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 