import React, { useState, useCallback, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useDebounce } from '../../hooks/useDebounce';
import { searchDocuments } from '../../services/embeddingService';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import type { AIDocument, SearchResult } from '../../types/ai';

interface DocumentSearchProps {
  onResultsFound?: (results: SearchResult[]) => void;
  placeholder?: string;
  showIcon?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function DocumentSearch({
  onResultsFound,
  placeholder = 'Search documents...',
  showIcon = true,
  autoFocus = false,
  className = ''
}: DocumentSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 500);
  const { documents } = useKnowledgeBaseStore();

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      onResultsFound?.([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchDocuments(query, documents);
      onResultsFound?.(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [documents, onResultsFound]);

  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {showIcon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            {isSearching ? (
              <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
            ) : (
              <Search className="h-4 w-4 text-gray-400" />
            )}
          </div>
        )}
        <Input
          type="search"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full ${showIcon ? 'pl-10' : ''}`}
          autoFocus={autoFocus}
        />
      </div>
    </div>
  );
}

interface DocumentSearchWithResultsProps extends DocumentSearchProps {
  maxResults?: number;
  showFilter?: boolean;
}

export function DocumentSearchWithResults({
  maxResults = 5,
  showFilter = false,
  ...props
}: DocumentSearchWithResultsProps) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { tags } = useKnowledgeBaseStore();

  const handleResultsFound = (searchResults: SearchResult[]) => {
    // Filter by selected tags if any
    const filteredResults = selectedTags.length > 0
      ? searchResults.filter(result => 
          selectedTags.every(tag => result.document.tags.includes(tag))
        )
      : searchResults;
    
    setResults(filteredResults.slice(0, maxResults));
    props.onResultsFound?.(filteredResults);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <Card className="p-4">
      <DocumentSearch
        {...props}
        onResultsFound={handleResultsFound}
      />
      
      {showFilter && tags.length > 0 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {tags.map(tag => (
            <Button
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleTag(tag)}
              className="h-7 rounded-full"
            >
              {tag}
            </Button>
          ))}
        </div>
      )}
      
      {results.length > 0 && (
        <div className="mt-4 space-y-3">
          <h3 className="text-sm font-medium">Search Results</h3>
          {results.map(result => (
            <DocumentSearchResult key={result.document.id} result={result} />
          ))}
        </div>
      )}
    </Card>
  );
}

function DocumentSearchResult({ result }: { result: SearchResult }) {
  return (
    <div className="p-3 hover:bg-gray-50 rounded-md">
      <div className="font-medium">{result.document.title}</div>
      <div className="text-sm text-gray-500 line-clamp-2">
        {result.document.summary || result.document.content.slice(0, 120) + '...'}
      </div>
      <div className="text-xs text-gray-400 mt-1">
        Relevance: {Math.round(result.similarity * 100)}%
      </div>
    </div>
  );
} 