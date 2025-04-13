import { getGoogleAuthInstance } from './googleAuthService';

interface DriveFile {
  id: string;
  name: string;
  content: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  mimeType: string;
}

/**
 * Upload a file to Google Drive
 */
export async function uploadToDrive(file: File): Promise<DriveFile> {
  try {
    const auth = getGoogleAuthInstance();
    if (!auth.isAuthenticated()) {
      throw new Error('User not authenticated with Google');
    }

    const content = await extractFileContent(file);
    
    // Create a form data object to upload to Google Drive
    const formData = new FormData();
    formData.append('file', file);
    
    // Upload the file to Google Drive using the Google Drive API
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${auth.getAccessToken()}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Failed to upload file to Google Drive: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Get the file metadata
    const fileMetadata = await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}?fields=id,name,mimeType,size,webViewLink,thumbnailLink`, {
      headers: {
        'Authorization': `Bearer ${auth.getAccessToken()}`
      }
    }).then(res => res.json());
    
    return {
      id: fileMetadata.id,
      name: fileMetadata.name,
      content,
      url: fileMetadata.webViewLink,
      thumbnailUrl: fileMetadata.thumbnailLink,
      size: Number(fileMetadata.size),
      mimeType: fileMetadata.mimeType
    };
  } catch (error) {
    console.error('Error uploading to drive:', error);
    
    // Fallback to local processing if Google Drive upload fails
    return {
      id: `local-${Date.now()}`,
      name: file.name,
      content: await extractFileContent(file),
      url: URL.createObjectURL(file),
      size: file.size,
      mimeType: file.type
    };
  }
}

/**
 * Download a file from Google Drive
 */
export async function downloadFromDrive(fileId: string): Promise<Blob> {
  try {
    const auth = getGoogleAuthInstance();
    if (!auth.isAuthenticated()) {
      throw new Error('User not authenticated with Google');
    }
    
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${auth.getAccessToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download file from Google Drive: ${response.statusText}`);
    }
    
    return response.blob();
  } catch (error) {
    console.error('Error downloading from drive:', error);
    throw error;
  }
}

/**
 * List files in Google Drive
 */
export async function listDriveFiles(folderId?: string): Promise<DriveFile[]> {
  try {
    const auth = getGoogleAuthInstance();
    if (!auth.isAuthenticated()) {
      throw new Error('User not authenticated with Google');
    }
    
    let query = "trashed=false";
    if (folderId) {
      query += ` and '${folderId}' in parents`;
    }
    
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,webViewLink,thumbnailLink)`, {
      headers: {
        'Authorization': `Bearer ${auth.getAccessToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to list files from Google Drive: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return data.files.map((file: any) => ({
      id: file.id,
      name: file.name,
      content: '', // Content is not included in list response
      url: file.webViewLink,
      thumbnailUrl: file.thumbnailLink,
      size: Number(file.size) || 0,
      mimeType: file.mimeType
    }));
  } catch (error) {
    console.error('Error listing drive files:', error);
    return [];
  }
}

/**
 * Extract text content from different file types
 */
async function extractFileContent(file: File): Promise<string> {
  const type = file.type;
  
  // Handle text files directly
  if (type === 'text/plain' || type === 'text/markdown' || type.includes('text/')) {
    return file.text();
  }
  
  // Handle PDF files using PDF.js (would need to be installed)
  if (type === 'application/pdf') {
    try {
      // This is a stub - in a real implementation you would use PDF.js or a similar library
      return `[PDF Content extracted from ${file.name}]`;
    } catch (error) {
      console.error('Error extracting PDF content:', error);
      return `[Unable to extract content from PDF: ${file.name}]`;
    }
  }
  
  // Handle Office documents (simplified)
  if (type.includes('officedocument') || type.includes('msword') || type.includes('application/vnd.')) {
    return `[Office document content extracted from ${file.name}]`;
  }
  
  // Handle images through OCR (simplified)
  if (type.startsWith('image/')) {
    return `[Image content extracted from ${file.name}]`;
  }
  
  // Default case - return file name as content
  return `Document: ${file.name}`;
} 