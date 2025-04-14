import React, { useState } from 'react';
import { PlusCircle, FileUp, Book, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { SimpleDocumentUploader } from './SimpleDocumentUploader';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { Card } from '../ui/Card';

/**
 * KnowledgeBaseTools
 * 
 * A reusable component for knowledge base management tools
 * that can be embedded in various parts of the application.
 */
export function KnowledgeBaseTools() {
  const [showUploader, setShowUploader] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const { documents } = useKnowledgeBaseStore();

  const handleUploadComplete = () => {
    setShowUploader(false);
  };

  return (
    <div className="flex flex-col space-y-2">
      {/* Upload Button */}
      <Dialog open={showUploader} onOpenChange={setShowUploader}>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center justify-start">
            <FileUp className="h-4 w-4 mr-2" />
            <span>Upload Documents</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload to Knowledge Base</DialogTitle>
          </DialogHeader>
          <SimpleDocumentUploader onUploadComplete={handleUploadComplete} />
        </DialogContent>
      </Dialog>

      {/* View Documents Button */}
      <Dialog open={showDocuments} onOpenChange={setShowDocuments}>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center justify-start">
            <Book className="h-4 w-4 mr-2" />
            <span>View Knowledge</span>
            {documents.length > 0 && (
              <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {documents.length}
              </span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Knowledge Base Documents</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {documents.length > 0 ? (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <Card key={doc.id} className="p-3">
                    <div className="flex items-start">
                      <FileText className="h-5 w-5 text-blue-500 mr-2 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{doc.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                          {doc.content?.substring(0, 150)}...
                        </p>
                        <div className="flex items-center mt-2 text-xs text-gray-400">
                          <span>Added: {new Date(doc.createdAt).toLocaleDateString()}</span>
                          {doc.tags && doc.tags.length > 0 && (
                            <div className="ml-2 flex items-center">
                              <span className="mr-1">•</span>
                              <span>{doc.tags.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Book className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No documents in knowledge base</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => {
                    setShowDocuments(false);
                    setTimeout(() => setShowUploader(true), 100);
                  }}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Documents
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 