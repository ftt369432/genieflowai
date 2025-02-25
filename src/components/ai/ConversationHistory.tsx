import React from 'react';
import { ScrollArea } from '../ui/ScrollArea';
import { Button } from '../ui/Button';
import { MessageSquare, Trash2, RotateCcw } from 'lucide-react';
import { useAI } from '../../contexts/AIContext';
import type { Message } from '../../types/ai';

interface ConversationHistoryProps {
  onClose: () => void;
}

export function ConversationHistory({ onClose }: ConversationHistoryProps) {
  const { conversationHistory, clearMessages, restoreConversation } = useAI();

  const getConversationPreview = (messages: Message[]) => {
    const firstMessage = messages.find(m => m.role === 'user')?.content;
    return firstMessage ? firstMessage.slice(0, 50) + '...' : 'Empty conversation';
  };

  const handleRestore = (index: number) => {
    restoreConversation(index);
    onClose();
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-[300px] bg-white rounded-lg shadow-lg border">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Conversation History</h3>
          <Button variant="ghost" size="sm" onClick={clearMessages}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ScrollArea className="h-[300px]">
        <div className="p-2 space-y-2">
          {conversationHistory.map((conversation, index) => (
            <div
              key={index}
              className="p-3 hover:bg-gray-50 rounded-lg group"
            >
              <div className="flex items-start gap-3">
                <MessageSquare className="h-4 w-4 mt-1 text-gray-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {getConversationPreview(conversation)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(conversation[0]?.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100"
                  onClick={() => handleRestore(index)}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
} 