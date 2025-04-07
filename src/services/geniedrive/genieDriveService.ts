import { v4 as uuidv4 } from 'uuid';
import { 
  GenieDriveItem, 
  GenieDriveFolder, 
  GenieDriveFile, 
  GenieDriveService,
  GenieDriveFilter,
  GenieDriveStorage,
  GenieDriveShareSettings,
  GenieDriveAIAnalysis,
  GenieDriveItemType
} from '../../types/geniedrive';
import { useSupabase } from '../../providers/SupabaseProvider';
import { getEnv } from '../../config/env';
import { supabase } from '../../lib/supabase';
import { documentProcessingService } from '../documents/documentProcessingService';

/**
 * GenieDrive Service Implementation
 * 
 * Service for managing files and folders in GenieDrive
 */
class GenieDriveServiceImpl implements GenieDriveService {
  private static instance: GenieDriveServiceImpl;
  private mockData: Map<string, GenieDriveItem>;
  private mockStorage: GenieDriveStorage;
  private initialized: boolean = false;

  private constructor() {
    this.mockData = new Map();
    this.mockStorage = {
      totalSpace: 10 * 1024 * 1024 * 1024, // 10 GB
      usedSpace: 2 * 1024 * 1024 * 1024,   // 2 GB
      remainingSpace: 8 * 1024 * 1024 * 1024 // 8 GB
    };
  }

  static getInstance(): GenieDriveServiceImpl {
    if (!GenieDriveServiceImpl.instance) {
      GenieDriveServiceImpl.instance = new GenieDriveServiceImpl();
    }
    return GenieDriveServiceImpl.instance;
  }

