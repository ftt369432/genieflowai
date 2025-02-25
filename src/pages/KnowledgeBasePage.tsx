import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Search, Tag, FileText, X } from 'lucide-react';
import { useKnowledgeBaseStore } from '../store/knowledgeBaseStore';
import { searchDocuments } from '../services/embeddingService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { DocumentCard } from '../components/knowledge/DocumentCard';
import { DocumentUploader } from '../components/knowledge/DocumentUploader';
import { TagSelector } from '../components/knowledge/TagSelector';
import { SearchResults } from '../components/knowledge/SearchResults';
import { FolderTree } from '../components/knowledge/FolderTree';
import { FolderActions } from '../components/knowledge/FolderActions';
import { useDebounce } from '../hooks/useDebounce';
import type { SearchResult } from '../types/ai';
import { DragContext } from '../components/knowledge/DragContext';
import { DraggableDocumentCard } from '../components/knowledge/DraggableDocumentCard';
import { SelectionProvider, useSelection } from '../components/knowledge/SelectionContext';
import { DocumentChat } from '../components/knowledge/DocumentChat';

export function KnowledgeBasePage() {
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showUploader, setShowUploader] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const { documents, tags } = useKnowledgeBaseStore();
  const debouncedSearch = useDebounce(search);
  const { clearSelection } = useSelection();
  const [showChat, setShowChat] = useState(false);
  const [chatDocument, setChatDocument] = useState<SearchResult | null>(null);

  useEffect(() => {
    if (debouncedSearch) {
      setIsSearching(true);
      handleSearch(debouncedSearch).finally(() => setIsSearching(false));
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch, handleSearch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearSelection]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    const filteredDocs = selectedTags.length > 0
      ? documents.filter(doc => 
          selectedTags.every(tag => doc.tags.includes(tag))
        )
      : documents;
    
    const results = await searchDocuments(query, filteredDocs);
    setSearchResults(results);
  }, [documents, selectedTags]);

  const filteredDocuments = documents.filter(doc => {
    const matchesFolder = selectedFolderId === null || doc.folderId === selectedFolderId;
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every(tag => doc.tags.includes(tag));
    return matchesFolder && matchesTags;
  });

  return (
    <DragContext>
      <SelectionProvider>
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Knowledge Base</h1>
            <Button onClick={() => setShowUploader(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          </div>

          <div className="flex gap-4">
            <div className="w-64 space-y-4">
              <FolderActions currentFolderId={selectedFolderId} />
              <FolderTree
                selectedFolderId={selectedFolderId}
                onSelectFolder={setSelectedFolderId}
              />

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    if (!e.target.value) setSearchResults([]);
                  }}
                  placeholder="Search documents..."
                  className="pl-10"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent" />
                  </div>
                )}
              </div>
              
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <Tag className="h-4 w-4" />
                  Tags
                </div>
                <TagSelector
                  tags={tags}
                  selectedTags={selectedTags}
                  onTagSelect={(tag) => {
                    setSelectedTags(prev =>
                      prev.includes(tag)
                        ? prev.filter(t => t !== tag)
                        : [...prev, tag]
                    );
                  }}
                />
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <FileText className="h-4 w-4" />
                  Statistics
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <p>Total Documents: {documents.length}</p>
                  <p>Total Tags: {tags.length}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {search ? (
                <SearchResults results={searchResults} />
              ) : (
                filteredDocuments.map((doc) => (
                  <DraggableDocumentCard 
                    key={doc.id} 
                    document={doc}
                    onChat={() => {
                      setChatDocument({ document: doc, similarity: 1 });
                      setShowChat(true);
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {showChat && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-white rounded-lg w-[800px] h-[600px] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                  <h2 className="font-medium">Chat with Documents</h2>
                  <Button variant="ghost" onClick={() => setShowChat(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1">
                  <DocumentChat 
                    initialDocuments={chatDocument ? [chatDocument] : undefined}
                  />
                </div>
              </div>
            </div>
          )}

          {showUploader && (
            <DocumentUploader
              currentFolderId={selectedFolderId}
              onClose={() => setShowUploader(false)}
            />
          )}
        </div>
      </SelectionProvider>
    </DragContext>
  );
} 