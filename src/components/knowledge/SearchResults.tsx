import React from 'react';
import { SearchResult } from '../../types/ai';
import { DocumentCard } from './DocumentCard';

interface SearchResultsProps {
  results: SearchResult[];
}

export function SearchResults({ results }: SearchResultsProps) {
  return (
    <div className="space-y-4">
      {results.map(({ document, similarity }) => (
        <div key={document.id} className="relative">
          <div className="absolute -left-4 top-4 text-xs text-gray-500">
            {Math.round(similarity * 100)}%
          </div>
          <DocumentCard document={document} />
        </div>
      ))}
    </div>
  );
} 