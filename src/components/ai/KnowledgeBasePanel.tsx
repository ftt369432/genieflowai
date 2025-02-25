import React from 'react';
import { useKnowledgeBase } from '../../hooks/useKnowledgeBase';
import { Button } from '../ui/Button';
import { FileText, Star, Clock, Plus } from 'lucide-react';

interface DocumentSuggestion {
  id: string;
  title: string;
  relevance: number;
  lastAccessed?: Date;
}

export function KnowledgeBasePanel() {
  const { documents } = useKnowledgeBase();

  const recentDocuments = documents
    .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
    .slice(0, 3);

  const suggestedDocuments: DocumentSuggestion[] = [
    {
      id: '1',
      title: 'Project Requirements',
      relevance: 0.95,
      lastAccessed: new Date()
    },
    {
      id: '2',
      title: 'API Documentation',
      relevance: 0.85,
      lastAccessed: new Date()
    },
    {
      id: '3',
      title: 'Meeting Notes',
      relevance: 0.75,
      lastAccessed: new Date()
    }
  ];

  return (
    <div className="space-y-6">
      {/* Recent Documents */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-cyberpunk-neon">Recent Documents</h4>
          <Button variant="ghost" size="sm">
            <Clock className="h-4 w-4 mr-1" /> View All
          </Button>
        </div>
        <div className="space-y-2">
          {recentDocuments.map(doc => (
            <DocumentItem
              key={doc.id}
              title={doc.name}
              type={doc.type}
              date={doc.lastModified}
            />
          ))}
        </div>
      </div>

      {/* Suggested Context */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-cyberpunk-neon">Suggested Context</h4>
          <Button variant="ghost" size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add More
          </Button>
        </div>
        <div className="space-y-2">
          {suggestedDocuments.map(doc => (
            <SuggestedItem
              key={doc.id}
              title={doc.title}
              relevance={doc.relevance}
              lastAccessed={doc.lastAccessed}
            />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="pt-4 border-t border-cyberpunk-neon/20">
        <Button variant="outline" className="w-full justify-start">
          <Star className="h-4 w-4 mr-2" />
          Save Current Context
        </Button>
      </div>
    </div>
  );
}

function DocumentItem({ 
  title, 
  type, 
  date 
}: { 
  title: string; 
  type: string;
  date: Date;
}) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-cyberpunk-neon/10 transition-colors cursor-pointer">
      <FileText className="h-5 w-5 text-cyberpunk-neon" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white truncate">{title}</div>
        <div className="text-xs text-gray-400">
          {type} • {date.toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

function SuggestedItem({ 
  title, 
  relevance, 
  lastAccessed 
}: { 
  title: string;
  relevance: number;
  lastAccessed?: Date;
}) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-cyberpunk-neon/10 transition-colors cursor-pointer">
      <div className="relative">
        <FileText className="h-5 w-5 text-cyberpunk-neon" />
        <div 
          className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-400"
          style={{ opacity: relevance }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white truncate">{title}</div>
        <div className="text-xs text-gray-400">
          {Math.round(relevance * 100)}% relevant
          {lastAccessed && ` • Last accessed ${lastAccessed.toLocaleDateString()}`}
        </div>
      </div>
    </div>
  );
} 