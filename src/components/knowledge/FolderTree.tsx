import React from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import type { AIFolder } from '../../types/ai';
import { useDrop } from 'react-dnd';
import { useSelection } from './SelectionContext';

interface FolderTreeProps {
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
}

export function FolderTree({ selectedFolderId, onSelectFolder }: FolderTreeProps) {
  const { folders, documents, moveDocument, moveBatchDocuments } = useKnowledgeBaseStore();
  const { selectedDocuments, clearSelection } = useSelection();
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set());

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'DOCUMENT',
    drop: (item: { id: string, type: 'DOCUMENT', selected: boolean }, monitor) => {
      if (!monitor.didDrop()) {
        if (item.selected && selectedDocuments.size > 1) {
          moveBatchDocuments(Array.from(selectedDocuments), null);
          clearSelection();
        } else {
          moveDocument(item.id, null);
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
  }));

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolder = (folder: AIFolder, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const childFolders = folders.filter(f => f.parentId === folder.id);
    const documentCount = documents.filter(d => d.folderId === folder.id).length;

    const [{ isOver: isOverFolder }, dropRef] = useDrop(() => ({
      accept: 'DOCUMENT',
      drop: (item: { id: string, type: 'DOCUMENT', selected: boolean }) => {
        if (item.selected && selectedDocuments.size > 1) {
          moveBatchDocuments(Array.from(selectedDocuments), folder.id);
          clearSelection();
        } else {
          moveDocument(item.id, folder.id);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }));

    return (
      <div key={folder.id}>
        <div
          ref={dropRef}
          className={`flex items-center px-2 py-1 cursor-pointer hover:bg-gray-50 ${
            isSelected ? 'bg-blue-50' : ''
          } ${isOverFolder ? 'bg-blue-100' : ''}`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => onSelectFolder(folder.id)}
        >
          <button
            className="p-1 hover:bg-gray-100 rounded"
            onClick={(e) => {
              e.stopPropagation();
              toggleFolder(folder.id);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-blue-500 ml-1" />
          ) : (
            <Folder className="h-4 w-4 text-blue-500 ml-1" />
          )}
          <span className="ml-2 text-sm">{folder.name}</span>
          <span className="ml-auto text-xs text-gray-500">{documentCount}</span>
        </div>
        {isExpanded && childFolders.map(child => renderFolder(child, level + 1))}
      </div>
    );
  };

  return (
    <div 
      ref={drop}
      className={`border rounded-lg ${isOver ? 'bg-blue-50' : ''}`}
    >
      <div
        className={`flex items-center px-3 py-2 cursor-pointer hover:bg-gray-50 ${
          selectedFolderId === null ? 'bg-blue-50' : ''
        }`}
        onClick={() => onSelectFolder(null)}
      >
        <Folder className="h-4 w-4 text-blue-500" />
        <span className="ml-2 text-sm font-medium">All Documents</span>
        <span className="ml-auto text-xs text-gray-500">
          {documents.filter(d => !d.folderId).length}
        </span>
      </div>
      {folders
        .filter(f => !f.parentId)
        .map(folder => renderFolder(folder))}
    </div>
  );
} 