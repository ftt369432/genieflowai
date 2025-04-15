import { FileText, Image, File } from 'lucide-react';
import { AIDocument, DocumentReference } from '../types/ai';
import React from 'react';

export const getIcon = (type: DocumentReference['type']): React.ReactElement => {
  switch (type) {
    case 'image':
      return React.createElement(Image, { className: "w-6 h-6" });
    case 'pdf':
    case 'md':
    case 'markdown':
    case 'csv':
    case 'json':
      return React.createElement(FileText, { className: "w-6 h-6" });
    default:
      return React.createElement(File, { className: "w-6 h-6" });
  }
}; 