import React from 'react';
import { Library, FileText, Tag, FolderTree } from 'lucide-react';
import { Card } from '../ui/Card';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { useNavigate } from 'react-router-dom';

export function KnowledgeBaseWidget() {
  const { documents, folders, tags } = useKnowledgeBaseStore();
  const navigate = useNavigate();

  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/knowledge-base')}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium flex items-center gap-2">
          <Library className="h-5 w-5 text-blue-500" />
          Knowledge Base
        </h3>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-500" />
          <div>
            <div className="text-sm font-medium">{documents.length}</div>
            <div className="text-xs text-gray-500">Documents</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <FolderTree className="h-4 w-4 text-gray-500" />
          <div>
            <div className="text-sm font-medium">{folders.length}</div>
            <div className="text-xs text-gray-500">Folders</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-gray-500" />
          <div>
            <div className="text-sm font-medium">{tags.length}</div>
            <div className="text-xs text-gray-500">Tags</div>
          </div>
        </div>
      </div>

      {documents.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-medium text-gray-500 mb-2">Recent Documents</div>
          <div className="space-y-1">
            {documents.slice(0, 3).map(doc => (
              <div key={doc.id} className="text-sm truncate">{doc.title}</div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
} 