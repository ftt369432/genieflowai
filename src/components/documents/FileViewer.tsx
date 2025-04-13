import React from 'react';
import { FileText, Image, FileBox } from 'lucide-react';
import PDFViewer from './PDFViewer';
import { Card, CardContent } from '../ui/Card';

export type SupportedFileType = 'pdf' | 'image' | 'text' | 'unknown';

interface FileViewerProps {
  url: string;
  fileName: string;
  fileType?: SupportedFileType;
  className?: string;
}

const FileViewer: React.FC<FileViewerProps> = ({ 
  url, 
  fileName, 
  fileType: explicitFileType,
  className = '' 
}) => {
  // Determine file type from file extension if not explicitly provided
  const fileType = explicitFileType || getFileTypeFromName(fileName);
  
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-0">
        {renderFileContent(url, fileType)}
      </CardContent>
    </Card>
  );
};

function getFileTypeFromName(fileName: string): SupportedFileType {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  if (!extension) return 'unknown';
  
  if (extension === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
  if (['txt', 'md', 'rtf', 'doc', 'docx'].includes(extension)) return 'text';
  
  return 'unknown';
}

function renderFileContent(url: string, fileType: SupportedFileType) {
  switch (fileType) {
    case 'pdf':
      return <PDFViewer url={url} />;
    
    case 'image':
      return (
        <div className="flex justify-center p-4">
          <img 
            src={url} 
            alt="Document preview" 
            className="max-w-full max-h-[700px] object-contain"
          />
        </div>
      );
    
    case 'text':
      // Basic text viewer - in a real app, you might want to use a more sophisticated text viewer
      return (
        <iframe 
          src={url} 
          className="w-full h-[700px] border-0" 
          title="Text document preview"
        />
      );
    
    case 'unknown':
    default:
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500">
          <FileBox size={64} className="mb-4" />
          <h3 className="font-medium">Preview not available</h3>
          <p className="text-sm">This file type is not supported for preview.</p>
          <a 
            href={url} 
            download 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Download File
          </a>
        </div>
      );
  }
}

export default FileViewer; 