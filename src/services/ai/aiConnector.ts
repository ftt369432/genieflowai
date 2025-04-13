import { AIService } from './baseAIService';
import { useAssistantStore } from '../../store/assistantStore';
import { useTaskStore } from '../../store/taskStore';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { TaskService } from '../TaskService';
import { EmailService } from '../EmailService';
import { chatWithDocuments, chatWithAssistant } from '../documentChatService';
import { AIDocument, AIAssistant, Message } from '../../types/ai';
import { Task } from '../../types/task';
import { Email, EmailDraft } from '../../types/email';

/**
 * AIConnector provides a central integration point for all AI services
 * in the application, connecting tasks, emails, knowledge base, and assistants.
 */
export class AIConnector {
  private static instance: AIConnector;
  private aiService: AIService;
  private taskService: TaskService;
  private emailService: EmailService;
  
  private constructor(aiService: AIService) {
    this.aiService = aiService;
    this.taskService = new TaskService(aiService);
    this.emailService = new EmailService(aiService);
  }
  
  public static getInstance(aiService: AIService): AIConnector {
    if (!AIConnector.instance) {
      AIConnector.instance = new AIConnector(aiService);
    }
    return AIConnector.instance;
  }
  
  /**
   * Email-related AI functions
   */
  
  public async analyzeEmail(email: Email) {
    return this.emailService.analyzeEmail(email);
  }
  
  public async draftEmailResponse(email: Email, context?: Record<string, any>) {
    return this.emailService.draftResponse(email, context);
  }
  
  public async categorizeEmail(email: Email) {
    return this.emailService.categorizeEmail(email);
  }
  
  public async extractTasksFromEmail(email: Email): Promise<Task[]> {
    const prompt = `
      Extract tasks from the following email:
      Subject: ${email.subject}
      Content: ${email.content || email.body || ''}
      
      For each task, provide:
      1. Title
      2. Priority (high, medium, or low)
      3. Due date (if mentioned)
      4. Description
      
      Format as JSON array of task objects.
    `;
    
    try {
      const result = await this.aiService.getCompletion(prompt);
      const tasks = JSON.parse(result);
      
      return tasks.map((task: any) => ({
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: task.title,
        description: task.description || '',
        status: 'todo',
        priority: task.priority?.toLowerCase() === 'high' 
          ? 'high'
          : task.priority?.toLowerCase() === 'low'
          ? 'low'
          : 'medium',
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        createdAt: new Date().toISOString(),
        completed: false,
        tags: ['email']
      }));
    } catch (error) {
      console.error('Error extracting tasks from email:', error);
      return [];
    }
  }
  
  /**
   * Task-related AI functions
   */
  
  public async enhanceTask(task: Task): Promise<Task> {
    return this.taskService.enhanceTask(task);
  }
  
  public async estimateTaskDuration(taskDescription: string): Promise<number> {
    return this.taskService.estimateDuration(taskDescription);
  }
  
  public async optimizeTaskSchedule(tasks: Task[]): Promise<Task[]> {
    return this.taskService.suggestSchedule(tasks);
  }
  
  /**
   * Knowledge Base AI functions
   */
  
  public async searchKnowledgeBase(query: string, assistantId?: string) {
    if (assistantId) {
      // Search within a specific assistant's knowledge base
      return this.searchAssistantKnowledge(assistantId, query);
    }
    
    // General knowledge base search
    const store = useKnowledgeBaseStore.getState();
    const documents = store.documents;
    
    // Generate embedding for the query
    // This would typically call an embedding service
    const queryEmbedding = await this.generateQueryEmbedding(query);
    
    // Find relevant documents (simplified semantic search)
    const results = documents
      .filter(doc => 
        (doc.name?.toLowerCase().includes(query.toLowerCase()) || false) ||
        doc.content.toLowerCase().includes(query.toLowerCase())
      )
      .map(doc => ({
        document: doc,
        similarity: this.calculateCosineSimilarity(queryEmbedding, doc.embedding || [])
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);
    
    return results;
  }
  
  public async generateQueryEmbedding(query: string): Promise<number[]> {
    // Mock implementation - in a real app, this would call an embedding API
    return new Array(384).fill(0).map(() => Math.random());
  }
  
  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    // Simple cosine similarity implementation
    if (vec1.length !== vec2.length) return 0;
    
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }
    
    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);
    
    return dotProduct / (mag1 * mag2);
  }
  
  /**
   * Assistant-related AI functions
   */
  
  public async searchAssistantKnowledge(assistantId: string, query: string) {
    const assistantStore = useAssistantStore.getState();
    const knowledgeBaseStore = useKnowledgeBaseStore.getState();
    
    const assistant = assistantStore.getAssistantById(assistantId);
    if (!assistant || !assistant.knowledgeBase || assistant.knowledgeBase.length === 0) {
      return [];
    }
    
    // Get folder IDs assigned to this assistant
    const folderIds = assistant.knowledgeBase.map(folder => folder.id);
    
    // Filter documents to only include those in the assistant's folders
    const assistantDocuments = knowledgeBaseStore.documents.filter(doc => 
      doc.folderId && folderIds.includes(doc.folderId)
    );
    
    // Generate embedding for the query
    const queryEmbedding = await this.generateQueryEmbedding(query);
    
    // Find relevant documents (simplified semantic search)
    const results = assistantDocuments
      .map(doc => ({
        document: doc,
        similarity: this.calculateCosineSimilarity(queryEmbedding, doc.embedding || [])
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);
    
    return results;
  }
  
  public async chatWithKnowledgeBase(query: string, documents: AIDocument[], history: Message[] = []) {
    return chatWithDocuments(query, documents, history);
  }
  
  public async chatWithAssistantKnowledge(assistantId: string, query: string, history: Message[] = []) {
    return chatWithAssistant(assistantId, query, history);
  }
  
  /**
   * Cross-functional AI utility functions
   */
  
  public async convertTaskToEmail(task: Task): Promise<EmailDraft> {
    const prompt = `
      Convert this task to an email:
      Title: ${task.title}
      Description: ${task.description || ''}
      Priority: ${task.priority}
      Due Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not specified'}
      
      Create a professional email that effectively communicates this task to a team member.
      Include the task details, deadline, and any context provided in the description.
    `;
    
    try {
      const emailContent = await this.aiService.getCompletion(prompt);
      const now = new Date();
      
      return {
        id: `email-${Date.now()}`,
        subject: `Task: ${task.title}`,
        to: [],
        body: emailContent,
        savedAt: now,
        lastEditedAt: now
      };
    } catch (error) {
      console.error('Error converting task to email:', error);
      const now = new Date();
      
      return {
        id: `email-${Date.now()}`,
        subject: `Task: ${task.title}`,
        to: [],
        body: `I need to share a task with you:\n\n${task.title}\n\n${task.description || ''}\n\nPriority: ${task.priority}\nDue Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not specified'}`,
        savedAt: now,
        lastEditedAt: now
      };
    }
  }
  
  public async suggestRelatedContent(query: string) {
    // Search across different data sources
    const knowledgeBaseStore = useKnowledgeBaseStore.getState();
    const taskStore = useTaskStore.getState();
    
    // Get documents that might be relevant
    const documents = knowledgeBaseStore.documents.filter(doc => 
      (doc.name?.toLowerCase().includes(query.toLowerCase()) || false) ||
      doc.content.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 3);
    
    // Get tasks that might be relevant
    const tasks = taskStore.tasks.filter(task => 
      task.title.toLowerCase().includes(query.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 3);
    
    return {
      documents,
      tasks
    };
  }
}

export default AIConnector; 