import React from 'react';
import { Bot, User, Clock, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Message } from '../../types/ai';
import { cn } from '../../lib/utils';

interface AIMessageProps {
  message: Message;
  mode: 'normal' | 'turbo' | 'cyborg';
}

export function AIMessage({ message, mode }: AIMessageProps) {
  const isAI = message.role === 'assistant';
  const metadata = message.metadata || {};

  const getModeStyles = () => {
    switch (mode) {
      case 'normal':
        return {
          bg: 'bg-cyberpunk-dark/50',
          border: 'border-cyberpunk-neon/30',
          text: 'text-white',
          icon: 'text-cyberpunk-neon'
        };
      case 'turbo':
        return {
          bg: 'bg-cyberpunk-dark/50',
          border: 'border-cyberpunk-pink/30',
          text: 'text-white',
          icon: 'text-cyberpunk-pink'
        };
      case 'cyborg':
        return {
          bg: 'bg-cyberpunk-dark/50',
          border: 'border-cyberpunk-yellow/30',
          text: 'text-white',
          icon: 'text-cyberpunk-yellow'
        };
      default:
        return {
          bg: 'bg-cyberpunk-dark/50',
          border: 'border-cyberpunk-neon/30',
          text: 'text-white',
          icon: 'text-cyberpunk-neon'
        };
    }
  };

  const styles = getModeStyles();

  return (
    <div className={cn(
      'flex gap-3',
      isAI ? 'justify-start' : 'justify-end'
    )}>
      {isAI && (
        <div className={cn(
          'h-8 w-8 rounded-full border flex items-center justify-center',
          styles.border,
          styles.bg
        )}>
          <Bot className={cn('h-4 w-4', styles.icon)} />
        </div>
      )}
      
      <div className="flex flex-col gap-2 max-w-[80%]">
        <div className={cn(
          'rounded-lg p-4 border',
          styles.bg,
          styles.border,
          styles.text
        )}>
          {isAI ? (
            <ReactMarkdown
              className="text-sm prose prose-invert max-w-none"
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      {...props}
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      className="!bg-black/50 !mt-2 !mb-2"
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code {...props} className={cn(
                      className,
                      '!bg-black/30 !text-cyberpunk-neon !px-1 !py-0.5 !rounded'
                    )}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        {/* Metadata */}
        {isAI && metadata.processingTime && (
          <div className={cn(
            'flex items-center gap-2 text-xs',
            styles.icon
          )}>
            <Clock className="h-3 w-3" />
            <span>{Math.round(metadata.processingTime / 1000)}s</span>
            {mode === 'turbo' && (
              <>
                <Zap className="h-3 w-3 ml-2" />
                <span>Turbo Mode</span>
              </>
            )}
          </div>
        )}
      </div>

      {!isAI && (
        <div className={cn(
          'h-8 w-8 rounded-full border flex items-center justify-center',
          styles.border,
          styles.bg
        )}>
          <User className={cn('h-4 w-4', styles.icon)} />
        </div>
      )}
    </div>
  );
} 