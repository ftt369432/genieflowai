import type { Document } from '../../types';

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Project Proposal.pdf',
    type: 'pdf',
    size: 1024 * 1024,
    uploadDate: new Date(),
    lastModified: new Date()
  },
  {
    id: '2',
    name: 'Meeting Notes.docx',
    type: 'docx',
    size: 512 * 1024,
    uploadDate: new Date(),
    lastModified: new Date()
  }
];

export async function fetchDocuments(): Promise<Document[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockDocuments), 500);
  });
} 