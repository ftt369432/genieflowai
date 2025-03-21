import React, { useState, useEffect } from 'react';
import { useKnowledgeBase } from '../hooks/useKnowledgeBase';
import { KnowledgeBasePanel } from '../components/ai/KnowledgeBasePanel';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { FileUpload } from '../components/ai/FileUpload';
import { AIInsights } from '../components/drive/AIInsights';
import { cn } from '../lib/utils';
import { 
  FileText, 
  Search, 
  Grid, 
  List, 
  Upload,
  Star,
  Clock,
  Tag,
  Filter,
  Brain,
  MessageSquare,
  TrendingUp
} from 'lucide-react';
import type { Document, DocumentWithAnalytics, SearchOptions } from '../types/documents';
import type { AIDocument, SearchResult } from '../types/ai';

// Helper function to convert AIDocument to Document type
const convertAIDocumentToDocument = (aiDoc: AIDocument): Document => {
  return {
    id: aiDoc.id,
    name: aiDoc.title,
    type: 'txt', // Default type
    content: aiDoc.content,
    tags: aiDoc.metadata.tags || [],
    createdAt: new Date(aiDoc.metadata.dateCreated),
    updatedAt: new Date(aiDoc.metadata.dateModified),
    size: aiDoc.metadata.size || 0,
    metadata: {
      author: aiDoc.metadata.author,
      lastModified: new Date(aiDoc.metadata.dateModified),
    }
  };
};

export function AIDrivePage() {
  const { documents: aiDocuments, addDocument, analyzeDocument, searchDocuments } = useKnowledgeBase();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithAnalytics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);

  // Convert AIDocuments to Documents
  const documents = React.useMemo(() => {
    return aiDocuments.map(convertAIDocumentToDocument);
  }, [aiDocuments]);

  // Update filtered documents when documents or filters change
  useEffect(() => {
    if (!searchQuery) {
      const filtered = documents.filter(doc => 
        selectedTags.length === 0 || doc.tags.some(tag => selectedTags.includes(tag))
      );
      setFilteredDocuments(filtered);
    }
  }, [documents, selectedTags, searchQuery]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredDocuments(documents);
      return;
    }

    const options: SearchOptions = {
      filters: {
        tags: selectedTags,
      },
      sort: {
        field: 'updatedAt',
        order: 'desc'
      }
    };

    const results = await searchDocuments(query, options);
    // Convert search results to Document type
    const documentResults = results.map((result: any) => {
      // Handle different result formats (could be SearchResult or result with document property)
      const aiDoc = result.document || result;
      return convertAIDocumentToDocument(aiDoc);
    });
    setFilteredDocuments(documentResults);
  };

  const handleDocumentSelect = async (doc: Document) => {
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeDocument(doc.id);
      if (analysis) {
        setSelectedDocument({
          ...doc,
          insights: {
            keyPoints: analysis.keyPoints || [],
            topics: analysis.topics || [],
            sentiment: analysis.sentiment || 'neutral',
            entities: analysis.entities || [],
            readingTime: analysis.readingTime || 0,
            relevance: analysis.relevance || 0
          },
          references: [] // Set empty references array as it doesn't exist in the analysis
        });
      }
    } catch (error) {
      console.error('Error analyzing document:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={() => setView(view === 'grid' ? 'list' : 'grid')}>
            {view === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </Button>
          <FileUpload onUpload={addDocument} />
        </div>

        {/* Document Grid/List */}
        <div className={cn(
          "grid gap-4",
          view === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {filteredDocuments.map((doc) => (
            <Card
              key={doc.id}
              className={cn(
                "cursor-pointer hover:border-primary transition-colors",
                selectedDocument?.id === doc.id && "border-primary"
              )}
              onClick={() => handleDocumentSelect(doc)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary" />
                    <div>
                      <h3 className="font-medium">{doc.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {doc.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {doc.tags.length > 0 && (
                    <div className="flex gap-1">
                      {doc.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Document Analysis Sidebar */}
      {selectedDocument && (
        <div className="w-96 border-l border-border bg-card/50 p-6 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Document Analysis</h2>
            {isAnalyzing && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Brain className="w-4 h-4 animate-pulse" />
                Analyzing...
              </div>
            )}
          </div>

          <AIInsights document={selectedDocument} />

          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Related Documents
            </h3>
            <div className="space-y-2">
              {selectedDocument.references.map(ref => (
                <Card key={ref.documentId} className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{ref.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(ref.relevance * 100)}% match
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analytics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-3">
                <div className="text-sm text-muted-foreground">Reading Time</div>
                <div className="text-lg font-medium">
                  {selectedDocument.insights.readingTime} min
                </div>
              </Card>
              <Card className="p-3">
                <div className="text-sm text-muted-foreground">Sentiment</div>
                <div className="text-lg font-medium">
                  {selectedDocument.insights.sentiment}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
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