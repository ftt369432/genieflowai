import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { HardDrive, Upload, Search, FolderOpen, Tag, Filter } from 'lucide-react';
import type { AIDocument } from '../../types/ai';
import { cn } from '../../lib/utils';

export interface DocumentPickerProps {
  documents: AIDocument[];
  selectedDocs: AIDocument[];
  onSelect: (docs: AIDocument[]) => void;
  onUpload?: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onDriveSync?: () => Promise<void>;
  isSyncing?: boolean;
  categories?: string[];
  accept?: string;
  multiple?: boolean;
  className?: string;
}

export function DocumentPicker({
  documents,
  selectedDocs,
  onSelect,
  onUpload,
  onDriveSync,
  isSyncing,
  categories = [],
  accept,
  multiple = false,
  className
}: DocumentPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpload) {
      await onUpload(e);
      e.target.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0 && onUpload) {
      for (const file of files) {
        await onUpload(file);
      }
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesCategory = !selectedCategory || doc.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const isSelected = (doc: AIDocument) => selectedDocs.some(d => d.id === doc.id);

  const toggleDocument = (doc: AIDocument) => {
    if (isSelected(doc)) {
      onSelect(selectedDocs.filter(d => d.id !== doc.id));
    } else {
      onSelect([...selectedDocs, doc]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents..."
            className="pl-8"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {showFilters && categories.length > 0 && (
        <div className="flex items-center space-x-2 py-2 overflow-x-auto">
          <Button
            variant={selectedCategory === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('')}
          >
            All
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          onClick={() => document.getElementById('file-upload')?.click()}
          className="flex-1"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Documents
        </Button>
        {onDriveSync && (
          <Button
            variant="outline"
            onClick={onDriveSync}
            disabled={isSyncing}
            className="flex-1"
          >
            <HardDrive className={cn("w-4 h-4 mr-2", isSyncing && "animate-spin")} />
            {isSyncing ? 'Syncing...' : 'Sync Drive'}
          </Button>
        )}
      </div>
      <div className={cn("relative", className)}>
        <input
          id="file-upload"
          type="file"
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
          accept={accept}
        />
      </div>

      <div className="border rounded-lg divide-y">
        {filteredDocuments.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No documents found
          </div>
        ) : (
          filteredDocuments.map(doc => (
            <div
              key={doc.id}
              className={cn(
                'p-3 flex items-start space-x-3 cursor-pointer hover:bg-accent/50 transition-colors',
                isSelected(doc) && 'bg-primary/10'
              )}
              onClick={() => toggleDocument(doc)}
            >
              <div className="flex-shrink-0 mt-1">
                <FolderOpen className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium truncate">{doc.title}</h4>
                  {doc.category && (
                    <span className="text-xs bg-primary/10 px-2 py-0.5 rounded-full">
                      {doc.category}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(doc.updatedAt).toLocaleDateString()}
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex items-center mt-1 space-x-1">
                      <Tag className="w-3 h-3" />
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded-full bg-accent/50 text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 