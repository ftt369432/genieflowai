import React from 'react';
import ReactMarkdown from 'react-markdown';
import Prism from 'react-syntax-highlighter/dist/cjs/prism';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import type { Message } from '../../types/ai';
import { cn } from '../../lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { Card } from '../ui/Card';
import { Copy } from 'lucide-react';
import { userProfileStore } from '../../store/userProfileStore';
import { useToast } from '../../hooks/useToast';

interface AIMessageProps {
  message: Message;
  isLast?: boolean;
}

export function AIMessage({ message, isLast = false }: AIMessageProps) {
  const { toast } = useToast();
  const profile = userProfileStore((state) => state.profile);
  
  const isUser = message.role === 'user';
  const provider = message.metadata?.provider || 'default';
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'Message text has been copied to your clipboard.',
    });
  };
  
  return (
    <div className={cn(
      'flex w-full mb-4 fade-in-50',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      <div className={cn(
        'flex items-start max-w-3xl',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}>
        <div className={cn('mt-1', isUser ? 'ml-2' : 'mr-2')}>
          {isUser ? (
            <Avatar className="h-8 w-8">
              {profile?.photoURL && <AvatarImage src={profile.photoURL} alt={profile.displayName || 'User'} />}
              <AvatarFallback>{profile?.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
          ) : (
            <Avatar className="h-8 w-8 bg-primary">
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
          )}
        </div>
        
        <Card className={cn(
          'p-4 relative group',
          isUser ? 'bg-primary/10 text-primary-foreground' : 'bg-card'
        )}>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => handleCopy(message.content)}
              className="p-1 rounded-sm hover:bg-accent"
              aria-label="Copy message"
            >
              <Copy size={14} />
            </button>
          </div>
          
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <div className="relative my-3 rounded-md overflow-hidden border border-border">
                    <div className="bg-muted/50 py-1 px-2 text-xs border-b border-border">
                      {match[1]}
                    </div>
                    <Prism
                      language={match[1]}
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        padding: '1rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      {String(children).replace(/\n$/, '')}
                    </Prism>
                  </div>
                ) : (
                  <code
                    className={cn(
                      'bg-muted/50 px-1 py-0.5 rounded-sm text-sm font-mono',
                      className
                    )}
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
          
          {!isUser && (
            <div className="text-xs mt-2 text-muted-foreground">
              {provider === 'google' ? 'Gemini' : 
               provider === 'openai' ? 'OpenAI' : 
               provider === 'anthropic' ? 'Claude' : 
               'AI'} 
              {message.metadata?.model && ` • ${message.metadata.model}`}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
} 