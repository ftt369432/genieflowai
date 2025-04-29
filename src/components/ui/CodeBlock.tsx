import React from 'react';

interface CodeBlockProps {
  language?: string;
  children: string;
  showLineNumbers?: boolean;
  className?: string;
}

/**
 * A simple code block component that doesn't rely on react-syntax-highlighter
 * This avoids the build errors with ESM imports
 */
export function CodeBlock({
  language = 'javascript',
  children,
  className,
}: CodeBlockProps) {
  // Extract language from className if provided (e.g. "language-typescript")
  if (className && className.startsWith('language-')) {
    language = className.replace('language-', '');
  }
  
  return (
    <div className="overflow-hidden rounded-md border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
      {language && (
        <div className="bg-gray-100 px-4 py-1 text-xs font-mono text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          {language}
        </div>
      )}
      <pre className="overflow-x-auto p-4 text-sm">
        <code className="font-mono">{children.trim()}</code>
      </pre>
    </div>
  );
} 