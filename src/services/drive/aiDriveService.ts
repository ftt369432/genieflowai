import { SupabaseClient } from '@supabase/supabase-js';
import { getEmbedding } from '../embeddingService';
import { v4 as uuidv4 } from 'uuid';
import { AIService } from '../ai/aiService';
import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';
import { documentProcessingService } from '../documents/documentProcessingService';

// Initialize PDF.js worker
// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
if (typeof window !== 'undefined') { // Ensure this runs only in the browser
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

// Types
export interface AIDriveFile {
  id?: string;
  user_id?: string;
  name: string;
  mime_type: string;
  size: number;
  parent_id?: string | null;
  is_folder: boolean;
  is_starred?: boolean;
  is_trashed?: boolean;
  storage_path?: string;
  embedding?: number[];
  content_preview?: string;
  thumbnail_url?: string;
  ai_summary?: string;
  ai_topics?: string[];
  ai_entities?: Record<string, any>;
  metadata?: Record<string, any>;
  last_viewed_at?: string;
  shared_with?: string[];
  permissions?: Record<string, any>;
  version?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FileVersion {
  id?: string;
  file_id: string;
  user_id?: string;
  version_number: number;
  storage_path: string;
  size: number;
  created_at?: string;
  comment?: string;
}

export interface FileShare {
  id?: string;
  file_id: string;
  owner_id?: string;
  shared_with?: string;
  shared_email?: string;
  permission_level: 'viewer' | 'editor' | 'owner';
  share_link?: string;
  is_link_sharing?: boolean;
  link_expiry?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FileLabel {
  id?: string;
  user_id?: string;
  name: string;
  color?: string;
  created_at?: string;
}

export interface FileComment {
  id?: string;
  file_id: string;
  user_id?: string;
  content: string;
  parent_comment_id?: string;
  created_at?: string;
  updated_at?: string;
  is_resolved?: boolean;
}

export interface SmartCollection {
  id?: string;
  user_id?: string;
  name: string;
  query: Record<string, any>;
  icon?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FileInsight {
  id?: string;
  file_id: string;
  type: 'summary' | 'key_points' | 'sentiment' | 'entities' | 'topics' | 'questions';
  content: Record<string, any>;
  created_at?: string;
}

export interface FileSearchOptions {
  query?: string;
  parent_id?: string | null;
  include_trashed?: boolean;
  is_starred?: boolean;
  mime_types?: string[];
  labels?: string[];
  created_after?: string;
  created_before?: string;
  updated_after?: string;
  updated_before?: string;
  sort_by?: 'name' | 'created_at' | 'updated_at' | 'size';
  sort_direction?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface FileSummaryOptions {
  maxLength?: number;
  includeKeyPoints?: boolean;
  includeTopic?: boolean;
  includeEntities?: boolean;
}

export class AIDriveService {
  private supabase: SupabaseClient;
  private aiService: AIService;
  
  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
    this.aiService = new AIService();
  }
  
  // File management operations
  async listFiles(
    userId: string, 
    parentId: string | null = null, 
    options: Partial<FileSearchOptions> = {}
  ): Promise<AIDriveFile[]> {
    try {
      let query = this.supabase
        .from('ai_drive_files')
        .select('*')
        .eq('user_id', userId)
        .eq('is_trashed', options.include_trashed || false);
      
      // Filter by parent folder
      if (parentId === null) {
        query = query.is('parent_id', null);
      } else {
        query = query.eq('parent_id', parentId);
      }
      
      // Apply additional filters
      if (options.is_starred) {
        query = query.eq('is_starred', true);
      }
      
      if (options.mime_types && options.mime_types.length > 0) {
        query = query.in('mime_type', options.mime_types);
      }
      
      // Apply sorting
      const sortBy = options.sort_by || 'name';
      const sortDirection = options.sort_direction || 'asc';
      query = query.order(sortBy, { ascending: sortDirection === 'asc' });
      
      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
      }
      
      const { data, error } = await query;
      
      if (error) throw new Error(error.message);
      return data || [];
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }
  
  async getFile(fileId: string): Promise<AIDriveFile> {
    const { data, error } = await this.supabase
      .from('ai_drive_files')
      .select('*')
      .eq('id', fileId)
      .single();
    
    if (error) throw new Error(error.message);
    
    // Update last viewed timestamp
    await this.supabase
      .from('ai_drive_files')
      .update({ last_viewed_at: new Date().toISOString() })
      .eq('id', fileId);
      
    return data;
  }
  
  async createFolder(
    userId: string, 
    name: string, 
    parentId: string | null = null
  ): Promise<AIDriveFile> {
    const folder: AIDriveFile = {
      name,
      mime_type: 'application/x-directory',
      size: 0,
      parent_id: parentId,
      is_folder: true,
      user_id: userId
    };
    
    const { data, error } = await this.supabase
      .from('ai_drive_files')
      .insert(folder)
      .select();
    
    if (error) throw new Error(error.message);
    return data[0];
  }
  
  async uploadFile(
    userId: string,
    file: File,
    parentId: string | null = null,
    progressCallback?: (progress: number) => void
  ): Promise<AIDriveFile> {
    try {
      // Generate unique storage path
      const fileExt = file.name.split('.').pop();
      const storagePath = `${userId}/${uuidv4()}.${fileExt}`;
      
      // Upload to storage
      const { data: storageData, error: storageError } = await this.supabase.storage
        .from('ai-drive')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
          // onUploadProgress: (event: { loadedBytes: number; totalBytes?: number }) => {
          //   if (progressCallback && event.totalBytes) {
          //     progressCallback((event.loadedBytes / event.totalBytes) * 50); // First 50% is upload
          //   }
          // }
        });
      
      if (storageError) throw storageError;
      
      // Extract text for generating embedding and preview
      const { text, preview } = await this.extractFileContent(file);
      
      // Create file record
      const newFile: AIDriveFile = {
        name: file.name,
        mime_type: file.type || this.guessMimeType(file.name),
        size: file.size,
        parent_id: parentId,
        is_folder: false,
        storage_path: storagePath,
        user_id: userId,
        content_preview: preview
      };
      
      const { data, error } = await this.supabase
        .from('ai_drive_files')
        .insert(newFile)
        .select();
      
      if (error) throw error;
      
      const createdFile = data[0];
      
      // Start AI processing in the background
      this.processFileWithAI(createdFile.id!, text, progressCallback);
      
      return createdFile;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
  
  async updateFile(
    fileId: string,
    updates: Partial<AIDriveFile>
  ): Promise<AIDriveFile> {
    const { data, error } = await this.supabase
      .from('ai_drive_files')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', fileId)
      .select();
    
    if (error) throw new Error(error.message);
    return data[0];
  }
  
  async moveFile(
    fileId: string,
    newParentId: string | null
  ): Promise<AIDriveFile> {
    return this.updateFile(fileId, { parent_id: newParentId });
  }
  
  async starFile(fileId: string, isStarred: boolean): Promise<AIDriveFile> {
    return this.updateFile(fileId, { is_starred: isStarred });
  }
  
  async trashFile(fileId: string, isTrashed: boolean): Promise<AIDriveFile> {
    return this.updateFile(fileId, { is_trashed: isTrashed });
  }
  
  async deleteFile(fileId: string): Promise<void> {
    // Get file info first
    const file = await this.getFile(fileId);
    
    // Delete from storage if it has a storage path
    if (file.storage_path) {
      const { error: storageError } = await this.supabase.storage
        .from('ai-drive')
        .remove([file.storage_path]);
      
      if (storageError) throw storageError;
    }
    
    // Delete file record
    const { error } = await this.supabase
      .from('ai_drive_files')
      .delete()
      .eq('id', fileId);
    
    if (error) throw new Error(error.message);
  }
  
  async downloadFile(fileId: string): Promise<string> {
    const file = await this.getFile(fileId);
    
    if (!file.storage_path) {
      throw new Error('File has no storage path');
    }
    
    const { data, error } = await this.supabase.storage
      .from('ai-drive')
      .createSignedUrl(file.storage_path, 60 * 60); // 1 hour expiry
    
    if (error) throw error;
    return data.signedUrl;
  }
  
  // AI operations
  private async processFileWithAI(
    fileId: string,
    text: string,
    progressCallback?: (progress: number) => void
  ): Promise<void> {
    try {
      if (!text || text.length < 10) return;
      
      // Generate embedding
      if (progressCallback) progressCallback(60);
      const embedding = await getEmbedding(text);
      
      // Generate AI summary and topics
      if (progressCallback) progressCallback(70);
      
      // Default prompt for summarization
      const summaryPrompt = `
      Summarize the following text in 3-4 sentences. Be concise and informative.
      
      ${text.substring(0, 10000)}
      `;
      
      const topicsPrompt = `
      List the 5-7 main topics or key concepts covered in this text. Return them as an array format.
      
      ${text.substring(0, 10000)}
      `;
      
      // Use AI service to generate summary and topics
      const [summary, topicsString] = await Promise.all([
        this.aiService.generateText(summaryPrompt),
        this.aiService.generateText(topicsPrompt)
      ]);
      
      if (progressCallback) progressCallback(90);
      
      // Parse topics as array or fallback to empty array
      let topics: string[] = [];
      try {
        // Remove array notation if present and split by commas
        const cleaned = topicsString.replace(/[\[\]"']/g, '');
        topics = cleaned.split(',').map(t => t.trim()).filter(Boolean);
      } catch (e) {
        console.error('Error parsing topics:', e);
      }
      
      // Update the file with AI results
      await this.supabase
        .from('ai_drive_files')
        .update({
          embedding,
          ai_summary: summary,
          ai_topics: topics,
          updated_at: new Date().toISOString()
        })
        .eq('id', fileId);
      
      if (progressCallback) progressCallback(100);
    } catch (error) {
      console.error('Error processing file with AI:', error);
    }
  }
  
  async generateFileSummary(fileId: string, options?: FileSummaryOptions): Promise<string> {
    const file = await this.getFile(fileId);
    
    // If summary exists, return it
    if (file.ai_summary) {
      return file.ai_summary;
    }
    
    // Get file content
    const { data, error } = await this.supabase.storage
      .from('ai-drive')
      .download(file.storage_path!);
    
    if (error) throw error;
    
    // Extract text
    const fileBlob = new Blob([data]);
    const fileObj = new File([fileBlob], file.name, { type: file.mime_type });
    const { text } = await this.extractFileContent(fileObj);
    
    // Generate summary
    const prompt = `
    Summarize the following document in a concise way:
    ${text.substring(0, 10000)}
    
    ${options?.includeKeyPoints ? 'Include 3-5 key points.' : ''}
    ${options?.includeTopic ? 'Mention the main topics.' : ''}
    ${options?.includeEntities ? 'Mention important entities like people, organizations, or locations.' : ''}
    `;
    
    const summary = await this.aiService.generateText(prompt);
    
    // Save the summary
    await this.updateFile(fileId, { ai_summary: summary });
    
    return summary;
  }
  
  async askDocumentQuestion(fileId: string, question: string): Promise<string> {
    const file = await this.getFile(fileId);
    
    // Get file content if needed
    let fileContent: string;
    
    if (file.mime_type.startsWith('image/')) {
      // For images, try to get OCR text on demand
      fileContent = await this.getOcrTextForFile(fileId);
      if (!fileContent) {
        // Fallback or if OCR failed
        return 'Could not extract text from image to answer the question.';
      }
    } else if (file.content_preview && file.content_preview.length > 1000 && !file.content_preview.startsWith('Image file - OCR')) {
      fileContent = file.content_preview;
    } else {
      const { data, error } = await this.supabase.storage
        .from('ai-drive')
        .download(file.storage_path!);
      
      if (error) throw error;
      
      const fileBlob = new Blob([data]);
      const fileObj = new File([fileBlob], file.name, { type: file.mime_type });
      // Use extractFileContent to get text, which respects no-OCR-on-upload for images
      // but for other types it should give us the actual text.
      const { text } = await this.extractFileContent(fileObj);
      fileContent = text;
      if (file.mime_type.startsWith('image/') && !fileContent) { // Double check for images if text is empty
        fileContent = await this.getOcrTextForFile(fileId);
        if (!fileContent) {
          return 'Could not extract text from image to answer the question.';
        }
      }
    }
    
    // Create prompt
    const prompt = `
    Use the following document to answer the question.
    Document: ${fileContent.substring(0, 10000)}
    
    Question: ${question}
    
    If the answer cannot be found in the document, say so clearly. Provide specific information from the document to support your answer.
    `;
    
    return this.aiService.generateText(prompt);
  }
  
  async searchFiles(userId: string, query: string): Promise<AIDriveFile[]> {
    try {
      if (!query.trim()) {
        throw new Error('Search query is required');
      }
      
      // Generate embedding for semantic search
      const embedding = await getEmbedding(query);
      
      // Use vector search function
      const { data, error } = await this.supabase.rpc(
        'search_ai_drive_files',
        {
          query_embedding: embedding,
          match_threshold: 0.5,
          match_count: 20,
          user_id_input: userId
        }
      );
      
      if (error) throw error;
      
      // Fallback to text search if no semantic results or if query is very short
      if (!data || data.length === 0 || query.length < 3) {
        const { data: textResults, error: textError } = await this.supabase
          .from('ai_drive_files')
          .select('*')
          .eq('user_id', userId)
          .eq('is_trashed', false)
          .or(`name.ilike.%${query}%,content_preview.ilike.%${query}%`)
          .limit(20);
        
        if (textError) throw textError;
        return textResults || [];
      }
      
      return data;
    } catch (error) {
      console.error('Error searching files:', error);
      throw error;
    }
  }
  
  // Version history operations
  async createVersion(
    fileId: string,
    userId: string,
    file: File,
    comment?: string
  ): Promise<FileVersion> {
    try {
      // Get current file info
      const currentFile = await this.getFile(fileId);
      const newVersion = (currentFile.version || 1) + 1;
      
      // Upload new version to storage
      const fileExt = file.name.split('.').pop();
      const storagePath = `${userId}/${fileId}_v${newVersion}.${fileExt}`;
      
      const { error: storageError } = await this.supabase.storage
        .from('ai-drive')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (storageError) throw storageError;
      
      // Create version record
      const versionRecord: FileVersion = {
        file_id: fileId,
        user_id: userId,
        version_number: newVersion,
        storage_path: storagePath,
        size: file.size,
        comment
      };
      
      const { data, error } = await this.supabase
        .from('ai_drive_file_versions')
        .insert(versionRecord)
        .select();
      
      if (error) throw error;
      
      // Extract text for generating embedding and preview
      const { text, preview } = await this.extractFileContent(file);
      
      // Update current file
      await this.updateFile(fileId, {
        storage_path: storagePath,
        size: file.size,
        version: newVersion,
        content_preview: preview,
        updated_at: new Date().toISOString()
      });
      
      // Process with AI in background
      this.processFileWithAI(fileId, text);
      
      return data[0];
    } catch (error) {
      console.error('Error creating version:', error);
      throw error;
    }
  }
  
  async listVersions(fileId: string): Promise<FileVersion[]> {
    const { data, error } = await this.supabase
      .from('ai_drive_file_versions')
      .select('*')
      .eq('file_id', fileId)
      .order('version_number', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  async restoreVersion(fileId: string, versionId: string): Promise<AIDriveFile> {
    try {
      // Get version info
      const { data: versionData, error: versionError } = await this.supabase
        .from('ai_drive_file_versions')
        .select('*')
        .eq('id', versionId)
        .single();
      
      if (versionError) throw versionError;
      
      // Update current file to use this version's storage path
      return this.updateFile(fileId, {
        storage_path: versionData.storage_path,
        version: versionData.version_number,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error restoring version:', error);
      throw error;
    }
  }
  
  // Sharing operations
  async shareFile(
    fileId: string,
    ownerId: string,
    options: {
      sharedWith?: string;
      sharedEmail?: string;
      permissionLevel?: 'viewer' | 'editor' | 'owner';
      isLinkSharing?: boolean;
      linkExpiry?: Date;
    }
  ): Promise<FileShare> {
    const shareRecord: FileShare = {
      file_id: fileId,
      owner_id: ownerId,
      shared_with: options.sharedWith,
      shared_email: options.sharedEmail,
      permission_level: options.permissionLevel || 'viewer',
      is_link_sharing: options.isLinkSharing || false,
      link_expiry: options.linkExpiry?.toISOString()
    };
    
    // Generate a sharing link if needed
    if (options.isLinkSharing) {
      shareRecord.share_link = `${window.location.origin}/share/${fileId}/${uuidv4()}`;
    }
    
    const { data, error } = await this.supabase
      .from('ai_drive_sharing')
      .insert(shareRecord)
      .select();
    
    if (error) throw error;
    
    // Update the shared_with array on the file
    if (options.sharedWith) {
      const currentFile = await this.getFile(fileId);
      const currentSharedWith = currentFile.shared_with || [];
      if (!currentSharedWith.includes(options.sharedWith)) {
        await this.updateFile(fileId, {
          shared_with: [...currentSharedWith, options.sharedWith]
        });
      }
    }
    
    return data[0];
  }
  
  async listSharedFiles(userId: string): Promise<AIDriveFile[]> {
    const { data, error } = await this.supabase
      .from('ai_drive_sharing')
      .select(`
        *,
        file:ai_drive_files(*)
      `)
      .eq('shared_with', userId);
    
    if (error) throw error;
    
    // Extract the file objects from the results
    return data.map((item: { file: AIDriveFile }) => item.file);
  }
  
  async getFileShareSettings(fileId: string): Promise<FileShare[]> {
    const { data, error } = await this.supabase
      .from('ai_drive_sharing')
      .select('*')
      .eq('file_id', fileId);
    
    if (error) throw error;
    return data || [];
  }
  
  async removeSharing(shareId: string): Promise<void> {
    // Get sharing record first to update shared_with on file
    const { data: shareData } = await this.supabase
      .from('ai_drive_sharing')
      .select('*')
      .eq('id', shareId)
      .single();
    
    if (shareData?.shared_with) {
      const fileId = shareData.file_id;
      const userToRemove = shareData.shared_with;
      
      // Get current file
      const currentFile = await this.getFile(fileId);
      const currentSharedWith = currentFile.shared_with || [];
      
      // Remove user from shared_with array
      await this.updateFile(fileId, {
        shared_with: currentSharedWith.filter(id => id !== userToRemove)
      });
    }
    
    // Delete the sharing record
    const { error } = await this.supabase
      .from('ai_drive_sharing')
      .delete()
      .eq('id', shareId);
    
    if (error) throw error;
  }
  
  // Label operations
  async createLabel(userId: string, name: string, color?: string): Promise<FileLabel> {
    const labelRecord: FileLabel = {
      user_id: userId,
      name,
      color
    };
    
    const { data, error } = await this.supabase
      .from('ai_drive_labels')
      .insert(labelRecord)
      .select();
    
    if (error) throw error;
    return data[0];
  }
  
  async listLabels(userId: string): Promise<FileLabel[]> {
    const { data, error } = await this.supabase
      .from('ai_drive_labels')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  }
  
  async addLabelToFile(fileId: string, labelId: string): Promise<void> {
    const { error } = await this.supabase
      .from('ai_drive_file_labels')
      .insert({ file_id: fileId, label_id: labelId });
    
    if (error) throw error;
  }
  
  async removeLabelFromFile(fileId: string, labelId: string): Promise<void> {
    const { error } = await this.supabase
      .from('ai_drive_file_labels')
      .delete()
      .eq('file_id', fileId)
      .eq('label_id', labelId);
    
    if (error) throw error;
  }
  
  async getFileLabels(fileId: string): Promise<FileLabel[]> {
    const { data, error } = await this.supabase
      .from('ai_drive_file_labels')
      .select(`
        label_id,
        label:ai_drive_labels(*)
      `)
      .eq('file_id', fileId);

    if (error) throw error;
    if (!data) return [];

    const labels: FileLabel[] = [];
    for (const item of data) {
      // item.label is expected to be FileLabel[] based on linter error context
      // or it could be null if no related label is found by the join
      if (item.label && Array.isArray(item.label) && item.label.length > 0) {
        // Assuming the actual label object is the first element of the array
        labels.push(item.label[0] as FileLabel); 
      } else if (item.label && !Array.isArray(item.label)) {
        // Fallback: if item.label is an object (not an array as error suggested), cast and push
        labels.push(item.label as FileLabel);
      }
    }
    return labels;
  }
  
  // Comments operations
  async addComment(
    fileId: string,
    userId: string,
    content: string,
    parentCommentId?: string
  ): Promise<FileComment> {
    const commentRecord: FileComment = {
      file_id: fileId,
      user_id: userId,
      content,
      parent_comment_id: parentCommentId
    };
    
    const { data, error } = await this.supabase
      .from('ai_drive_comments')
      .insert(commentRecord)
      .select();
    
    if (error) throw error;
    return data[0];
  }
  
  async getComments(fileId: string): Promise<FileComment[]> {
    const { data, error } = await this.supabase
      .from('ai_drive_comments')
      .select('*')
      .eq('file_id', fileId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
  
  // Smart collections
  async createSmartCollection(
    userId: string,
    name: string,
    query: Record<string, any>,
    icon?: string
  ): Promise<SmartCollection> {
    const collection: SmartCollection = {
      user_id: userId,
      name,
      query,
      icon
    };
    
    const { data, error } = await this.supabase
      .from('ai_drive_smart_collections')
      .insert(collection)
      .select();
    
    if (error) throw error;
    return data[0];
  }
  
  async listSmartCollections(userId: string): Promise<SmartCollection[]> {
    const { data, error } = await this.supabase
      .from('ai_drive_smart_collections')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  }
  
  async executeSmartCollection(collectionId: string): Promise<AIDriveFile[]> {
    // Get collection query
    const { data: collection, error: collectionError } = await this.supabase
      .from('ai_drive_smart_collections')
      .select('*')
      .eq('id', collectionId)
      .single();
    
    if (collectionError) throw collectionError;
    
    // Execute the query
    let baseQuery = this.supabase
      .from('ai_drive_files')
      .select('*')
      .eq('user_id', collection.user_id)
      .eq('is_trashed', false);
    
    const query = collection.query;
    
    // Apply filters from the stored query
    if (query.is_starred) {
      baseQuery = baseQuery.eq('is_starred', true);
    }
    
    if (query.mime_types) {
      baseQuery = baseQuery.in('mime_type', query.mime_types);
    }
    
    if (query.created_after) {
      baseQuery = baseQuery.gte('created_at', query.created_after);
    }
    
    if (query.created_before) {
      baseQuery = baseQuery.lte('created_at', query.created_before);
    }
    
    if (query.search_term) {
      baseQuery = baseQuery.or(`name.ilike.%${query.search_term}%,content_preview.ilike.%${query.search_term}%`);
    }
    
    // Apply sorting
    const sortBy = query.sort_by || 'name';
    const sortDirection = query.sort_direction || 'asc';
    baseQuery = baseQuery.order(sortBy, { ascending: sortDirection === 'asc' });
    
    const { data, error } = await baseQuery;
    
    if (error) throw error;
    return data || [];
  }
  
  // File content extraction helpers
  private async extractFileContent(file: File): Promise<{ text: string, preview: string }> {
    try {
      let text = '';
      let preview = '';

      if (file.type.startsWith('image/')) {
        text = ''; // No OCR at initial extraction
        preview = 'Image file - OCR will be performed on demand.';
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        text = await this.extractPdfText(file);
        preview = text.substring(0, 500).trim();
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.name.endsWith('.docx')
      ) {
        text = await this.extractDocxText(file);
        preview = text.substring(0, 500).trim();
      } else if (
        file.type.includes('text/') ||
        file.type === 'application/json' ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.md') ||
        file.name.endsWith('.json')
      ) {
        text = await file.text();
        preview = text.substring(0, 500).trim();
      } else if (
        file.type.includes('spreadsheet') ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls')
      ) {
        text = ''; // No text extraction for spreadsheets for now
        preview = 'Spreadsheet file - content extraction not fully supported.';
      }

      return { text, preview };
    } catch (error) {
      console.error('Error extracting text from file:', error);
      return { text: '', preview: 'Error extracting content.' };
    }
  }
  
  private async extractPdfText(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const typedArray = new Uint8Array(arrayBuffer);
      
      // Load PDF
      const pdf = await pdfjs.getDocument(typedArray).promise;
      let text = '';
      
      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item: any) => item.str);
        text += strings.join(' ') + '\n';
      }
      
      return text;
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      return '';
    }
  }
  
  private async extractDocxText(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      console.error('Error extracting DOCX text:', error);
      return '';
    }
  }
  
  private async extractSpreadsheetText(file: File): Promise<string> {
    // Simplified version that just returns empty string
    // since we've removed the office-text-extractor dependency
    return '';
  }
  
  private guessMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'txt': 'text/plain',
      'html': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'xml': 'application/xml',
      'zip': 'application/zip',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'mp4': 'video/mp4',
      'mp3': 'audio/mpeg'
    };
    
    return extension && extension in mimeTypes 
      ? mimeTypes[extension] 
      : 'application/octet-stream';
  }

  // New method for on-demand OCR
  async getOcrTextForFile(fileId: string): Promise<string> {
    try {
      const fileMetadata = await this.getFile(fileId);

      if (!fileMetadata.mime_type.startsWith('image/')) {
        // Optionally, could attempt direct text extraction for non-images
        // or assume OCR is only for images here.
        // For now, only OCR images.
        // If it's a PDF that might need OCR, that's a more complex scenario.
        // We can try to extract text first, and if it's too short, then OCR.
        if (fileMetadata.mime_type === 'application/pdf') {
          // Attempt direct text extraction first
          const { data: blobData, error: downloadError } = await this.supabase.storage
            .from('ai-drive')
            .download(fileMetadata.storage_path!);
          if (downloadError) throw downloadError;
          const pdfFile = new File([blobData!], fileMetadata.name, { type: fileMetadata.mime_type });
          let pdfText = await this.extractPdfText(pdfFile);
          // If PDF text is very short (e.g. scanned PDF), then attempt OCR
          // This threshold is arbitrary and can be adjusted.
          if (pdfText.length < 100) { 
            console.log(`PDF ${fileId} has short text, attempting OCR as fallback.`);
            // pdfjs itself doesn't do OCR. We need to treat PDF as an image for Tesseract.
            // This requires converting PDF pages to images, which is complex here.
            // For now, we will return the extracted text, or rely on user to upload images for OCR.
            // A proper PDF OCR would involve a library like pdf-to-image then Tesseract.
            // Let's just return the potentially short text for now.
            // Consider adding a specific PDF OCR path if needed later.
            // return await documentProcessingService.extractTextFromImage(pdfFile); // This won't work directly for PDF
            return pdfText; // Returning initially extracted PDF text
          } else {
            return pdfText;
          }
        }
        return ''; // Not an image, and not a PDF needing OCR fallback in this simplified path
      }

      if (!fileMetadata.storage_path) {
        console.error('File has no storage path for OCR:', fileId);
        return '';
      }

      const { data: blobData, error: downloadError } = await this.supabase.storage
        .from('ai-drive')
        .download(fileMetadata.storage_path);

      if (downloadError) {
        console.error('Error downloading file for OCR:', downloadError);
        throw downloadError;
      }

      const imageFile = new File([blobData!], fileMetadata.name, { type: fileMetadata.mime_type });
      const ocrText = await documentProcessingService.extractTextFromImage(imageFile);
      return ocrText;

    } catch (error) {
      console.error(`Error performing OCR for file ${fileId}:`, error);
      return ''; // Return empty string on error
    }
  }
} 