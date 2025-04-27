import React from 'react';
import { oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import Prism from 'react-syntax-highlighter/dist/cjs/prism';

interface SyntaxHighlighterProps {
  language?: string;
  children: string;
  showLineNumbers?: boolean;
  className?: string;
}

export function SyntaxHighlighter({
  language = 'javascript',
  children,
  showLineNumbers = true,
  className,
}: SyntaxHighlighterProps) {
  // Extract language from className if provided (e.g. "language-typescript")
  if (className && className.startsWith('language-')) {
    language = className.replace('language-', '');
  }
  
  return (
    <div className="overflow-hidden rounded-md border">
      <Prism
        language={language}
        style={oneLight}
        showLineNumbers={showLineNumbers}
        customStyle={{
          margin: 0,
          fontSize: '0.9rem',
          lineHeight: '1.5',
        }}
      >
        {children.trim()}
      </Prism>
    </div>
  );
} 