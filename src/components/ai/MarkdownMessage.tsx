import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../../lib/utils';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Eye, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { useState } from 'react';
import { CodeBlock } from '../ui/CodeBlock';

interface MarkdownMessageProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
}

interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export function MarkdownMessage({ content, isStreaming, className }: MarkdownMessageProps) {
  const [copiedCodes, setCopiedCodes] = useState<Record<string, boolean>>({});

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodes(prev => ({ ...prev, [index]: true }));
    setTimeout(() => {
      setCopiedCodes(prev => ({ ...prev, [index]: false }));
    }, 2000);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-6 mb-4" {...props} />,
            h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-5 mb-3" {...props} />,
            h3: ({ node, ...props }) => <h3 className="text-md font-bold mt-4 mb-2" {...props} />,
            p: ({ node, ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
            ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4" {...props} />,
            ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4" {...props} />,
            li: ({ node, ...props }) => <li className="mb-1" {...props} />,
            blockquote: ({ node, ...props }) => (
              <blockquote className="border-l-4 border-muted pl-4 italic my-4" {...props} />
            ),
            code: ({ node, inline, className, children, ...props }: CodeProps) => {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';
              const codeIndex = node?.position?.start.offset || 0;
              
              if (inline) {
                return (
                  <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono" {...props}>
                    {children}
                  </code>
                );
              }
              
              return (
                <div className="relative group">
                  <div className="bg-muted/90 px-3 py-1.5 text-xs font-mono border-b border-border/30 flex justify-between items-center">
                    <span>{language.toUpperCase() || 'CODE'}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 opacity-80 hover:opacity-100"
                      onClick={() => handleCopyCode(children as string, codeIndex)}
                    >
                      {copiedCodes[codeIndex] ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                  <SyntaxHighlighter
                    language={language || 'text'}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      borderRadius: '0 0 0.375rem 0.375rem',
                      fontSize: '0.875rem',
                    }}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              );
            },
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full divide-y divide-border" {...props} />
              </div>
            ),
            th: ({ node, ...props }) => (
              <th className="px-3 py-2 text-left text-xs font-medium uppercase bg-muted" {...props} />
            ),
            td: ({ node, ...props }) => (
              <td className="px-3 py-2 text-sm" {...props} />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      
      {isStreaming && (
        <div className="flex space-x-1 mt-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce delay-100" />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce delay-200" />
        </div>
      )}
    </div>
  );
} 