import React, { useState } from 'react';
import { FolderPlus, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import type { AIFolder } from '../../types/ai';

interface FolderActionsProps {
  currentFolderId: string | null;
}

export function FolderActions({ currentFolderId }: FolderActionsProps) {
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const { addFolder, folders, removeFolder, updateFolder } = useKnowledgeBaseStore();

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;

    const newFolder: AIFolder = {
      id: Date.now().toString(),
      name: newFolderName.trim(),
      parentId: currentFolderId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    addFolder(newFolder);
    setNewFolderName('');
    setShowNewFolder(false);
  };

  const currentFolder = currentFolderId ? folders.find(f => f.id === currentFolderId) : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNewFolder(true)}
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
        </div>
        {currentFolder && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newName = window.prompt('Rename folder:', currentFolder.name);
                if (newName?.trim()) {
                  updateFolder(currentFolder.id, { name: newName.trim() });
                }
              }}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this folder?')) {
                  removeFolder(currentFolder.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {showNewFolder && (
        <div className="flex items-center gap-2">
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
            autoFocus
          />
          <Button size="sm" onClick={handleCreateFolder}>
            Create
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setNewFolderName('');
              setShowNewFolder(false);
            }}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
} 