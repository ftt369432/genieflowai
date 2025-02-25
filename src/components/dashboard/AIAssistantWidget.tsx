import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Card } from '../ui/Card';
import { useNavigate } from 'react-router-dom';
import { useAIStore } from '../../store/aiStore';

export function AIAssistantWidget() {
  const { messages, conversationHistory } = useAIStore();
  const navigate = useNavigate();

  return (
    <Card 
      className="p-4 hover:shadow-md transition-shadow cursor-pointer" 
      onClick={() => navigate('/ai-assistant')}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-500" />
          AI Assistant
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-sm">
          <div className="font-medium">{messages.length}</div>
          <div className="text-gray-500">Current Messages</div>
        </div>
        <div className="text-sm">
          <div className="font-medium">{conversationHistory.length}</div>
          <div className="text-gray-500">Saved Chats</div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-gray-500 mb-2">Recent Messages</div>
          <div className="space-y-1">
            {messages.slice(-2).map((message, index) => (
              <div key={index} className="text-sm truncate">
                <span className="font-medium">
                  {message.role === 'user' ? 'You: ' : 'AI: '}
                </span>
                {message.content}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
} 