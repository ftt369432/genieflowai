import React, { useState, useEffect } from 'react';
import {
  Download, Share, FileText, FileImage, 
  FileSpreadsheet, FileCode, AlertTriangle
} from 'lucide-react';
import { GenieDriveItem, GenieDriveFile } from '../../types/geniedrive';
import { genieDriveService } from '../../services/geniedrive/genieDriveService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface GenieDrivePreviewProps {
  item: GenieDriveItem;
}

export function GenieDrivePreview({ item }: GenieDrivePreviewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadContent();
  }, [item]);
  
  const loadContent = async () => {
    if (item.type === 'folder') return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // In a real implementation, we'd fetch the file content
      const fileContent = await genieDriveService.getItemContent(item.id);
      setContent(fileContent);
    } catch (err) {
      console.error('Failed to load file content:', err);
      setError('Failed to load file preview');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get file extension
  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };
  
  // Get language for code highlighting based on file extension
  const getLanguage = (extension: string) => {
    const languageMap: {[key: string]: string} = {
      'js': 'javascript',
      'ts': 'typescript',
      'jsx': 'jsx',
      'tsx': 'tsx',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby',
      'sh': 'bash',
      'sql': 'sql'
    };
    
    return languageMap[extension] || extension;
  };
  
  // Render code preview
  const renderCodePreview = () => {
    if (!content) {
      return <div className="p-4 text-center text-gray-500">No preview available</div>;
    }
    
    const extension = getFileExtension(item.name);
    const language = getLanguage(extension);
    
    return (
      <pre className="text-xs p-4 overflow-auto h-full bg-gray-50 font-mono whitespace-pre-wrap">
        {content}
      </pre>
    );
  };
  
  // Render image preview
  const renderImagePreview = () => {
    return (
      <div className="flex items-center justify-center h-full p-4">
        {item.previewUrl ? (
          <img 
            src={item.previewUrl} 
            alt={item.name}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="text-center text-gray-500">
            <FileImage className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p>Image preview not available</p>
          </div>
        )}
      </div>
    );
  };
  
  // Render document preview (PDF, Word, etc.)
  const renderDocumentPreview = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <FileText className="h-16 w-16 mb-4 text-gray-300" />
        <p className="text-gray-500 mb-4">Document preview not available</p>
        <Button size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
    );
  };
  
  // Render spreadsheet preview
  const renderSpreadsheetPreview = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <FileSpreadsheet className="h-16 w-16 mb-4 text-gray-300" />
        <p className="text-gray-500 mb-4">Spreadsheet preview not available</p>
        <Button size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
    );
  };
  
  // Main render
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="h-8 w-8 mr-3" />
        <span>Loading preview...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <AlertTriangle className="h-16 w-16 mb-4 text-red-300" />
        <p className="text-red-500 mb-4">{error}</p>
        <Button size="sm" onClick={loadContent}>Try Again</Button>
      </div>
    );
  }
  
  // Render folder view
  if (item.type === 'folder') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-gray-500">This is a folder. Select a file to preview.</p>
      </div>
    );
  }
  
  // Actions bar at the top
  const renderActionsBar = () => (
    <div className="flex items-center justify-end px-3 py-1 border-b bg-gray-50">
      <Button 
        variant="outline" 
        size="sm" 
        className="h-7 text-xs"
      >
        <Download className="h-3 w-3 mr-1" />
        Download
      </Button>
    </div>
  );
  
  return (
    <div className="h-full flex flex-col">
      {renderActionsBar()}
      
      <div className="flex-1 overflow-auto">
        {(() => {
          switch (item.type) {
            case 'image':
              return renderImagePreview();
            case 'document':
            case 'pdf':
              return renderDocumentPreview();
            case 'spreadsheet':
              return renderSpreadsheetPreview();
            case 'code':
            default:
              return renderCodePreview();
          }
        })()}
      </div>
    </div>
  );
} 