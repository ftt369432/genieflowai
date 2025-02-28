import React from 'react';
import { Clock, Star, Trash2, MessageSquare, ThumbsUp, ThumbsDown, Copy, Share, Code, Bookmark, Pencil } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import type { Message } from '../../types/ai';
import { Tooltip } from '../ui/Tooltip';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

interface MessageActions {
  like: () => void;
  dislike: () => void;
  copy: () => void;
  share: () => void;
  toggleCode: () => void;
  bookmark: () => void;
}

interface ChatHistoryProps {
  conversations?: Array<{
    id: string;
    title: string;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
    isFavorite?: boolean;
  }>;
  onSelectConversation?: (conversationId: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
  onToggleFavorite?: (conversationId: string) => void;
  selectedConversationId?: string;
  mode?: 'flash' | 'flash-lite' | 'pro';
  messages: Message[];
  onDelete?: (messageId: string) => void;
  onEdit?: (id: string, content: string) => void;
  renderActions?: (message: Message) => MessageActions;
  reactions?: Record<string, 'like' | 'dislike' | null>;
  codeView?: Record<string, boolean>;
  bookmarked?: Set<string>;
}

export function ChatHistory({
  conversations = [],
  onSelectConversation = () => {},
  onDeleteConversation = () => {},
  onToggleFavorite = () => {},
  selectedConversationId,
  mode = 'pro',
  messages,
  onDelete,
  onEdit,
  renderActions,
  reactions = {},
  codeView = {},
  bookmarked = new Set()
}: ChatHistoryProps) {
  const [editingMessage, setEditingMessage] = React.useState<string | null>(null);
  const [editContent, setEditContent] = React.useState('');

  const getModeStyles = () => {
    switch (mode) {
      case 'flash':
        return {
          active: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
          hover: 'hover:bg-blue-50 dark:hover:bg-blue-800',
          icon: 'text-blue-500'
        };
      case 'flash-lite':
        return {
          active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
          hover: 'hover:bg-green-50 dark:hover:bg-green-800',
          icon: 'text-green-500'
        };
      case 'pro':
        return {
          active: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
          hover: 'hover:bg-purple-50 dark:hover:bg-purple-800',
          icon: 'text-purple-500'
        };
      default:
        return {
          active: 'bg-primary/10 text-primary',
          hover: 'hover:bg-primary/5',
          icon: 'text-primary'
        };
    }
  };

  const styles = getModeStyles();

  const handleStartEdit = (message: Message) => {
    setEditingMessage(message.id);
    setEditContent(message.content);
  };

  const handleSaveEdit = (id: string) => {
    if (onEdit && editContent.trim()) {
      onEdit(id, editContent);
    }
    setEditingMessage(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-2 py-1">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Chat History</span>
      </div>
      
      <div className="space-y-1">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={cn(
              'group flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer',
              styles.hover,
              selectedConversationId === conversation.id && styles.active
            )}
            onClick={() => onSelectConversation(conversation.id)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span className="text-sm truncate">{conversation.title}</span>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(conversation.id);
                }}
              >
                <Star
                  className={cn(
                    'h-4 w-4',
                    conversation.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                  )}
                />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(conversation.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {messages.map((message) => {
        const actions = renderActions && renderActions(message);
        const isUser = message.role === 'user';
        const isEditing = editingMessage === message.id;

        return (
          <div
            key={message.id}
            className={cn(
              'group relative rounded-lg p-4 transition-all',
              isUser ? 'bg-primary/5' : 'bg-card/80 backdrop-blur-sm',
              message.role === 'error' && 'bg-destructive/10'
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {isUser ? 'You' : 'AI Assistant'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(message.id)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingMessage(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className={cn(
                    'prose prose-sm dark:prose-invert max-w-none',
                    isUser ? 'text-sm' : 'text-base text-foreground'
                  )}>
                    {message.content}
                  </div>
                )}

                {message.documents && message.documents.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {message.documents.map(doc => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-1 text-xs bg-primary/10 px-2 py-1 rounded-full"
                      >
                        <span>{doc.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {isUser && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleStartEdit(message)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onDelete && onDelete(message.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={actions?.copy}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={actions?.bookmark}
                >
                  <Bookmark className={cn(
                    "h-4 w-4",
                    bookmarked.has(message.id) && "fill-primary text-primary"
                  )} />
                </Button>
                {!isUser && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={actions?.like}
                    >
                      <ThumbsUp className={cn(
                        "h-4 w-4",
                        reactions[message.id] === 'like' && "fill-primary text-primary"
                      )} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={actions?.dislike}
                    >
                      <ThumbsDown className={cn(
                        "h-4 w-4",
                        reactions[message.id] === 'dislike' && "fill-destructive text-destructive"
                      )} />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
} 