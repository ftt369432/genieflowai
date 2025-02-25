import React, { useState } from 'react';
import { X, Save, Edit2, Tag as TagIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import type { AIDocument } from '../../types/ai';
import { TagSelector } from './TagSelector';

interface DocumentViewerProps {
  document: AIDocument;
  onClose: () => void;
}

export function DocumentViewer({ document, onClose }: DocumentViewerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(document.title);
  const [content, setContent] = useState(document.content);
  const [tags, setTags] = useState(document.tags);
  const [newTag, setNewTag] = useState('');
  const { updateDocument } = useKnowledgeBaseStore();

  const handleSave = () => {
    updateDocument(document.id, {
      title,
      content,
      tags,
      updatedAt: new Date()
    });
    setIsEditing(false);
  };

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[800px] max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-medium">
              {isEditing ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="font-medium"
                />
              ) : (
                document.title
              )}
            </h2>
            <span className="text-sm text-gray-500">
              Last updated: {new Date(document.updatedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            {isEditing && (
              <Button variant="ghost" size="sm" onClick={handleSave}>
                <Save className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isEditing ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full min-h-[300px] p-2 border rounded-lg resize-none"
            />
          ) : (
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap">{content}</pre>
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          <div className="flex items-center gap-2 mb-2">
            <TagIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Tags</span>
          </div>
          {isEditing ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="Add tags"
                />
                <Button onClick={handleAddTag}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div
                    key={tag}
                    className="px-2 py-1 rounded-full bg-gray-100 text-xs text-gray-600 flex items-center gap-1"
                  >
                    <TagIcon className="h-3 w-3" />
                    {tag}
                    <button
                      onClick={() => setTags(tags.filter(t => t !== tag))}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {document.tags.map((tag) => (
                <div
                  key={tag}
                  className="px-2 py-1 rounded-full bg-gray-100 text-xs text-gray-600 flex items-center gap-1"
                >
                  <TagIcon className="h-3 w-3" />
                  {tag}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 