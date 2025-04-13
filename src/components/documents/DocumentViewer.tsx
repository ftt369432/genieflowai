import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Download, X, Tag } from 'lucide-react';
import { Document } from './DocumentCard';
import { format } from 'date-fns';

interface DocumentViewerProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentViewer({ document, isOpen, onClose }: DocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!document) return null;

  const renderDocumentContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }

    switch (document.fileType) {
      case 'pdf':
        return (
          <iframe 
            src={document.url} 
            className="w-full h-[60vh]" 
            title={document.name}
          />
        );
      case 'image':
        return (
          <div className="flex justify-center">
            <img 
              src={document.url} 
              alt={document.name} 
              className="max-h-[60vh] object-contain"
            />
          </div>
        );
      case 'text':
        return (
          <div className="border rounded-md p-4 h-[60vh] overflow-auto">
            <pre className="whitespace-pre-wrap">{document.content}</pre>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <p className="text-muted-foreground mb-4">Preview not available for this file type</p>
            <Button onClick={() => window.open(document.url, '_blank')}>
              Open in new tab
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="truncate">{document.name}</span>
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            Uploaded {format(new Date(document.uploadedAt), 'PPP')} • {document.size}
          </div>
          {document.description && (
            <p className="text-sm mt-2">{document.description}</p>
          )}
          
          {document.tags && document.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {document.tags.map(tag => (
                <div 
                  key={tag} 
                  className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full flex items-center"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </div>
              ))}
            </div>
          )}
        </DialogHeader>
        
        <div className="mt-4">
          {renderDocumentContent()}
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
          <Button onClick={() => window.open(document.url, '_blank')}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 