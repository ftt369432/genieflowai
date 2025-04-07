import { FileText, Image, File } from 'lucide-react';
import { AIDocument } from '../types/ai';

export const getIcon = (type: AIDocument['type']) => {
  switch (type) {
    case 'image':
      return <Image className="w-6 h-6" />;
    case 'pdf':
    case 'md':
    case 'markdown':
    case 'csv':
    case 'json':
      return <FileText className="w-6 h-6" />;
    default:
      return <File className="w-6 h-6" />;
  }
}; 