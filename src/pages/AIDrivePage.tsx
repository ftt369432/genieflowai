import React, { useState } from 'react';
import { 
  FileText, 
  Folder, 
  Upload, 
  Search, 
  Grid, 
  List,
  Filter,
  SortAsc,
  Plus
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { cn } from '../lib/utils';

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  modified: Date;
  aiAnalysis?: {
    summary?: string;
    topics?: string[];
    sentiment?: 'positive' | 'neutral' | 'negative';
  };
}

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Project Proposal.pdf',
    type: 'pdf',
    size: '2.4 MB',
    modified: new Date('2024-02-20'),
    aiAnalysis: {
      summary: 'Project proposal for Q1 2024 initiatives',
      topics: ['strategy', 'planning', 'budget'],
      sentiment: 'positive'
    }
  },
  {
    id: '2',
    name: 'Meeting Notes.docx',
    type: 'docx',
    size: '156 KB',
    modified: new Date('2024-02-22'),
    aiAnalysis: {
      summary: 'Team sync meeting notes discussing project timeline',
      topics: ['meeting', 'timeline', 'tasks'],
      sentiment: 'neutral'
    }
  }
];

export function AIDrivePage() {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'modified' | 'size'>('modified');

  const handleUpload = () => {
    // TODO: Implement file upload
    console.log('Upload clicked');
  };

  const handleCreateFolder = () => {
    // TODO: Implement folder creation
    console.log('Create folder clicked');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Implement search functionality
  };

  const handleSort = (criteria: 'name' | 'modified' | 'size') => {
    setSortBy(criteria);
    // TODO: Implement sorting
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">AI Drive</h1>
        <div className="flex items-center gap-3">
          <Button onClick={handleUpload} className="gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </Button>
          <Button onClick={handleCreateFolder} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            New Folder
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select
          value={sortBy}
          onChange={(e) => handleSort(e.target.value as 'name' | 'modified' | 'size')}
          options={[
            { value: 'name', label: 'Name' },
            { value: 'modified', label: 'Last Modified' },
            { value: 'size', label: 'Size' }
          ]}
          className="w-40"
        />
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-r-none",
              viewMode === 'grid' && "bg-gray-100 dark:bg-gray-800"
            )}
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-l-none",
              viewMode === 'list' && "bg-gray-100 dark:bg-gray-800"
            )}
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {documents.map(doc => (
            <div
              key={doc.id}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary-500" />
                  <div>
                    <h3 className="font-medium">{doc.name}</h3>
                    <p className="text-sm text-gray-500">{doc.size}</p>
                  </div>
                </div>
              </div>
              {doc.aiAnalysis && (
                <div className="mt-4 text-sm">
                  <p className="text-gray-600 dark:text-gray-300">{doc.aiAnalysis.summary}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {doc.aiAnalysis.topics?.map(topic => (
                      <span
                        key={topic}
                        className="px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {documents.map(doc => (
            <div
              key={doc.id}
              className="py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 px-4 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <FileText className="h-5 w-5 text-primary-500" />
                <div>
                  <h3 className="font-medium">{doc.name}</h3>
                  {doc.aiAnalysis?.summary && (
                    <p className="text-sm text-gray-500 mt-1">{doc.aiAnalysis.summary}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span>{doc.size}</span>
                <span>{doc.modified.toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}