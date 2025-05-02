import React, { useState, useEffect } from 'react';
import { useKnowledgeBase } from '../hooks/useKnowledgeBase';
import { useAssistantStore } from '../hooks/useAssistantStore';
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
import type { Document, DocumentWithAnalytics, SearchOptions, Folder } from '../types/documents';
import type { AIDocument, SearchResult } from '../types/ai';
import type { AIAssistant } from '../types/assistants';

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
    
    // Filter by current folder if one is selected
    if (currentFolder) {
      docsToFilter = documents.filter(doc => 
        (doc as any).folderId === currentFolder.id
      );
    }
    
    // Apply search if present
    if (searchQuery) {
      docsToFilter = docsToFilter.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply tag filters
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
    
    // Find all assistants that have this folder linked
    const linkedAssistants = assistants.filter(assistant => {
      // Check in linkedFolders array (new format)
      if (assistant.linkedFolders && assistant.linkedFolders.includes(currentFolder.id)) {
        return true;
      }
      
      // Check in knowledgeBase array (legacy format)
      if (assistant.knowledgeBase && assistant.knowledgeBase.some(folder => folder.id === currentFolder.id)) {
        return true;
      }
      
      return false;
    });
    
    setLinkedAssistants(linkedAssistants);
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
          references: [] // Set empty references array as it doesn't exist in the analysis
        });
      }
    } catch (error) {
      console.error('Error analyzing document:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle folder creation
  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      try {
        // Create folder with optional parent folder
        const parentId = currentFolder ? currentFolder.id : null;
        const newFolder = await createFolder(newFolderName, parentId);
        setFolders(prev => [...prev, newFolder]);
        setNewFolderName('');
        setIsCreateFolderOpen(false);
        
        // Navigate to the new folder
        setCurrentFolder(newFolder);
      } catch (error) {
        console.error('Error creating folder:', error);
      }
    }
  };
  
  // Handle adding document to current folder
  const handleAddDocument = async (document: Document): Promise<boolean> => {
    try {
      // Convert Document to AIDocument format expected by addDocument
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
        // Add folder ID if a current folder is selected
        folderId: currentFolder ? currentFolder.id : undefined
      };
      
      await addDocument(aiDoc);
      return true;
    } catch (error) {
      console.error('Error adding document:', error);
      return false;
    }
  };
  
  // Get breadcrumb path for current folder
  const getBreadcrumbPath = () => {
    if (!currentFolder) {
      return [{ id: 'root', name: 'My Drive' }];
    }
    
    const path = [{ id: 'root', name: 'My Drive' }];
    let folder = currentFolder;
    
    // Add current folder
    path.push({ id: folder.id, name: folder.name });
    
    return path;
  };
  
  // Handle linking the current folder to an assistant
  const handleLinkToAssistant = (assistantId: string) => {
    if (!currentFolder) return;
    
    try {
      assignFolderToAssistant(assistantId, currentFolder.id);
      // Update the UI to show the linked assistant
      const assistant = getAssistantById(assistantId);
      if (assistant && !linkedAssistants.some(a => a.id === assistantId)) {
        setLinkedAssistants(prev => [...prev, assistant]);
      }
    } catch (error) {
      console.error('Error linking folder to assistant:', error);
    }
  };
  
  // Handle folder navigation
  const navigateToFolder = (folder: Folder | null) => {
    setCurrentFolder(folder);
    setSelectedDocument(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-2">AI Drive</h1>
        <p className="text-muted-foreground">Your intelligent document management system.</p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Folders and Tags */}
        <div className="w-64 border-r border-border p-4 overflow-y-auto">
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Libraries</h3>
            <div className="space-y-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start" 
                onClick={() => navigateToFolder(null)}
              >
                <FileText className="w-4 h-4 mr-2" />
                My Drive
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Star className="w-4 h-4 mr-2" />
                Starred
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Clock className="w-4 h-4 mr-2" />
                Recent
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Folders</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={() => setIsCreateFolderOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {folders.map(folder => (
                <Button 
                  key={folder.id}
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "w-full justify-start",
                    currentFolder?.id === folder.id && "bg-muted"
                  )}
                  onClick={() => navigateToFolder(folder)}
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  {folder.name}
                </Button>
              ))}
              
              {folders.length === 0 && (
                <p className="text-xs text-muted-foreground px-2">
                  No folders created yet
                </p>
              )}
            </div>
            
            <h3 className="font-medium text-sm">Tags</h3>
            <div className="space-y-1">
              {Array.from(new Set(documents.flatMap(doc => doc.tags || []))).map(tag => (
                <div key={tag} className="flex items-center">
                  <Checkbox 
                    id={`tag-${tag}`}
                    checked={selectedTags.includes(tag)}
                    onCheckedChange={() => {
                      if (selectedTags.includes(tag)) {
                        setSelectedTags(tags => tags.filter(t => t !== tag));
                      } else {
                        setSelectedTags(tags => [...tags, tag]);
                      }
                    }}
                  />
                  <Label htmlFor={`tag-${tag}`} className="ml-2 cursor-pointer text-sm">
                    {tag}
                  </Label>
                </div>
              ))}
              
              {documents.flatMap(doc => doc.tags || []).length === 0 && (
                <p className="text-xs text-muted-foreground px-2">
                  No tags found
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Breadcrumb and Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-sm">
              {getBreadcrumbPath().map((item, index, array) => (
                <React.Fragment key={item.id}>
                  <Button
                    variant="link"
                    className="p-1 h-auto text-muted-foreground hover:text-foreground"
                    onClick={() => navigateToFolder(item.id === 'root' ? null : folders.find(f => f.id === item.id) || null)}
                  >
                    {item.name}
                  </Button>
                  {index < array.length - 1 && (
                    <span className="text-muted-foreground">/</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              {currentFolder && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsAssistantLinkOpen(true)}
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Link to Assistant
                </Button>
              )}
              
              <Dialog open={isAssistantLinkOpen} onOpenChange={setIsAssistantLinkOpen}>
                <DialogContent>
                  <DialogTitle>Link Folder to Assistant</DialogTitle>
                  <DialogDescription>
                    Choose an assistant to link this folder to. Linked folders will be available as knowledge bases for the assistant.
                  </DialogDescription>
                  
                  <div className="max-h-60 overflow-y-auto border rounded-md">
                    {assistants.length > 0 ? (
                      <div className="space-y-2 p-2">
                        {assistants.map(assistant => (
                          <div 
                            key={assistant.id}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-md hover:bg-muted",
                              linkedAssistants.some(a => a.id === assistant.id) && "bg-muted/50"
                            )}
                          >
                            <div>
                              <div className="font-medium">{assistant.name}</div>
                              <div className="text-xs text-muted-foreground">{assistant.description}</div>
                            </div>
                            <Button
                              variant={linkedAssistants.some(a => a.id === assistant.id) ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleLinkToAssistant(assistant.id)}
                              disabled={linkedAssistants.some(a => a.id === assistant.id)}
                            >
                              {linkedAssistants.some(a => a.id === assistant.id) ? "Linked" : "Link"}
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        No assistants available. Create an assistant first.
                      </div>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAssistantLinkOpen(false)}>
                      Done
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                <DialogContent>
                  <DialogTitle>Create New Folder</DialogTitle>
                  <div className="py-4">
                    <Input
                      placeholder="Folder name"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateFolderOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateFolder}
                      disabled={!newFolderName.trim()}
                    >
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Search and View Controls */}
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
            <FileUpload onUpload={handleAddDocument} />
          </div>
          
          {/* Linked Assistants Badges */}
          {currentFolder && linkedAssistants.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Linked to:</span>
              <div className="flex flex-wrap gap-2">
                {linkedAssistants.map(assistant => (
                  <Badge key={assistant.id} variant="secondary">
                    <Brain className="w-3 h-3 mr-1" />
                    {assistant.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Document Grid/List */}
          {filteredDocuments.length > 0 ? (
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
                      {doc.tags && doc.tags.length > 0 && (
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
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                <FileText className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                {currentFolder 
                  ? `No files in folder "${currentFolder.name}"` 
                  : "No files found"
                }
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery 
                  ? "Try a different search term or clear filters"
                  : "Upload your first document to get started."
                }
              </p>
              <FileUpload onUpload={handleAddDocument} />
            </div>
          )}
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
                {selectedDocument.references?.length > 0 ? (
                  selectedDocument.references.map(ref => (
                    <Card key={ref.documentId} className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{ref.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(ref.relevance * 100)}% match
                        </span>
                      </div>
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No related documents found
                  </p>
                )}
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
                    {selectedDocument.insights?.readingTime || 0} min
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="text-sm text-muted-foreground">Sentiment</div>
                  <div className="text-lg font-medium">
                    {selectedDocument.insights?.sentiment || "neutral"}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
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