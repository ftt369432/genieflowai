import React, { useState } from 'react';
import { Search, File, X } from 'lucide-react';
import { ScrollArea } from '../ui/ScrollArea';
import { Button } from '../ui/Button';
import { useAIStore } from '../../store/aiStore';
import type { AIDocument } from '../../types/ai';

interface DocumentPickerProps {
  onDocumentSelect: (document: any) => void;
}

export function DocumentPicker({ onDocumentSelect }: DocumentPickerProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    for (const file of selectedFiles) {
      try {
        // Mock document processing for now
        const document = {
          name: file.name,
          type: file.type,
          content: await file.text(),
          timestamp: new Date()
        };
        
        onDocumentSelect(document);
      } catch (error) {
        console.error('Error processing document:', error);
      }
    }
    setSelectedFiles([]);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        onChange={handleFileChange}
        multiple
        className="hidden"
        id="document-upload"
      />
      <label 
        htmlFor="document-upload"
        className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer"
      >
        Add Documents
      </label>
      {selectedFiles.length > 0 && (
        <button
          onClick={handleUpload}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Upload {selectedFiles.length} file(s)
        </button>
      )}
    </div>
  );
} 