import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Document } from '../../types/documents';

export interface FileUploadProps {
  onUpload: (document: Document) => Promise<boolean>;
  accept?: string;
  maxSize?: number;
}

export function FileUpload({ onUpload, accept = '.pdf,.doc,.txt,.md', maxSize = 10 * 1024 * 1024 }: FileUploadProps) {
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > maxSize) {
      alert(`File size must be less than ${maxSize / 1024 / 1024}MB`);
      return;
    }

    try {
      // Read file content
      const content = await file.text();
      
      // Create document object
      const document: Document = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.name.split('.').pop() as 'pdf' | 'doc' | 'txt' | 'md',
        content,
        size: file.size,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          lastModified: new Date(file.lastModified)
        }
      };

      // Upload document
      const success = await onUpload(document);
      if (success) {
        event.target.value = ''; // Reset input
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    }
  }, [maxSize, onUpload]);

  return (
    <div className="relative">
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <Button /*variant="outline"*/ className="pointer-events-none btn-genie-primary">
        <Upload className="w-4 h-4 mr-2" />
        Upload
      </Button>
    </div>
  );
} 