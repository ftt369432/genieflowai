import React from 'react';
import { 
  Inbox, 
  Star, 
  Send, 
  Archive, 
  Trash2, 
  Tag,
  Plus,
  Folder
} from 'lucide-react';
import type { EmailFolder } from '../../types';

interface EmailFoldersProps {
  folders: EmailFolder[];
  selectedFolder: string;
  onSelectFolder: (folderId: string) => void;
  onCreateFolder: () => void;
  unreadCounts: Record<string, number>;
}

const systemFolders = [
  { id: 'inbox', name: 'Inbox', icon: Inbox },
  { id: 'sent', name: 'Sent', icon: Send },
  { id: 'archive', name: 'Archive', icon: Archive },
  { id: 'trash', name: 'Trash', icon: Trash2 },
];

export function EmailFolders({ 
  folders, 
  selectedFolder, 
  onSelectFolder, 
  onCreateFolder,
  unreadCounts 
}: EmailFoldersProps) {
  return (
    <div className="w-64 p-4 border-r border-gray-200 dark:border-gray-700 h-full">
      <div className="mb-6">
        <button
          onClick={() => onSelectFolder('inbox')}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" />
          <span>Compose</span>
        </button>
      </div>

      <div className="space-y-1">
        {systemFolders.map(({ id, name, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onSelectFolder(id)}
            className={`
              w-full px-3 py-2 rounded-lg flex items-center justify-between
              ${selectedFolder === id 
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5" />
              <span>{name}</span>
            </div>
            {unreadCounts[id] > 0 && (
              <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                {unreadCounts[id]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-600 dark:text-gray-400">Folders</h3>
          <button
            onClick={onCreateFolder}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-1">
          {folders.map(folder => (
            <button
              key={folder.id}
              onClick={() => onSelectFolder(folder.id)}
              className={`
                w-full px-3 py-2 rounded-lg flex items-center justify-between
                ${selectedFolder === folder.id 
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <Folder className="h-5 w-5" />
                <span>{folder.name}</span>
              </div>
              {folder.count > 0 && (
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  {folder.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}