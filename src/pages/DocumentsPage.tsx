import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Tag, X } from 'lucide-react';
import DocumentCard, { Document } from '../components/documents/DocumentCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { DocumentUploader } from '../components/documents/DocumentUploader';
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '../components/ui/DropdownMenu';

// Mock data - in a real application, this would come from an API or state management
const MOCK_DOCUMENTS: Document[] = [
  {
    id: '1',
    name: 'Product Roadmap 2023.pdf',
    url: 'https://example.com/files/roadmap.pdf',
    fileType: 'pdf',
    size: 2500000,
    uploadedAt: new Date('2023-06-15'),
    description: 'Detailed product roadmap for 2023 with quarterly milestones and goals.',
    tags: ['Product', 'Planning', 'Strategy']
  },
  {
    id: '2',
    name: 'Quarterly Report Q2.xlsx',
    url: 'https://example.com/files/q2-report.xlsx',
    fileType: 'text',
    size: 1200000,
    uploadedAt: new Date('2023-07-05'),
    description: 'Financial and performance reports for Q2 2023.',
    tags: ['Finance', 'Quarterly', 'Reports']
  },
  {
    id: '3',
    name: 'Team Photo.jpg',
    url: 'https://example.com/files/team-photo.jpg',
    fileType: 'image',
    size: 3800000,
    uploadedAt: new Date('2023-08-12'),
    tags: ['Team', 'Photos']
  },
  {
    id: '4',
    name: 'API Documentation.pdf',
    url: 'https://example.com/files/api-docs.pdf',
    fileType: 'pdf',
    size: 1800000,
    uploadedAt: new Date('2023-08-20'),
    description: 'Complete API documentation with examples and tutorials.',
    tags: ['Technical', 'API', 'Development']
  },
  {
    id: '5',
    name: 'Meeting Notes.txt',
    url: 'https://example.com/files/meeting-notes.txt',
    fileType: 'text',
    size: 15000,
    uploadedAt: new Date('2023-09-01'),
    description: 'Notes from the strategy planning meeting.',
    content: 'Attendees: Alice, Bob, Charlie\n\nAgenda:\n1. Review Q2 Results\n2. Discuss Q3 Goals\n3. Plan Product Features\n\nKey Takeaways:\n- Revenue exceeded expectations by 15%\n- Customer retention improved to 92%\n- New feature development on track for October release',
    tags: ['Meeting', 'Notes', 'Planning']
  }
];

const DocumentsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<Document[]>(MOCK_DOCUMENTS);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Get all unique tags from documents
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    documents.forEach(doc => {
      doc.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [documents]);

  const handleDelete = (id: string) => {
    setDocuments(docs => docs.filter(doc => doc.id !== id));
  };

  const handleDownload = (doc: Document) => {
    // In a real app, this would trigger the actual download
    window.open(doc.url, '_blank');
  };

  const handleUpload = (newDocument: Document) => {
    setDocuments(prevDocuments => [newDocument, ...prevDocuments]);
  };
  
  const handleTagSelect = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };
  
  const clearTagFilters = () => {
    setSelectedTags([]);
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      // Text search filter
      const matchesSearch = 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Tag filter
      const matchesTags = 
        selectedTags.length === 0 || 
        (doc.tags && selectedTags.every(tag => doc.tags?.includes(tag)));
      
      return matchesSearch && matchesTags;
    });
  }, [documents, searchQuery, selectedTags]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Documents</h1>
        <Button onClick={() => setIsUploaderOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Upload New
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Search documents..." 
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
              {selectedTags.length > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {selectedTags.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-sm font-semibold">Filter by Tag</div>
            {allTags.map(tag => (
              <DropdownMenuCheckboxItem
                key={tag}
                checked={selectedTags.includes(tag)}
                onCheckedChange={() => handleTagSelect(tag)}
              >
                <Tag className="h-3.5 w-3.5 mr-2" />
                {tag}
              </DropdownMenuCheckboxItem>
            ))}
            {selectedTags.length > 0 && (
              <div className="p-2 border-t">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-xs" 
                  onClick={clearTagFilters}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Clear Filters
                </Button>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Active filters display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {selectedTags.map(tag => (
            <div 
              key={tag}
              className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full flex items-center"
            >
              <span>{tag}</span>
              <button 
                className="ml-1.5 hover:text-primary/70"
                onClick={() => handleTagSelect(tag)}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-6 px-2" 
            onClick={clearTagFilters}
          >
            Clear all
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredDocuments.map(doc => (
          <DocumentCard 
            key={doc.id} 
            document={doc} 
            onDelete={handleDelete}
            onDownload={handleDownload}
          />
        ))}

        {filteredDocuments.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No documents found. Try a different search or upload a new document.
          </div>
        )}
      </div>

      <DocumentUploader 
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  );
};

export default DocumentsPage; 