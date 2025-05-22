import React, { useState, useEffect } from 'react';
import { useKnowledgeBase } from '../hooks/useKnowledgeBase';
import { useAssistantStore } from '../store/assistantStore';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { FileUpload } from '../components/ai/FileUpload';
import { AIInsights } from '../components/drive/AIInsights';
import { Checkbox } from '../components/ui/Checkbox';
import { Label } from '../components/ui/Label';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/Dialog';
import { Badge } from '../components/ui/Badge';
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
  TrendingUp,
  FolderOpen,
  Plus
} from 'lucide-react';
import type { Document, DocumentWithAnalytics, SearchOptions } from '../types/documents';
import type { AIDocument, SearchResult, Folder, AIAssistant } from '../types/ai';

// Helper function to convert AIDocument to Document type
const convertAIDocumentToDocument = (aiDoc: AIDocument): Document => {
  return {
    id: aiDoc.id,
    name: aiDoc.metadata?.title || 'Untitled Document',
    type: 'txt' as any, // Cast to any to avoid type error
    content: aiDoc.content,
    tags: aiDoc.metadata?.tags || [],
    createdAt: new Date(aiDoc.metadata?.date || new Date()),
    updatedAt: new Date(),
    size: 0, // Default size since it's not in AIDocument metadata
    metadata: {
      author: aiDoc.metadata?.author,
      lastModified: new Date()
    }
  };
};

// Main GenieDrive Page component
export function AIDrivePage() {
  const { documents: aiDocuments, addDocument, analyzeDocument, searchDocuments, createFolder, getDocumentsByFolder, getAllFolders } = useKnowledgeBase({
    enableDriveSync: true,
    autoIndex: true
  });
  
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithAnalytics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isAssistantLinkOpen, setIsAssistantLinkOpen] = useState(false);
  const [linkedAssistants, setLinkedAssistants] = useState<AIAssistant[]>([]);
  
  // Get assistants store
  const { assistants, getAssistantById, assignFolderToAssistant } = useAssistantStore();

  // Convert AIDocuments to Documents
  const documents = React.useMemo(() => {
    return aiDocuments.map(convertAIDocumentToDocument);
  }, [aiDocuments]);

  // Load folders and update filtered documents when necessary
  useEffect(() => {
    const loadFolders = async () => {
      const allFolders = getAllFolders();
      setFolders(allFolders);
    };
    
    loadFolders();
  }, [getAllFolders]);
  
  // Update filtered documents when documents, filters, or current folder changes
  useEffect(() => {
    let docsToFilter = documents;
    
    if (currentFolder) {
      docsToFilter = documents.filter(doc => 
        (doc as any).folderId === currentFolder.id
      );
    }
    
    if (searchQuery) {
      docsToFilter = docsToFilter.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedTags.length > 0) {
      docsToFilter = docsToFilter.filter(doc => 
        selectedTags.some(tag => doc.tags?.includes(tag))
      );
    }
    
    setFilteredDocuments(docsToFilter);
  }, [documents, selectedTags, searchQuery, currentFolder]);
  
  // Find assistants linked to the current folder
  useEffect(() => {
    if (!currentFolder) {
      setLinkedAssistants([]);
      return;
    }
    
    const currentLinkedAssistants = assistants.filter(assistant => {
      if (assistant.linkedFolders && assistant.linkedFolders.includes(currentFolder.id)) {
        return true;
      }
      if (assistant.knowledgeBase && assistant.knowledgeBase.some(folder => folder.id === currentFolder.id)) {
        return true;
      }
      return false;
    });
    
    setLinkedAssistants(currentLinkedAssistants);
  }, [currentFolder, assistants]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
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
          references: [] 
        });
      }
    } catch (error) {
      console.error('Error analyzing document:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      try {
        const parentId = currentFolder ? currentFolder.id : null;
        const newFolder = await createFolder(newFolderName, parentId);
        setFolders(prev => [...prev, newFolder]);
        setNewFolderName('');
        setIsCreateFolderOpen(false);
        setCurrentFolder(newFolder);
      } catch (error) {
        console.error('Error creating folder:', error);
      }
    }
  };
  
  const handleAddDocument = async (document: Document): Promise<boolean> => {
    try {
      const aiDoc: AIDocument = {
        id: document.id,
        content: document.content,
        metadata: {
          source: 'upload',
          title: document.name,
          author: document.metadata?.author,
          tags: document.tags,
          date: document.createdAt
        },
        folderId: currentFolder ? currentFolder.id : undefined
      };
      
      await addDocument(aiDoc);
      return true;
    } catch (error) {
      console.error('Error adding document:', error);
      return false;
    }
  };
  
  const getBreadcrumbPath = () => {
    if (!currentFolder) {
      return [{ id: 'root', name: 'My Drive' }];
    }
    const path = [{ id: 'root', name: 'My Drive' }];
    let folder: Folder | null = currentFolder;
    path.push({ id: folder.id, name: folder.name });
    return path;
  };
  
  const handleLinkToAssistant = (assistantId: string) => {
    if (!currentFolder) return;
    try {
      assignFolderToAssistant(assistantId, currentFolder.id);
      const assistant = getAssistantById(assistantId);
      if (assistant && !linkedAssistants.some(a => a.id === assistantId)) {
        setLinkedAssistants(prev => [...prev, assistant]);
      }
    } catch (error) {
      console.error('Error linking folder to assistant:', error);
    }
  };
  
  const navigateToFolder = (folder: Folder | null) => {
    setCurrentFolder(folder);
    setSelectedDocument(null); 
  };

  return <div>AIDrive Page Test</div>;

  /*
// ... (The original JSX return statement should remain commented out here)
  */
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
        <p className="text-xs text-gray-400 mt-1">{formatFileSize(document.size || 0)}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-1">
        {document.tags && document.tags.map(tag => (
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
          <p className="text-xs text-gray-400">{formatFileSize(document.size || 0)} • {document.type}</p>
        </div>
      </div>
      <Button variant="ghost" size="sm">
        <Star className="h-4 w-4" />
      </Button>
    </div>
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