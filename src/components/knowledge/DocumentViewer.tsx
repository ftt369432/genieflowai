import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { FileText, Download, Trash2, X, Clock, Tag as TagIcon, Calendar, HardDrive, Link } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { PDFViewer } from './PDFViewer';
import { AIDocument } from '../../types/ai';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';

interface DocumentViewerProps {
  document: AIDocument;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export function DocumentViewer({ document, onClose, onDelete }: DocumentViewerProps) {
  const [activeTab, setActiveTab] = useState<string>('preview');
  
  const isPDF = document.url?.endsWith('.pdf');
  const isImage = document.url?.endsWith('.jpg') || document.url?.endsWith('.png') || document.url?.endsWith('.jpeg');
  
  // Format date
  const formatDate = (date?: Date | string) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString();
  };
  
  // Format file size
  const formatFileSize = (size?: number) => {
    if (!size) return 'Unknown';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  // Handle document deletion with confirmation
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      onDelete?.(document.id);
      onClose();
    }
  };
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            <DialogTitle className="text-xl">
              {document.metadata?.title || document.id.substring(0, 8)}
            </DialogTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        {/* Document Metadata */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
          {document.createdAt && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Created: {formatDate(document.createdAt)}</span>
            </div>
          )}
          
          {document.updatedAt && document.updatedAt !== document.createdAt && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Updated: {formatDate(document.updatedAt)}</span>
            </div>
          )}
          
          {document.metadata?.fileSize && (
            <div className="flex items-center gap-1">
              <HardDrive className="h-4 w-4" />
              <span>Size: {formatFileSize(document.metadata.fileSize)}</span>
            </div>
          )}
          
          {document.url && (
            <div className="flex items-center gap-1">
              <Link className="h-4 w-4" />
              <a 
                href={document.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Source
              </a>
            </div>
          )}
        </div>
        
        {/* Tags */}
        {document.tags && document.tags.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <TagIcon className="h-4 w-4 text-gray-400" />
            <div className="flex flex-wrap gap-1">
              {document.tags.map(tag => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Tabs for different view modes */}
        <Tabs defaultValue="preview" className="flex-1 flex flex-col overflow-hidden" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-2">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="text">Text Content</TabsTrigger>
            {document.metadata && (
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="preview" className="flex-1 overflow-auto">
            {isPDF ? (
              <PDFViewer url={document.url || ''} title={document.metadata?.title || 'Document'} />
            ) : isImage ? (
              <div className="flex items-center justify-center h-full">
                <img 
                  src={document.url} 
                  alt={document.metadata?.title || 'Document'} 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div className="p-4 border rounded bg-gray-50 dark:bg-gray-900 whitespace-pre-wrap h-full overflow-auto">
                {document.content}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="text" className="flex-1 overflow-auto">
            <div className="p-4 border rounded bg-gray-50 dark:bg-gray-900 whitespace-pre-wrap h-full overflow-auto font-mono text-sm">
              {document.content || 'No text content available for this document type.'}
            </div>
          </TabsContent>
          
          <TabsContent value="metadata" className="flex-1 overflow-auto">
            <div className="p-4 border rounded bg-gray-50 dark:bg-gray-900 h-full overflow-auto">
              <h3 className="font-medium mb-2">Document Metadata</h3>
              {document.metadata ? (
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {JSON.stringify(document.metadata, null, 2)}
                </pre>
              ) : (
                <p className="text-muted-foreground">No metadata available.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex justify-between mt-4">
          <div>
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={handleDelete} className="flex items-center gap-1">
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {document.url && (
              <Button variant="outline" size="sm" className="flex items-center gap-1" asChild>
                <a href={document.url} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </a>
              </Button>
            )}
            
            <Button variant="default" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 