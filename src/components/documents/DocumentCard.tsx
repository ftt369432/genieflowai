import React, { useState } from 'react';
import { 
  FileText, 
  Trash, 
  Download, 
  MoreVertical, 
  Eye,
  File,
  FileImage,
  FileType,
  Tag
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader,
  CardTitle
} from '../ui/Card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import { Button } from '../ui/Button';
import { SupportedFileType } from './FileViewer';
import { DocumentViewer } from './DocumentViewer';

export interface Document {
  id: string;
  name: string;
  url: string;
  fileType: SupportedFileType;
  size: number;
  uploadedAt: Date;
  description?: string;
  content?: string;
  tags?: string[];
}

interface DocumentCardProps {
  document: Document;
  onView?: (doc: Document) => void;
  onDelete?: (id: string) => void;
  onDownload?: (doc: Document) => void;
}

function getFileIcon(fileType: SupportedFileType) {
  switch (fileType) {
    case 'pdf':
      return <FileType className="text-red-500" />;
    case 'image':
      return <FileImage className="text-blue-500" />;
    case 'text':
      return <FileText className="text-green-500" />;
    default:
      return <File className="text-gray-500" />;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

const DocumentCard: React.FC<DocumentCardProps> = ({ 
  document, 
  onView, 
  onDelete,
  onDownload 
}) => {
  const { id, name, fileType, size, uploadedAt, description, tags = [] } = document;
  const [showViewer, setShowViewer] = useState(false);
  
  const handleView = () => {
    if (onView) {
      onView(document);
    } else {
      setShowViewer(true);
    }
  };
  
  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-2 flex flex-row justify-between items-start">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={handleView}
        >
          {getFileIcon(fileType)}
          <CardTitle className="text-base truncate max-w-[200px]">{name}</CardTitle>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleView}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            {onDownload && (
              <DropdownMenuItem onClick={() => onDownload(document)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem 
                onClick={() => onDelete(id)}
                className="text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent className="py-2 flex-grow">
        {description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-2">{description}</p>
        )}
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map(tag => (
              <div key={tag} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full flex items-center">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-2 border-t text-xs text-gray-500 flex justify-between">
        <span>{formatFileSize(size)}</span>
        <span>Uploaded {formatDistanceToNow(uploadedAt, { addSuffix: true })}</span>
      </CardFooter>

      {showViewer && (
        <DocumentViewer 
          document={document}
          isOpen={showViewer}
          onClose={() => setShowViewer(false)}
        />
      )}
    </Card>
  );
};

export default DocumentCard; 