  /**
   * Initialize the service and generate mock data
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Set initialized to true first to prevent recursion
    this.initialized = true;
    
    // In a real implementation, we'd connect to Supabase here
    // For now, let's set up some mock data
    await this.generateMockData();
  }

  /**
   * Get items from a folder
   */
  async getItems(folderId: string | null, filter?: GenieDriveFilter): Promise<GenieDriveItem[]> {
    // Wait for initialization
    if (!this.initialized) await this.initialize();

    // Get all items in the specified folder
    let items = Array.from(this.mockData.values()).filter(item => 
      item.parentId === folderId
    );

    // Apply filters if provided
    if (filter) {
      if (filter.types && filter.types.length > 0) {
        items = items.filter(item => filter.types!.includes(item.type));
      }
      
      if (filter.tags && filter.tags.length > 0) {
        items = items.filter(item => 
          filter.tags!.some(tag => item.metadata.tags.includes(tag))
        );
      }
      
      if (filter.starred !== undefined) {
        items = items.filter(item => item.metadata.starred === filter.starred);
      }
      
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        items = items.filter(item => 
          item.name.toLowerCase().includes(searchLower) ||
          item.metadata.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      
      if (filter.dateRange) {
        const { start, end } = filter.dateRange;
        const startDate = new Date(start).getTime();
        const endDate = new Date(end).getTime();
        
        items = items.filter(item => {
          const itemDate = new Date(item.metadata.createdAt).getTime();
          return itemDate >= startDate && itemDate <= endDate;
        });
      }
    }

    return items;
  }

  /**
   * Create a new folder
   */
  async createFolder(name: string, parentId: string | null): Promise<GenieDriveFolder> {
    // Wait for initialization
    if (!this.initialized) await this.initialize();

    const userId = this.getCurrentUserId();
    const folderId = uuidv4();
    const now = new Date().toISOString();
    
    // Create the folder object
    const folder: GenieDriveFolder = {
      id: folderId,
      name,
      type: 'folder',
      parentId,
      path: await this.getItemPath(parentId),
      childrenCount: 0,
      permissions: {
        canView: [userId],
        canEdit: [userId],
        canDelete: [userId],
        isPublic: false
      },
      metadata: {
        creator: userId,
        createdAt: now,
        lastModifiedBy: userId,
        lastModifiedAt: now,
        size: 0,
        mimeType: 'application/folder',
        starred: false,
        tags: []
      }
    };
    
    // Add to mock data
    this.mockData.set(folderId, folder);
    
    // Update parent folder's child count if applicable
    if (parentId) {
      const parentFolder = this.mockData.get(parentId) as GenieDriveFolder;
      if (parentFolder && parentFolder.type === 'folder') {
        parentFolder.childrenCount += 1;
        this.mockData.set(parentId, parentFolder);
      }
    }
    
    return folder;
  }

  /**
   * Upload a file
   */
  async uploadFile(file: File, parentId: string | null): Promise<GenieDriveFile> {
    // Wait for initialization
    if (!this.initialized) await this.initialize();

    const userId = this.getCurrentUserId();
    const fileId = uuidv4();
    const now = new Date().toISOString();
    
    // Determine file type
    const fileType = this.getFileType(file.name);
    
    // Extract text content for document types
    let extractedText = '';
    if (['document', 'pdf', 'spreadsheet', 'presentation', 'code'].includes(fileType)) {
      try {
        extractedText = await documentProcessingService.extractText(file);
      } catch (error) {
        console.error('Failed to extract text:', error);
        extractedText = `Failed to extract text from ${file.name}`;
      }
    }
    
    // Create file object
    const newFile: GenieDriveFile = {
      id: fileId,
      name: file.name,
      type: fileType,
      parentId,
      path: await this.getItemPath(parentId),
      extension: this.getFileExtension(file.name),
      version: 1,
      permissions: {
        canView: [userId],
        canEdit: [userId],
        canDelete: [userId],
        isPublic: false
      },
      metadata: {
        creator: userId,
        createdAt: now,
        lastModifiedBy: userId,
        lastModifiedAt: now,
        size: file.size,
        mimeType: file.type || this.getMimeType(file.name),
        starred: false,
        tags: []
      },
      content: extractedText || undefined,
      downloadUrl: URL.createObjectURL(file),
      previewUrl: fileType === 'image' ? URL.createObjectURL(file) : undefined
    };
    
    // Add to mock data
    this.mockData.set(fileId, newFile);
    
    // Update parent folder's child count if applicable
    if (parentId) {
      const parentFolder = this.mockData.get(parentId) as GenieDriveFolder;
      if (parentFolder && parentFolder.type === 'folder') {
        parentFolder.childrenCount += 1;
        this.mockData.set(parentId, parentFolder);
      }
    }
    
    // Update storage usage
    this.mockStorage.usedSpace += file.size;
    this.mockStorage.remainingSpace -= file.size;
    
    return newFile;
  }

  /**
   * Delete an item
   */
  async deleteItem(itemId: string): Promise<boolean> {
    // Wait for initialization
    if (!this.initialized) await this.initialize();

    const item = this.mockData.get(itemId);
    if (!item) return false;
    
    // If it's a folder, recursively delete all children
    if (item.type === 'folder') {
      const childrenIds = Array.from(this.mockData.values())
        .filter(i => i.parentId === itemId)
        .map(i => i.id);
      
      // Recursively delete all children
      for (const childId of childrenIds) {
        await this.deleteItem(childId);
      }
    }
    
    // Update parent folder's child count if applicable
    if (item.parentId) {
      const parentFolder = this.mockData.get(item.parentId) as GenieDriveFolder;
      if (parentFolder && parentFolder.type === 'folder') {
        parentFolder.childrenCount -= 1;
        this.mockData.set(item.parentId, parentFolder);
      }
    }
    
    // Update storage usage if it's a file
    if (item.type !== 'folder') {
      this.mockStorage.usedSpace -= item.metadata.size;
      this.mockStorage.remainingSpace += item.metadata.size;
    }
    
    // Remove the item
    this.mockData.delete(itemId);
    
    return true;
  }

  /**
   * Move an item to a different folder
   */
  async moveItem(itemId: string, newParentId: string | null): Promise<GenieDriveItem> {
    // Wait for initialization
    if (!this.initialized) await this.initialize();

    const item = this.mockData.get(itemId);
    if (!item) throw new Error('Item not found');
    
    const oldParentId = item.parentId;
    
    // Update the parent folder references
    if (oldParentId) {
      const oldParent = this.mockData.get(oldParentId) as GenieDriveFolder;
      if (oldParent && oldParent.type === 'folder') {
        oldParent.childrenCount -= 1;
        this.mockData.set(oldParentId, oldParent);
      }
    }
    
    if (newParentId) {
      const newParent = this.mockData.get(newParentId) as GenieDriveFolder;
      if (!newParent || newParent.type !== 'folder') {
        throw new Error('Target is not a folder');
      }
      newParent.childrenCount += 1;
      this.mockData.set(newParentId, newParent);
    }
    
    // Update the item's parent and path
    item.parentId = newParentId;
    item.path = await this.getItemPath(newParentId);
    item.metadata.lastModifiedAt = new Date().toISOString();
    item.metadata.lastModifiedBy = this.getCurrentUserId();
    
    this.mockData.set(itemId, item);
    
    return item;
  }

  /**
   * Copy an item to a different folder
   */
  async copyItem(itemId: string, newParentId: string | null): Promise<GenieDriveItem> {
    // Wait for initialization
    if (!this.initialized) await this.initialize();

    const item = this.mockData.get(itemId);
    if (!item) throw new Error('Item not found');
    
    const userId = this.getCurrentUserId();
    const newItemId = uuidv4();
    const now = new Date().toISOString();
    
    // Create a copy of the item
    const newItem: GenieDriveItem = {
      ...item,
      id: newItemId,
      name: `${item.name} (Copy)`,
      parentId: newParentId,
      path: await this.getItemPath(newParentId),
      metadata: {
        ...item.metadata,
        creator: userId,
        createdAt: now,
        lastModifiedBy: userId,
        lastModifiedAt: now
      }
    };
    
    // If it's a file, update version
    if (newItem.type !== 'folder') {
      (newItem as GenieDriveFile).version = 1;
    } else {
      (newItem as GenieDriveFolder).childrenCount = 0;
    }
    
    // Add to mock data
    this.mockData.set(newItemId, newItem);
    
    // Update parent folder's child count if applicable
    if (newParentId) {
      const parentFolder = this.mockData.get(newParentId) as GenieDriveFolder;
      if (parentFolder && parentFolder.type === 'folder') {
        parentFolder.childrenCount += 1;
        this.mockData.set(newParentId, parentFolder);
      }
    }
    
    // Update storage usage if it's a file
    if (item.type !== 'folder') {
      this.mockStorage.usedSpace += item.metadata.size;
      this.mockStorage.remainingSpace -= item.metadata.size;
    }
    
    return newItem;
  }

  /**
   * Rename an item
   */
  async renameItem(itemId: string, newName: string): Promise<GenieDriveItem> {
    // Wait for initialization
    if (!this.initialized) await this.initialize();

    const item = this.mockData.get(itemId);
    if (!item) throw new Error('Item not found');
    
    // Update the item
    item.name = newName;
    item.metadata.lastModifiedAt = new Date().toISOString();
    item.metadata.lastModifiedBy = this.getCurrentUserId();
    
    // If it's a file, update the extension
    if (item.type !== 'folder') {
      (item as GenieDriveFile).extension = this.getFileExtension(newName);
    }
    
    this.mockData.set(itemId, item);
    
    return item;
  }

  /**
   * Get an item's content
   */
  async getItemContent(itemId: string): Promise<string | ArrayBuffer | null> {
    // Wait for initialization
    if (!this.initialized) await this.initialize();

    const item = this.mockData.get(itemId);
    if (!item) return null;
    
    // If there's already content, return it
    if (item.content) return item.content;
    
    // In a real implementation, we'd fetch the content from storage
    // For mock, we'll return sample content based on the file type
    if (item.type === 'document') {
      return 'This is a sample document content. In a real implementation, this would be fetched from a database or storage service.';
    } else if (item.type === 'spreadsheet') {
      return 'Column A,Column B,Column C\nValue 1,Value 2,Value 3\nValue 4,Value 5,Value 6';
    } else if (item.type === 'code') {
      return 'function helloWorld() {\n  console.log("Hello, world!");\n}\n\nhelloWorld();';
    } else if (item.type === 'pdf') {
      return 'This is sample content extracted from a PDF file. In a real implementation, we would use PDF.js to extract the actual text.';
    } else {
      return 'Sample content for ' + item.name;
    }
  }

  /**
   * Update an item's content
   */
  async updateItemContent(itemId: string, content: string | ArrayBuffer): Promise<GenieDriveFile> {
    // Wait for initialization
    if (!this.initialized) await this.initialize();

    const item = this.mockData.get(itemId);
    if (!item || item.type === 'folder') {
      throw new Error('Invalid item or trying to update a folder');
    }
    
    const file = item as GenieDriveFile;
    
    // Calculate the size difference
    const oldSize = file.metadata.size;
    const newSize = content instanceof ArrayBuffer ? content.byteLength : content.length;
    const sizeDiff = newSize - oldSize;
    
    // Update the file
    file.content = content;
    file.version += 1;
    file.metadata.size = newSize;
    file.metadata.lastModifiedAt = new Date().toISOString();
    file.metadata.lastModifiedBy = this.getCurrentUserId();
    
    // Update storage usage
    this.mockStorage.usedSpace += sizeDiff;
    this.mockStorage.remainingSpace -= sizeDiff;
    
    this.mockData.set(itemId, file);
    
    return file;
  }

  /**
   * Get storage information
   */
  async getStorage(): Promise<GenieDriveStorage> {
    // Wait for initialization
    if (!this.initialized) await this.initialize();
    
    return this.mockStorage;
  }

  /**
   * Share an item
   */
  async shareItem(itemId: string, settings: GenieDriveShareSettings): Promise<string> {
    // Wait for initialization
    if (!this.initialized) await this.initialize();

    const item = this.mockData.get(itemId);
    if (!item) throw new Error('Item not found');
    
    // Update permissions based on share settings
    if (settings.accessType === 'public') {
      item.permissions.isPublic = true;
    } else if (settings.accessType === 'anyoneWithLink') {
      item.permissions.isPublic = false;
      // In a real implementation, we'd generate and store a share token
    } else {
      item.permissions.isPublic = false;
    }
    
    // Add user permissions
    for (const shared of settings.sharedWith) {
      if (shared.permission === 'view' && !item.permissions.canView.includes(shared.email)) {
        item.permissions.canView.push(shared.email);
      } else if (shared.permission === 'edit' && !item.permissions.canEdit.includes(shared.email)) {
        item.permissions.canEdit.push(shared.email);
        item.permissions.canView.push(shared.email);
      }
    }
    
    if (settings.password) {
      item.permissions.password = settings.password;
    }
    
    this.mockData.set(itemId, item);
    
    // Generate and return a share URL
    const shareToken = uuidv4();
    return `${window.location.origin}/drive/shared/${shareToken}`;
  }

  /**
   * Get AI analysis for an item
   */
  async getAIAnalysis(itemId: string): Promise<GenieDriveAIAnalysis> {
    // Wait for initialization
    if (!this.initialized) await this.initialize();

    const item = this.mockData.get(itemId);
    if (!item) throw new Error('Item not found');
    
    // Check if there's already an analysis
    if (item.aiAnalysis) return item.aiAnalysis;
    
    // If not, generate one
    return this.generateAIAnalysis(itemId);
  }

  /**
   * Generate AI analysis for an item
   */
  async generateAIAnalysis(itemId: string): Promise<GenieDriveAIAnalysis> {
    // Wait for initialization
    if (!this.initialized) await this.initialize();

    const item = this.mockData.get(itemId);
    if (!item) throw new Error('Item not found');
    
    // Get item content for analysis
    let content: string | ArrayBuffer | null = item.content;
    if (!content) {
      content = await this.getItemContent(itemId);
    }
    
    // Convert to string for analysis
    const textContent = content instanceof ArrayBuffer 
      ? new TextDecoder().decode(content) 
      : String(content || '');
    
    // In a real implementation, we'd use AI APIs to analyze the content
    // For mock data, we'll create sample analysis based on content
    const wordCount = textContent.split(/\s+/).length;
    const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const topWords = this.getTopWords(textContent);
    
    // Generate more relevant analysis based on content
    const analysis: GenieDriveAIAnalysis = {
      summary: `This is a ${item.type} file named ${item.name}. It contains approximately ${wordCount} words and ${sentences.length} sentences.`,
      keyPoints: [
        `The document appears to be about ${this.guessDocumentTopic(textContent)}.`,
        `Key themes include ${topWords.slice(0, 3).join(', ')}.`,
        `Document has a ${this.analyzeSentiment(textContent)} tone.`
      ],
      entities: this.extractEntities(textContent),
      sentiment: this.analyzeSentiment(textContent),
      topics: this.extractTopics(textContent),
      suggestedActions: [
        'Review the document for completeness',
        `Consider adding more details about ${topWords[0] || 'the main topic'}`,
        'Share with team members for feedback'
      ],
      generatedAt: new Date().toISOString()
    };
    
    // Store the analysis with the item
    item.aiAnalysis = analysis;
    this.mockData.set(itemId, item);
    
    return analysis;
  }

  /**
   * Helper method to get top words from text
   */
  private getTopWords(text: string, count: number = 5): string[] {
    if (!text) return [];
    
    // Convert to lowercase and remove punctuation
    const cleanText = text.toLowerCase().replace(/[^\w\s]/g, '');
    
    // Count word frequencies
    const words = cleanText.split(/\s+/);
    const wordFreq: Record<string, number> = {};
    const stopWords = new Set(['the', 'a', 'an', 'and', 'in', 'on', 'at', 'to', 'of', 'for', 'with', 'is', 'are']);
    
    for (const word of words) {
      if (word.length > 2 && !stopWords.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    }
    
    // Sort by frequency
    return Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([word]) => word);
  }

  /**
   * Helper method to guess document topic
   */
  private guessDocumentTopic(text: string): string {
    if (!text) return 'unknown subject';
    
    const topWords = this.getTopWords(text, 2);
    if (topWords.length > 0) {
      return topWords.join(' and ');
    }
    
    return 'general information';
  }

  /**
   * Helper method to analyze sentiment
   */
  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    if (!text) return 'neutral';
    
    // Very simple sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'happy', 'success', 'best', 'better'];
    const negativeWords = ['bad', 'poor', 'negative', 'terrible', 'worst', 'fail', 'problem', 'issue'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    const words = text.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    }
    
    if (positiveCount > negativeCount * 1.5) return 'positive';
    if (negativeCount > positiveCount * 1.5) return 'negative';
    return 'neutral';
  }

