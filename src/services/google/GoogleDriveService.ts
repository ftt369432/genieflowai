import { googleApiClient } from './GoogleAPIClient';
import { getEnv } from '../../config/env';

/**
 * Google Drive file or folder
 */
export interface GoogleDriveItem {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
  webContentLink?: string;
  parents?: string[];
  size?: string;
  isFolder: boolean;
}

/**
 * Google Drive Service for managing files and folders in Google Drive
 */
export class GoogleDriveService {
  private static instance: GoogleDriveService;
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): GoogleDriveService {
    if (!GoogleDriveService.instance) {
      GoogleDriveService.instance = new GoogleDriveService();
    }
    return GoogleDriveService.instance;
  }
  
  /**
   * Check if the user is connected to Google Drive
   */
  public async isConnected(): Promise<boolean> {
    const { useMock } = getEnv();
    
    if (useMock) {
      return true;
    }
    
    return googleApiClient.isSignedIn();
  }
  
  /**
   * Get files and folders from a specific folder
   */
  public async getFiles(folderId: string = 'root'): Promise<GoogleDriveItem[]> {
    try {
      const files = await googleApiClient.getDriveFiles(folderId);
      
      return files.map(file => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        parents: file.parents,
        size: file.size,
        isFolder: file.mimeType === 'application/vnd.google-apps.folder'
      }));
    } catch (error) {
      console.error('Error getting Google Drive files:', error);
      return [];
    }
  }
  
  /**
   * Get a specific file or folder
   */
  public async getFile(fileId: string): Promise<GoogleDriveItem | null> {
    try {
      const file = await googleApiClient.getDriveFile(fileId);
      
      return {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        parents: file.parents,
        size: file.size,
        isFolder: file.mimeType === 'application/vnd.google-apps.folder'
      };
    } catch (error) {
      console.error(`Error getting Google Drive file ${fileId}:`, error);
      return null;
    }
  }
  
  /**
   * Download a file
   */
  public async downloadFile(fileId: string): Promise<Blob> {
    return googleApiClient.downloadDriveFile(fileId);
  }
  
  /**
   * Create a new folder
   */
  public async createFolder(name: string, parentId: string = 'root'): Promise<GoogleDriveItem | null> {
    try {
      const folder = await googleApiClient.createDriveFolder(name, parentId);
      
      return {
        id: folder.id,
        name: folder.name,
        mimeType: folder.mimeType,
        createdTime: folder.createdTime,
        modifiedTime: folder.modifiedTime || folder.createdTime,
        parents: folder.parents,
        isFolder: true
      };
    } catch (error) {
      console.error('Error creating Google Drive folder:', error);
      return null;
    }
  }
  
  /**
   * Upload a file
   */
  public async uploadFile(file: File, parentId: string = 'root'): Promise<GoogleDriveItem | null> {
    try {
      const uploadedFile = await googleApiClient.uploadDriveFile(file, parentId);
      
      return {
        id: uploadedFile.id,
        name: uploadedFile.name,
        mimeType: uploadedFile.mimeType,
        createdTime: uploadedFile.createdTime,
        modifiedTime: uploadedFile.modifiedTime || uploadedFile.createdTime,
        webViewLink: uploadedFile.webViewLink,
        webContentLink: uploadedFile.webContentLink,
        parents: uploadedFile.parents,
        size: uploadedFile.size,
        isFolder: false
      };
    } catch (error) {
      console.error('Error uploading file to Google Drive:', error);
      return null;
    }
  }
  
  /**
   * Import a file from Google Drive to GenieFlow
   */
  public async importFileToGenieFlow(fileId: string, destinationFolder: string | null = null): Promise<string | null> {
    try {
      // Get file details
      const file = await this.getFile(fileId);
      if (!file) {
        throw new Error(`File ${fileId} not found`);
      }
      
      // Download the file content
      const content = await this.downloadFile(fileId);
      
      // Convert blob to File object
      const fileObj = new File([content], file.name, { type: file.mimeType });
      
      // Import to GenieDrive (dynamically import to avoid circular dependencies)
      const { genieDriveService } = await import('../geniedrive/genieDriveService');
      const importedFile = await genieDriveService.uploadFile(fileObj, destinationFolder);
      
      return importedFile.id;
    } catch (error) {
      console.error(`Error importing file ${fileId} to GenieFlow:`, error);
      return null;
    }
  }
}

// Export the singleton instance
export const googleDriveService = GoogleDriveService.getInstance(); 