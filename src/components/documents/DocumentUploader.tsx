import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FilePlus, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '../ui/Dialog';
import { SupportedFileType } from './FileViewer';
import { Document } from './DocumentCard';
import { TagInput } from './TagInput';

interface DocumentUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (doc: Document) => void;
}

export function DocumentUploader({ isOpen, onClose, onUpload }: DocumentUploaderProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      
      // Set the file name as the default document name
      if (!name) {
        setName(selectedFile.name.split('.')[0]);
      }
      
      // Clear any previous errors
      setErrorMessage('');
    }
  }, [name]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif']
    }
  });

  const getFileType = (file: File): SupportedFileType => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    
    if (extension === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) return 'image';
    if (['txt', 'md', 'doc', 'docx'].includes(extension)) return 'text';
    
    return 'unknown';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setErrorMessage('Please select a file to upload');
      return;
    }
    
    if (!name) {
      setErrorMessage('Please provide a name for the document');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // In a real application, this would upload to a server
      // For demonstration, simulate upload delay and create a document object
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create document object with local URL
      const documentUrl = URL.createObjectURL(file);
      
      const newDocument: Document = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        description,
        url: documentUrl,
        fileType: getFileType(file),
        size: file.size,
        uploadedAt: new Date(),
        tags: tags.length > 0 ? tags : undefined,
      };
      
      onUpload(newDocument);
      onClose();
      
      // Reset form
      setName('');
      setDescription('');
      setTags([]);
      setFile(null);
    } catch (error) {
      console.error('Error uploading document:', error);
      setErrorMessage('Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium">
              Document Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter document name"
            />
          </div>
          
          <div className="space-y-1">
            <label htmlFor="description" className="text-sm font-medium">
              Description (Optional)
            </label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter document description"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              Tags (Optional)
            </label>
            <TagInput 
              value={tags} 
              onChange={setTags} 
              placeholder="Add tags and press Enter"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium">
              File
            </label>
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-10 w-10 mx-auto mb-2 text-gray-400" />
              
              {file ? (
                <div className="mt-2">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              ) : (
                <>
                  <p className="text-sm">
                    {isDragActive
                      ? "Drop the file here"
                      : "Drag and drop a file here, or click to select"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Supports PDF, TXT, DOC, DOCX, JPG, PNG, GIF
                  </p>
                </>
              )}
            </div>
          </div>
          
          {errorMessage && (
            <p className="text-sm text-red-500">{errorMessage}</p>
          )}
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading} className="flex items-center gap-1">
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <FilePlus className="h-4 w-4" />
                  <span>Upload</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 