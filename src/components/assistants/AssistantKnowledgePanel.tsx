import React, { useState, useEffect } from 'react';
import { Book, FileText, Upload, Search, FolderPlus, Folder, ChevronDown, ChevronRight, Eye, Tag as TagIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/Collapsible';
import { Badge } from '../ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { useAssistantStore } from '../../store/assistantStore';
import { DocumentViewer } from '../knowledge/DocumentViewer';
import { DocumentUploader } from '../knowledge/DocumentUploader';
import { KnowledgeBaseSelector } from './KnowledgeBaseSelector';
import { PDFViewer } from '../knowledge/PDFViewer';
import { Icons } from '../ui/icons';
import type { AIAssistant, AIDocument } from '../../types/ai';

interface AssistantKnowledgePanelProps {
  assistant: AIAssistant;
  isEditing?: boolean;
  onUpdateFolders?: (folderIds: string[]) => void;
}

export function AssistantKnowledgePanel({ 
  assistant, 
  isEditing = false,
  onUpdateFolders,
}: AssistantKnowledgePanelProps) {
  const { folders, documents, removeDocument } = useKnowledgeBaseStore();
  const { getAssistantFolders } = useAssistantStore();
  
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [selectedDocument, setSelectedDocument] = useState<AIDocument | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Load assistant's folders when the component mounts
  useEffect(() => {
    const folderIds = getAssistantFolders(assistant.id);
    setSelectedFolderIds(folderIds);
    
    // Expand all folders by default
    const expanded: Record<string, boolean> = {};
    folderIds.forEach(id => {
      expanded[id] = true;
    });
    setExpandedFolders(expanded);
  }, [assistant.id, getAssistantFolders]);
  
  // Update parent component when folders change
  useEffect(() => {
    if (onUpdateFolders && isEditing) {
      onUpdateFolders(selectedFolderIds);
    }
  }, [selectedFolderIds, onUpdateFolders, isEditing]);
  
  // Filter documents by search term
  const filteredDocuments = documents.filter(doc => {
    // Check if the document belongs to one of the assistant's folders
    const inFolder = selectedFolderIds.includes(doc.folderId || '');
    
    // Check if the document matches the search term
    const matchesSearch = !searchTerm || 
      doc.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.metadata?.title && doc.metadata.title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return inFolder && matchesSearch;
  });
  
  // Group documents by folder
  const documentsByFolder = filteredDocuments.reduce((acc, doc) => {
    const folderId = doc.folderId || 'unassigned';
    if (!acc[folderId]) {
      acc[folderId] = [];
    }
    acc[folderId].push(doc);
    return acc;
  }, {} as Record<string, AIDocument[]>);
  
  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    setExpandedFolders({
      ...expandedFolders,
      [folderId]: !expandedFolders[folderId]
    });
  };
  
  // Get folder name by ID
  const getFolderName = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    return folder ? folder.name : 'Unassigned';
  };
  
  // Handle document deletion
  const handleDeleteDocument = (documentId: string) => {
    removeDocument(documentId);
  };
  
  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term) {
      setIsSearching(true);
      // Expand all folders when searching
      const expanded: Record<string, boolean> = {};
      selectedFolderIds.forEach(id => {
        expanded[id] = true;
      });
      setExpandedFolders(expanded);
    } else {
      setIsSearching(false);
    }
  };
  
  // Determine if a document is searchable
  const isSearchable = (doc: AIDocument) => {
    return doc.content && !doc.url?.endsWith('.pdf');
  };
  
  // Format file size
  const formatFileSize = (size?: number) => {
    if (!size) return 'Unknown';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  // Format date
  const formatDate = (date?: Date | string) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString();
  };
  
  // Get document type
  const getDocumentType = (doc: AIDocument) => {
    if (doc.url?.endsWith('.pdf')) return 'PDF';
    if (doc.url?.endsWith('.docx')) return 'Word';
    if (doc.url?.endsWith('.xlsx')) return 'Excel';
    if (doc.url?.endsWith('.pptx')) return 'PowerPoint';
    if (doc.url?.endsWith('.jpg') || doc.url?.endsWith('.png')) return 'Image';
    return 'Text';
  };
  
  return (
    <div className="space-y-4">
      {isEditing ? (
        <KnowledgeBaseSelector
          selectedFolderIds={selectedFolderIds}
          onSelectFolder={setSelectedFolderIds}
          assistantId={assistant.id}
        />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Book className="h-5 w-5" />
              Knowledge Base
            </h3>
            
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={handleSearch}
                  placeholder="Search documents..."
                  className="pl-8 h-8 w-48"
                />
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentFolderId(selectedFolderIds[0] || null);
                  setShowUploader(true);
                }}
                disabled={selectedFolderIds.length === 0}
                className="flex items-center gap-1"
              >
                <Upload className="h-4 w-4" />
                <span>Upload</span>
              </Button>
            </div>
          </div>
          
          <Card>
            <CardContent className="p-4">
              {selectedFolderIds.length === 0 ? (
                <div className="text-center p-8">
                  <Book className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">This assistant has no knowledge base folders assigned.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {isSearching ? (
                    // Search results view - flat list
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground mb-2">
                        Search results: {filteredDocuments.length} document(s)
                      </p>
                      
                      {filteredDocuments.length > 0 ? (
                        filteredDocuments.map(doc => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                            onClick={() => setSelectedDocument(doc)}
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-500" />
                              <div>
                                <span className="font-medium">
                                  {doc.metadata?.title || doc.id.substring(0, 8)}
                                </span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  in {getFolderName(doc.folderId || '')}
                                </span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-center p-4">No documents match your search.</p>
                      )}
                    </div>
                  ) : (
                    // Folder view - grouped by folder
                    Object.entries(documentsByFolder).map(([folderId, docs]) => (
                      <Collapsible
                        key={folderId}
                        open={expandedFolders[folderId]}
                        className="border rounded-md"
                      >
                        <CollapsibleTrigger
                          className="flex items-center justify-between w-full p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() => toggleFolder(folderId)}
                        >
                          <div className="flex items-center gap-2">
                            <Folder className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">{getFolderName(folderId)}</span>
                            <Badge variant="outline" className="ml-2">
                              {docs.length} document{docs.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          {expandedFolders[folderId] ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent className="p-2 border-t">
                          <div className="space-y-1">
                            {docs.map(doc => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                                onClick={() => setSelectedDocument(doc)}
                              >
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-blue-500" />
                                  <div>
                                    <span>{doc.metadata?.title || doc.id.substring(0, 8)}</span>
                                    {doc.tags && doc.tags.length > 0 && (
                                      <div className="flex items-center mt-1">
                                        <TagIcon className="h-3 w-3 text-gray-400 mr-1" />
                                        <div className="flex gap-1">
                                          {doc.tags.slice(0, 3).map(tag => (
                                            <Badge key={tag} variant="secondary" className="text-xs py-0">
                                              {tag}
                                            </Badge>
                                          ))}
                                          {doc.tags.length > 3 && (
                                            <span className="text-xs text-muted-foreground">
                                              +{doc.tags.length - 3} more
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <span className="mr-2">{getDocumentType(doc)}</span>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            
                            {docs.length === 0 && (
                              <p className="text-sm text-center p-4 text-muted-foreground">
                                No documents in this folder.
                              </p>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
      
      {/* Document Viewer Dialog */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onDelete={handleDeleteDocument}
        />
      )}
      
      {/* Document Uploader */}
      {showUploader && (
        <DocumentUploader
          currentFolderId={currentFolderId}
          onClose={() => setShowUploader(false)}
        />
      )}
    </div>
  );
} 