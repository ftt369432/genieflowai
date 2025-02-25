import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Tag as TagIcon, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import type { AIDocument } from '../../types/ai';
import { uploadToDrive } from '../../services/driveService';

interface DocumentUploaderProps {
  onClose: () => void;
  currentFolderId: string | null;
}

export function DocumentUploader({ onClose, currentFolderId }: DocumentUploaderProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDriveFile, setIsDriveFile] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const { addDocument } = useKnowledgeBaseStore();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      setCurrentFile(file);
      setIsDriveFile(file.type.includes('application/'));
      const reader = new FileReader();
      reader.onload = async () => {
        const text = reader.result as string;
        setContent(text);
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, ""));
        }

        if (isDriveFile) {
          try {
            const driveFile = await uploadToDrive(file);
            setContent(driveFile.content);
            setTitle(driveFile.name);
          } catch (error) {
            console.error('Failed to upload to drive:', error);
          }
        }
      };
      reader.readAsText(file);
    }
  }, [title, isDriveFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.google-apps.document': ['.gdoc'],
      'application/vnd.google-apps.spreadsheet': ['.gsheet'],
      'application/vnd.google-apps.presentation': ['.gslides'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    }
  });

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    setIsUploading(true);

    let fileUrl, fileSize;
    if (isDriveFile) {
      try {
        const driveFile = await uploadToDrive(currentFile!);
        fileUrl = driveFile.url;
        fileSize = driveFile.size;
      } catch (error) {
        console.error('Failed to upload to drive:', error);
        setIsUploading(false);
        return;
      }
    }

    const document: AIDocument = {
      id: Date.now().toString(),
      title,
      content,
      type: isDriveFile ? 'drive' : 'txt',
      folderId: currentFolderId,
      tags,
      url: fileUrl,
      size: fileSize,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      await addDocument(document);
      onClose();
    } catch (error) {
      console.error('Failed to add document:', error);
      // You might want to show an error toast here
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[600px] max-h-[80vh] overflow-y-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-medium">Add Document</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Content</label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer ${
                isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">
                {isDragActive
                  ? "Drop the files here..."
                  : "Drag 'n' drop files here, or click to select files"}
              </p>
            </div>
            {content && (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mt-2 w-full h-32 p-2 border rounded-lg resize-none"
                placeholder="Document content"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Add tags"
              />
              <Button type="button" onClick={handleAddTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="px-2 py-1 rounded-full bg-gray-100 text-xs text-gray-600 flex items-center gap-1"
                >
                  <TagIcon className="h-3 w-3" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter(t => t !== tag))}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!title || !content || isUploading}
            >
              {isUploading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
              ) : (
                "Add Document"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 