  /**
   * Helper method to extract potential entities
   */
  private extractEntities(text: string): string[] {
    if (!text) return [];
    
    // Look for capitalized words that might be entities
    const words = text.split(/\s+/);
    const potentialEntities = new Set<string>();
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i].trim();
      // Skip first word of sentence as it's naturally capitalized
      const isPreviousEndOfSentence = i > 0 && /[.!?]$/.test(words[i-1]);
      
      // Check for capitalized words that aren't at the start of sentences
      if (word.length > 1 && 
          /^[A-Z][a-z]+$/.test(word) && 
          !isPreviousEndOfSentence) {
        potentialEntities.add(word);
      }
    }
    
    return Array.from(potentialEntities).slice(0, 5);
  }

  /**
   * Helper method to extract topics
   */
  private extractTopics(text: string): string[] {
    if (!text) return [];
    
    // Use top words to create topics
    const topWords = this.getTopWords(text, 10);
    const topics: string[] = [];
    
    // Create combinations of top words
    for (let i = 0; i < Math.min(5, topWords.length); i++) {
      if (i < topWords.length - 1) {
        topics.push(`${topWords[i]} ${topWords[i+1]}`);
      } else {
        topics.push(topWords[i]);
      }
    }
    
    return topics.slice(0, 5);
  }

  /**
   * Helper method to get the current user ID
   */
  private getCurrentUserId(): string {
    // In a real implementation, we'd use Supabase auth
    return 'current-user-id';
  }

  /**
   * Helper method to get the path to an item
   */
  private async getItemPath(parentId: string | null): Promise<string[]> {
    if (!parentId) return [];
    
    const path: string[] = [];
    let currentId = parentId;
    
    // Build path by walking up the tree
    while (currentId) {
      const parent = this.mockData.get(currentId);
      if (!parent) break;
      
      path.unshift(parent.name);
      currentId = parent.parentId;
    }
    
    return path;
  }

  /**
   * Helper method to get the file type from a filename
   */
  private getFileType(filename: string): GenieDriveItemType {
    const extension = this.getFileExtension(filename).toLowerCase();
    
    // Map extensions to file types
    const extensionMap: Record<string, GenieDriveItemType> = {
      'doc': 'document',
      'docx': 'document',
      'txt': 'document',
      'md': 'document',
      'pdf': 'pdf',
      'xls': 'spreadsheet',
      'xlsx': 'spreadsheet',
      'csv': 'spreadsheet',
      'ppt': 'presentation',
      'pptx': 'presentation',
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'svg': 'image',
      'mp4': 'video',
      'avi': 'video',
      'mov': 'video',
      'mp3': 'audio',
      'wav': 'audio',
      'zip': 'archive',
      'rar': 'archive',
      'tar': 'archive',
      'gz': 'archive',
      'js': 'code',
      'ts': 'code',
      'py': 'code',
      'java': 'code',
      'c': 'code',
      'cpp': 'code',
      'cs': 'code',
      'html': 'code',
      'css': 'code',
      'php': 'code',
      'rb': 'code',
      'go': 'code',
      'rs': 'code',
      'swift': 'code'
    };
    
    return extensionMap[extension] || 'unknown';
  }

  /**
   * Helper method to get file extension
   */
  private getFileExtension(filename: string): string {
    return filename.split('.').pop() || '';
  }

  /**
   * Helper method to get MIME type from filename
   */
  private getMimeType(filename: string): string {
    const extension = this.getFileExtension(filename).toLowerCase();
    
    // Map extensions to MIME types
    const mimeMap: Record<string, string> = {
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'md': 'text/markdown',
      'pdf': 'application/pdf',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'csv': 'text/csv',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      'tar': 'application/x-tar',
      'gz': 'application/gzip',
      'js': 'application/javascript',
      'ts': 'application/typescript',
      'py': 'text/x-python',
      'java': 'text/x-java',
      'c': 'text/x-c',
      'cpp': 'text/x-c++',
      'cs': 'text/x-csharp',
      'html': 'text/html',
      'css': 'text/css',
      'php': 'application/x-php',
      'rb': 'application/x-ruby',
      'go': 'text/x-go',
      'rs': 'text/x-rust',
      'swift': 'text/x-swift'
    };
    
    return mimeMap[extension] || 'application/octet-stream';
  }

  /**
   * Generate mock data for testing
   */
  private async generateMockData(): Promise<void> {
    const userId = this.getCurrentUserId();
    const now = new Date().toISOString();
    
    // First set initialized to true to prevent recursion when creating folders
    this.initialized = true;
    
    // Create mock folders
    const myDriveId = uuidv4();
    const sharedWithMeId = uuidv4();
    const trashId = uuidv4();
    const documentsId = uuidv4();
    const imagesId = uuidv4();
    const projectsId = uuidv4();
    
    // Root folders
    const myDrive: GenieDriveFolder = {
      id: myDriveId,
      name: 'My Drive',
      type: 'folder',
      parentId: null,
      path: ['My Drive'],
      childrenCount: 3, // Documents, Images, Projects
      permissions: {
        canView: [userId],
        canEdit: [userId],
        canDelete: [userId],
        isPublic: false
      },
      metadata: {
        creator: userId,
        createdAt: now,
        lastModifiedBy: userId,
        lastModifiedAt: now,
        size: 0,
        mimeType: 'application/folder',
        starred: false,
        tags: []
      }
    };
    
    const sharedWithMe: GenieDriveFolder = {
      id: sharedWithMeId,
      name: 'Shared with me',
      type: 'folder',
      parentId: null,
      path: ['Shared with me'],
      childrenCount: 0,
      permissions: {
        canView: [userId],
        canEdit: [userId],
        canDelete: [userId],
        isPublic: false
      },
      metadata: {
        creator: userId,
        createdAt: now,
        lastModifiedBy: userId,
        lastModifiedAt: now,
        size: 0,
        mimeType: 'application/folder',
        starred: false,
        tags: []
      }
    };
    
    const trash: GenieDriveFolder = {
      id: trashId,
      name: 'Trash',
      type: 'folder',
      parentId: null,
      path: ['Trash'],
      childrenCount: 0,
      permissions: {
        canView: [userId],
        canEdit: [userId],
        canDelete: [userId],
        isPublic: false
      },
      metadata: {
        creator: userId,
        createdAt: now,
        lastModifiedBy: userId,
        lastModifiedAt: now,
        size: 0,
        mimeType: 'application/folder',
        starred: false,
        tags: []
      }
    };
    
    // Subfolders
    const documents: GenieDriveFolder = {
      id: documentsId,
      name: 'Documents',
      type: 'folder',
      parentId: myDriveId,
      path: ['My Drive', 'Documents'],
      childrenCount: 3, // 3 document files
      permissions: {
        canView: [userId],
        canEdit: [userId],
        canDelete: [userId],
        isPublic: false
      },
      metadata: {
        creator: userId,
        createdAt: now,
        lastModifiedBy: userId,
        lastModifiedAt: now,
        size: 0,
        mimeType: 'application/folder',
        starred: false,
        tags: []
      }
    };
    
    const images: GenieDriveFolder = {
      id: imagesId,
      name: 'Images',
      type: 'folder',
      parentId: myDriveId,
      path: ['My Drive', 'Images'],
      childrenCount: 1, // 1 image file
      permissions: {
        canView: [userId],
        canEdit: [userId],
        canDelete: [userId],
        isPublic: false
      },
      metadata: {
        creator: userId,
        createdAt: now,
        lastModifiedBy: userId,
        lastModifiedAt: now,
        size: 0,
        mimeType: 'application/folder',
        starred: false,
        tags: []
      }
    };
    
    const projects: GenieDriveFolder = {
      id: projectsId,
      name: 'Projects',
      type: 'folder',
      parentId: myDriveId,
      path: ['My Drive', 'Projects'],
      childrenCount: 1, // 1 code file
      permissions: {
        canView: [userId],
        canEdit: [userId],
        canDelete: [userId],
        isPublic: false
      },
      metadata: {
        creator: userId,
        createdAt: now,
        lastModifiedBy: userId,
        lastModifiedAt: now,
        size: 0,
        mimeType: 'application/folder',
        starred: false,
        tags: []
      }
    };
    
    // Add folders to mockData
    this.mockData.set(myDriveId, myDrive);
    this.mockData.set(sharedWithMeId, sharedWithMe);
    this.mockData.set(trashId, trash);
    this.mockData.set(documentsId, documents);
    this.mockData.set(imagesId, images);
    this.mockData.set(projectsId, projects);
    
    // Continue with file creation as before
    const mockFile1: GenieDriveFile = {
      id: uuidv4(),
      name: 'Project Proposal.docx',
      type: 'document',
      parentId: documentsId,
      path: ['My Drive', 'Documents'],
      extension: 'docx',
      version: 1,
      permissions: {
        canView: [userId],
        canEdit: [userId],
        canDelete: [userId],
        isPublic: false
      },
      metadata: {
        creator: userId,
        createdAt: now,
        lastModifiedBy: userId,
        lastModifiedAt: now,
        size: 125000,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        starred: true,
        tags: ['work', 'proposal']
      }
    };
    
    const mockFile2: GenieDriveFile = {
      id: uuidv4(),
      name: 'Budget 2023.xlsx',
      type: 'spreadsheet',
      parentId: documentsId,
      path: ['My Drive', 'Documents'],
      extension: 'xlsx',
      version: 1,
      permissions: {
        canView: [userId, 'team@example.com'],
        canEdit: [userId],
        canDelete: [userId],
        isPublic: false
      },
      metadata: {
        creator: userId,
        createdAt: now,
        lastModifiedBy: userId,
        lastModifiedAt: now,
        size: 250000,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        starred: false,
        tags: ['finance', '2023']
      }
    };
    
    const mockFile3: GenieDriveFile = {
      id: uuidv4(),
      name: 'Presentation.pptx',
      type: 'presentation',
      parentId: documentsId,
      path: ['My Drive', 'Documents'],
      extension: 'pptx',
      version: 1,
      permissions: {
        canView: [userId],
        canEdit: [userId],
        canDelete: [userId],
        isPublic: false
      },
      metadata: {
        creator: userId,
        createdAt: now,
        lastModifiedBy: userId,
        lastModifiedAt: now,
        size: 3500000,
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        starred: false,
        tags: ['presentation', 'client']
      }
    };
    
    const mockImage: GenieDriveFile = {
      id: uuidv4(),
      name: 'Logo.png',
      type: 'image',
      parentId: imagesId,
      path: ['My Drive', 'Images'],
      extension: 'png',
      version: 1,
      permissions: {
        canView: [userId],
        canEdit: [userId],
        canDelete: [userId],
        isPublic: true
      },
      metadata: {
        creator: userId,
        createdAt: now,
        lastModifiedBy: userId,
        lastModifiedAt: now,
        size: 85000,
        mimeType: 'image/png',
        starred: true,
        tags: ['brand', 'logo']
      },
      previewUrl: 'https://via.placeholder.com/200x200?text=Logo'
    };
    
    const mockCode: GenieDriveFile = {
      id: uuidv4(),
      name: 'app.js',
      type: 'code',
      parentId: projectsId,
      path: ['My Drive', 'Projects'],
      extension: 'js',
      version: 1,
      permissions: {
        canView: [userId, 'dev@example.com'],
        canEdit: [userId, 'dev@example.com'],
        canDelete: [userId],
        isPublic: false
      },
      metadata: {
        creator: userId,
        createdAt: now,
        lastModifiedBy: userId,
        lastModifiedAt: now,
        size: 15000,
        mimeType: 'application/javascript',
        starred: false,
        tags: ['code', 'javascript']
      }
    };
    
    // Add files
    this.mockData.set(mockFile1.id, mockFile1);
    this.mockData.set(mockFile2.id, mockFile2);
    this.mockData.set(mockFile3.id, mockFile3);
    this.mockData.set(mockImage.id, mockImage);
    this.mockData.set(mockCode.id, mockCode);
    
    // Update folder counts
    documents.childrenCount = 3;
    images.childrenCount = 1;
    projects.childrenCount = 1;
    myDrive.childrenCount = 3;
    
    this.mockData.set(documentsId, documents);
    this.mockData.set(imagesId, images);
    this.mockData.set(projectsId, projects);
    this.mockData.set(myDriveId, myDrive);
  }
}

// Export a singleton instance
export const genieDriveService = GenieDriveServiceImpl.getInstance(); 