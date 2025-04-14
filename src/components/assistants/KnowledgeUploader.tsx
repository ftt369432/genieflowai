import React, { useState } from 'react';
import { Folder, Upload, Plus, File } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { DocumentUploader } from '../knowledge/DocumentUploader';
import { nanoid } from 'nanoid';

/**
 * KnowledgeUploader Component
 * 
 * A simplified component for uploading files to the knowledge base.
 * This component provides a direct way to upload files to a default
 * or selected folder in the knowledge base.
 */
export function KnowledgeUploader() {
  const { folders, documents, addFolder } = useKnowledgeBaseStore();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showFolderCreation, setShowFolderCreation] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Create a default folder if none exists
  const ensureDefaultFolder = () => {
    if (folders.length === 0) {
      const defaultFolderId = nanoid();
      addFolder({
        id: defaultFolderId,
        name: 'General Knowledge',
        description: 'Default folder for knowledge base documents',
        createdAt: new Date(),
        updatedAt: new Date(),
        parentId: null
      });
      return defaultFolderId;
    }
    return selectedFolderId || folders[0].id;
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    
    const folderId = nanoid();
    addFolder({
      id: folderId,
      name: newFolderName.trim(),
      description: 'User created folder',
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId: null
    });
    
    setNewFolderName('');
    setShowFolderCreation(false);
    setSelectedFolderId(folderId);
  };

  const handleUploadComplete = () => {
    console.log('Upload completed successfully!');
  };

  // Ensure we have a valid folder to upload to
  const targetFolderId = ensureDefaultFolder();

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center justify-between">
          <span>Knowledge Base</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowFolderCreation(!showFolderCreation)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {showFolderCreation && (
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create
            </Button>
          </div>
        )}

        <div className="mb-4">
          <label className="text-sm font-medium mb-1 block">Select Folder</label>
          <div className="flex flex-wrap gap-2">
            {folders.map(folder => (
              <Button
                key={folder.id}
                variant={selectedFolderId === folder.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFolderId(folder.id)}
                className="flex items-center"
              >
                <Folder className="mr-2 h-4 w-4" />
                {folder.name}
                {documents.filter(doc => doc.folderId === folder.id).length > 0 && (
                  <span className="ml-2 text-xs bg-gray-200 text-gray-800 rounded-full px-2 py-0.5">
                    {documents.filter(doc => doc.folderId === folder.id).length}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-2">Upload Documents</h3>
          <DocumentUploader 
            folderId={targetFolderId} 
            onUploadComplete={handleUploadComplete} 
          />
        </div>
      </CardContent>
    </Card>
  );
} 