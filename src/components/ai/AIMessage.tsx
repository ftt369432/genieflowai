import React from 'react';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Message } from '../../types/ai';
import { cn } from '../../lib/utils';

interface AIMessageProps {
  message: Message;
}

export function AIMessage({ message }: AIMessageProps) {
  const isAI = message.role === 'assistant';

  return (
    <div className={`flex gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}>
      {isAI && (
        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
          <Bot className="h-4 w-4 text-blue-600" />
        </div>
      )}
      <div className={`max-w-[80%] rounded-lg p-3 ${
        isAI ? 'bg-gray-100' : 'bg-blue-500 text-white'
      }`}>
        {isAI ? (
          <ReactMarkdown
            className="text-sm prose dark:prose-invert max-w-none"
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    {...props}
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code {...props} className={className}>
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
      {!isAI && (
        <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
      )}
    </div>
  );
} 