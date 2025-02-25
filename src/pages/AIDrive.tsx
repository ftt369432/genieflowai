import React, { useState } from 'react';
import { useKnowledgeBase } from '../hooks/useKnowledgeBase';
import { KnowledgeBasePanel } from '../components/ai/KnowledgeBasePanel';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { FileUpload } from '../components/ai/FileUpload';
import { 
  FileText, 
  Search, 
  Grid, 
  List, 
  Upload,
  Star,
  Clock,
  Tag,
  Filter
} from 'lucide-react';
import type { Document } from '../types/documents';

export function AIDrivePage() {
  const { documents, addDocument } = useKnowledgeBase();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    // Implement search logic
  };

  const filteredDocuments = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedTags.length === 0 || doc.tags.some(tag => selectedTags.includes(tag)))
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyberpunk-dark to-cyberpunk-darker p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-cyberpunk-neon animate-glow" />
            <h1 className="text-3xl font-bold text-white">
              AI Drive
              <span className="ml-2 text-cyberpunk-neon">v2.0</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </Button>
            <div className="flex border border-cyberpunk-neon/30 rounded-lg overflow-hidden">
              <Button
                variant={view === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={view === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Document List */}
          <div className="col-span-9">
            {view === 'grid' ? (
              <div className="grid grid-cols-3 gap-4">
                {filteredDocuments.map(doc => (
                  <DocumentCard key={doc.id} document={doc} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDocuments.map(doc => (
                  <DocumentListItem key={doc.id} document={doc} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="col-span-3 space-y-6">
            {/* Quick Access */}
            <Card className="bg-cyberpunk-dark/50 border-cyberpunk-neon/30 p-4">
              <h3 className="text-sm font-medium text-cyberpunk-neon mb-4">Quick Access</h3>
              <div className="space-y-2">
                <QuickAccessItem
                  icon={<Star className="h-4 w-4" />}
                  label="Favorites"
                  count={5}
                />
                <QuickAccessItem
                  icon={<Clock className="h-4 w-4" />}
                  label="Recent"
                  count={12}
                />
                <QuickAccessItem
                  icon={<Tag className="h-4 w-4" />}
                  label="Tags"
                  count={8}
                />
              </div>
            </Card>

            {/* Knowledge Base */}
            <Card className="bg-cyberpunk-dark/50 border-cyberpunk-neon/30">
              <KnowledgeBasePanel />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentCard({ document }: { document: Document }) {
  return (
    <Card className="bg-cyberpunk-dark/50 border-cyberpunk-neon/30 p-4 hover:border-cyberpunk-neon transition-colors">
      <div className="flex items-start justify-between">
        <FileText className="h-8 w-8 text-cyberpunk-neon" />
        <Button variant="ghost" size="sm">
          <Star className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-4">
        <h3 className="font-medium text-white">{document.name}</h3>
        <p className="text-xs text-gray-400 mt-1">{formatFileSize(document.size)}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-1">
        {document.tags.map(tag => (
          <span key={tag} className="px-2 py-1 text-xs rounded-full bg-cyberpunk-neon/10 text-cyberpunk-neon">
            {tag}
          </span>
        ))}
      </div>
    </Card>
  );
}

function DocumentListItem({ document }: { document: Document }) {
  return (
    <div className="flex items-center justify-between p-3 bg-cyberpunk-dark/50 border border-cyberpunk-neon/30 rounded-lg hover:border-cyberpunk-neon transition-colors">
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-cyberpunk-neon" />
        <div>
          <h3 className="font-medium text-white">{document.name}</h3>
          <p className="text-xs text-gray-400">{formatFileSize(document.size)} • {document.type}</p>
        </div>
      </div>
      <Button variant="ghost" size="sm">
        <Star className="h-4 w-4" />
      </Button>
    </div>
  );
}

function QuickAccessItem({ 
  icon, 
  label, 
  count 
}: { 
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-cyberpunk-neon/10 transition-colors">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-white">{label}</span>
      </div>
      <span className="text-xs text-cyberpunk-neon">{count}</span>
    </button>
  );
}

function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
} 