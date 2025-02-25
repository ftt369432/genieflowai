import React, { useState } from 'react';
import { FileText, Tag, Trash2, Edit2, MessageSquare, Download, Link } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import type { AIDocument } from '../../types/ai';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { downloadFromDrive } from '../../services/driveService';
import { DocumentViewer } from './DocumentViewer';

interface DocumentCardProps {
  document: AIDocument;
  onChat?: () => void;
}

export function DocumentCard({ document, onChat }: DocumentCardProps) {
  const { removeDocument } = useKnowledgeBaseStore();
  const [showViewer, setShowViewer] = useState(false);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const blob = await downloadFromDrive(url);
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div
          className="flex items-start gap-3 cursor-pointer"
          onClick={() => setShowViewer(true)}
        >
          <FileText className="h-5 w-5 text-blue-500 mt-1" />
          <div>
            <h3 className="font-medium">{document.title}</h3>
            <p className="text-sm text-gray-500">
              {new Date(document.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {document.url && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(document.url, '_blank')}
              >
                <Link className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(document.url!, document.title)}
              >
                <Download className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onChat}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Handle edit
            }}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeDocument(document.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="text-sm text-gray-600 line-clamp-3">
        {document.summary || document.content.slice(0, 150) + '...'}
      </p>

      <div className="flex flex-wrap gap-2">
        {document.tags.map((tag) => (
          <div
            key={tag}
            className="px-2 py-1 rounded-full bg-gray-100 text-xs text-gray-600 flex items-center gap-1"
          >
            <Tag className="h-3 w-3" />
            {tag}
          </div>
        ))}
      </div>

      {showViewer && (
        <DocumentViewer
          document={document}
          onClose={() => setShowViewer(false)}
        />
      )}

      {document.size && (
        <div className="text-xs text-gray-500 mt-2">
          Size: {formatFileSize(document.size)}
        </div>
      )}
    </Card>
  );
}

function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
} 