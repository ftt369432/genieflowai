import React, { useState } from 'react';
import { Book, FileText, Copy, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { DocumentSearch } from '../knowledge/DocumentSearch';
import type { AIDocument } from '../../types/ai';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/Collapsible';

// Define the SearchResult interface that matches what's used in embeddingService.ts
interface SearchResult {
  document: AIDocument;
  similarity: number;
}

interface EmailKnowledgeBaseProps {
  onInsertContent: (content: string) => void;
}

export function EmailKnowledgeBase({ onInsertContent }: EmailKnowledgeBaseProps) {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyContent = (content: string, id: string) => {
    onInsertContent(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <Card className="border">
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-md flex items-center">
            <Book className="h-4 w-4 mr-2" />
            Knowledge Base
          </CardTitle>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="px-4 py-3 space-y-4">
            <DocumentSearch
              placeholder="Search knowledge base..."
              onResultsFound={setSearchResults}
              autoFocus={false}
            />
            
            {searchResults.length > 0 ? (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {searchResults.map(result => (
                  <KnowledgeBaseResultItem
                    key={result.document.id}
                    result={result}
                    onInsert={handleCopyContent}
                    isCopied={copiedId === result.document.id}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <FileText className="h-10 w-10 mx-auto text-gray-300" />
                <p className="mt-2">Search for knowledge base content to insert into your email</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

interface KnowledgeBaseResultItemProps {
  result: SearchResult;
  onInsert: (content: string, id: string) => void;
  isCopied: boolean;
}

function KnowledgeBaseResultItem({ 
  result, 
  onInsert, 
  isCopied 
}: KnowledgeBaseResultItemProps) {
  const [expanded, setExpanded] = useState(false);
  const { document } = result;
  
  const handleInsert = () => {
    onInsert(document.content, document.id);
  };
  
  // Extract a snippet from the content
  const snippet = document.content.slice(0, 150) + (document.content.length > 150 ? '...' : '');
  
  // Get title from metadata or use "Untitled Document" as fallback
  const title = document.metadata?.title || 'Untitled Document';
  
  // Get tags from metadata safely
  const tags = document.metadata?.tags || [];
  
  return (
    <div className="border rounded-md p-3">
      <div className="flex justify-between items-start">
        <div className="font-medium">{title}</div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleInsert}
          className="h-7 w-7 p-0"
        >
          {isCopied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      <div className="text-sm text-gray-600 mt-1">
        {expanded ? document.content : snippet}
      </div>
      
      {document.content.length > 150 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-blue-500 mt-1 hover:underline"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
      
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag: string) => (
            <span key={tag} className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
} 