import React, { useState, useEffect } from 'react';
import { Folder, FolderPlus, FileText, HardDrive, UploadCloud, Search, X } from 'lucide-react';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { useAssistantStore } from '../../store/assistantStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { DocumentUploader } from '../knowledge/DocumentUploader';
import { listDriveFiles } from '../../services/driveService';
import { getGoogleAuthInstance } from '../../services/googleAuthService';
import type { AIFolder, AIDocument } from '../../types/ai';

interface KnowledgeBaseSelectorProps {
  selectedFolderIds: string[];
  onSelectFolder: (folderIds: string[]) => void;
  assistantId?: string;
}

/**
 * Component for selecting knowledge base folders for assistants
 */
export function KnowledgeBaseSelector({ 
  selectedFolderIds,
  onSelectFolder,
  assistantId
}: KnowledgeBaseSelectorProps) {
  const { folders, documents, addFolder } = useKnowledgeBaseStore();
  const { assignFolderToAssistant } = useAssistantStore();
  
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showUploader, setShowUploader] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [showDriveFiles, setShowDriveFiles] = useState(false);
  
  // Fetch Drive files when the component mounts
  useEffect(() => {
    async function fetchDriveFiles() {
      try {
        const auth = getGoogleAuthInstance();
        if (auth.isAuthenticated()) {
          const files = await listDriveFiles();
          setDriveFiles(files);
        }
      } catch (error) {
        console.error('Error fetching drive files:', error);
      }
    }
    
    fetchDriveFiles();
  }, []);
  
  // Handle folder selection
  const handleFolderSelect = (folderId: string) => {
    if (selectedFolderIds.includes(folderId)) {
      onSelectFolder(selectedFolderIds.filter(id => id !== folderId));
    } else {
      onSelectFolder([...selectedFolderIds, folderId]);
    }
  };
  
  // Create a new folder
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    
    const newFolder: AIFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName,
      documents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId: null,
    };
    
    addFolder(newFolder);
    
    // If we have an assistantId, assign this folder to it
    if (assistantId) {
      assignFolderToAssistant(assistantId, newFolder.id);
      onSelectFolder([...selectedFolderIds, newFolder.id]);
    }
    
    setNewFolderName('');
    setShowNewFolderDialog(false);
    setCurrentFolder(newFolder.id);
  };
  
  // Filter folders based on search term
  const filteredFolders = folders.filter(folder => 
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Get documents for a specific folder
  const getFolderDocuments = (folderId: string) => {
    return documents.filter(doc => doc.folderId === folderId);
  };
  
  // Handle Google Drive auth
  const handleAuthGoogle = async () => {
    try {
      const auth = getGoogleAuthInstance();
      await auth.signIn();
      
      // After successful auth, fetch Drive files
      const files = await listDriveFiles();
      setDriveFiles(files);
      setShowDriveFiles(true);
    } catch (error) {
      console.error('Error authenticating with Google:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Knowledge Base Folders</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowNewFolderDialog(true)}
            className="flex items-center gap-2"
          >
            <FolderPlus size={16} />
            <span>New Folder</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowDriveFiles(!showDriveFiles)}
            className="flex items-center gap-2"
          >
            <HardDrive size={16} />
            <span>Google Drive</span>
          </Button>
        </div>
      </div>
      
      <div className="flex gap-2 mb-4">
        <div className="relative flex-grow">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search folders..."
            className="pl-8"
          />
          {searchTerm && (
            <button
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              onClick={() => setSearchTerm('')}
            >
              <X size={16} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>
      
      {showDriveFiles && driveFiles.length > 0 && (
        <Card className="p-4 mb-4">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <HardDrive size={16} />
            Google Drive Files
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {driveFiles.map(file => (
              <div key={file.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-blue-500" />
                  <span>{file.name}</span>
                </div>
                <Button size="sm" variant="ghost">Import</Button>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {showDriveFiles && driveFiles.length === 0 && (
        <Card className="p-4 mb-4 flex flex-col items-center justify-center">
          <HardDrive size={32} className="text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 mb-2">Connect to Google Drive to access your files</p>
          <Button onClick={handleAuthGoogle}>
            Connect Google Drive
          </Button>
        </Card>
      )}
      
      <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-3">
        {filteredFolders.length > 0 ? (
          filteredFolders.map(folder => (
            <div key={folder.id} className="space-y-1">
              <div className="flex items-center justify-between p-1 hover:bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`folder-${folder.id}`}
                    checked={selectedFolderIds.includes(folder.id)}
                    onCheckedChange={() => handleFolderSelect(folder.id)}
                  />
                  <label 
                    htmlFor={`folder-${folder.id}`} 
                    className="cursor-pointer flex items-center gap-2"
                  >
                    <Folder size={16} className="text-blue-500" />
                    <span>{folder.name}</span>
                  </label>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    {getFolderDocuments(folder.id).length} docs
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setCurrentFolder(folder.id);
                      setShowUploader(true);
                    }}
                    className="h-7 px-2"
                  >
                    <UploadCloud size={14} />
                  </Button>
                </div>
              </div>
              
              {/* Show documents in the folder if it's expanded */}
              {currentFolder === folder.id && (
                <div className="ml-6 pl-2 border-l space-y-1">
                  {getFolderDocuments(folder.id).map(doc => (
                    <div key={doc.id} className="flex items-center gap-2 text-sm p-1 hover:bg-gray-50 rounded">
                      <FileText size={14} className="text-gray-500" />
                      <span className="truncate">{doc.title || doc.id}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-center py-4">
            No folders found. Create folders to organize your assistant's knowledge.
          </p>
        )}
      </div>
      
      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Knowledge Base Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="folderName" className="block text-sm font-medium mb-1">
                Folder Name
              </label>
              <Input
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="My Knowledge Folder"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowNewFolderDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
              >
                Create Folder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Document Uploader */}
      {showUploader && (
        <DocumentUploader
          currentFolderId={currentFolder}
          onClose={() => setShowUploader(false)}
        />
      )}
    </div>
  );
} 