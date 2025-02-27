import { BaseAgent } from './BaseAgent';
import type { AgentConfig } from '../../types/agent';
import { ActionResult } from '../../types/actions';
import { emailService } from '../email';
import type { 
  EmailMessage, 
  EmailFilter, 
  EmailDraft, 
  EmailAnalysis,
  EmailPreferences,
  EmailTemplate,
  EmailCategoryRule
} from '../../types/email';
import { openai } from '../../config/openai';
import { CalendarService } from '../CalendarService';
import { TaskService } from '../TaskService';
import { AIService } from '../ai/baseAIService';
import { geminiService } from '../gemini';
import { TaskPriority, TaskStatus } from '../../types/task';
import { EventType } from '../../types/calendar';

type EmailField = 'from' | 'subject' | 'content';

export class EmailAgent extends BaseAgent {
  private emailService = emailService;
  private calendarService: CalendarService;
  private taskService: TaskService;
  private templates: Map<string, EmailTemplate> = new Map();
  private categoryRules: Map<string, EmailCategoryRule> = new Map();

  constructor(config: AgentConfig) {
    super(config);
    const aiService = geminiService;
    this.taskService = new TaskService(aiService);
    this.calendarService = new CalendarService(this.taskService, aiService);
    this.loadStoredRules();
  }

  private loadStoredRules() {
    const storedTemplates = localStorage.getItem('email_templates');
    if (storedTemplates) {
      const templates = JSON.parse(storedTemplates);
      Object.entries(templates).forEach(([id, template]) => {
        this.templates.set(id, template as EmailTemplate);
      });
    }

    const storedRules = localStorage.getItem('email_category_rules');
    if (storedRules) {
      const rules = JSON.parse(storedRules);
      Object.entries(rules).forEach(([id, rule]) => {
        this.categoryRules.set(id, rule as EmailCategoryRule);
      });
    }
  }

  private saveStoredRules() {
    const templatesObj: Record<string, EmailTemplate> = {};
    this.templates.forEach((template, id) => {
      templatesObj[id] = template;
    });
    localStorage.setItem('email_templates', JSON.stringify(templatesObj));

    const rulesObj: Record<string, EmailCategoryRule> = {};
    this.categoryRules.forEach((rule, id) => {
      rulesObj[id] = rule;
    });
    localStorage.setItem('email_category_rules', JSON.stringify(rulesObj));
  }

  public async processIncomingEmail(email: EmailMessage): Promise<ActionResult> {
    const startTime = Date.now();

    try {
      // Analyze email content and metadata
      const analysis = await this.analyzeEmail(email);
      
      // Apply filters and categorization
      const categorization = await this.categorizeEmail(email, analysis);
      const appliedRules = await this.applyAutomationRules(email, analysis);
      
      // Generate response suggestions if needed
      const suggestions = analysis.requiresResponse ? 
        await this.generateResponseSuggestions(email, analysis) : 
        { output: [], duration: 0 };

      // Check calendar implications
      const calendarActions = await this.processCalendarImplications(email, analysis);

      // Create tasks if needed
      const taskActions = await this.processTaskImplications(email, analysis);

      // Find relevant templates
      const relevantTemplates = await this.findRelevantTemplates(email, analysis);

      // Update analytics
      await this.updateEmailAnalytics(email, analysis);

      return {
        output: {
          analysis,
          categorization,
          appliedRules,
          suggestions: suggestions.output,
          calendarActions,
          taskActions,
          relevantTemplates
        },
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        output: null,
        duration: Date.now() - startTime,
        error: this.formatError(error)
      };
    }
  }

  private async analyzeEmail(email: EmailMessage): Promise<EmailAnalysis> {
    const prompt = `Analyze this email and provide insights:
    From: ${email.from}
    Subject: ${email.subject}
    Body: ${email.body}
    
    Provide analysis in JSON format including:
    1. Priority level (high/medium/low)
    2. Main topics/keywords as array
    3. Required actions as array
    4. Whether it needs a response (boolean)
    5. Sentiment (positive/neutral/negative)
    6. Deadline mentions as array of {date, description}
    7. Meeting/schedule mentions as array of {proposedTime, duration, attendees}`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4",
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content || '{}');
  }

  private async categorizeEmail(email: EmailMessage, analysis: EmailAnalysis): Promise<string[]> {
    const categories = ['Important', 'Urgent', 'Follow-up', 'Meeting', 'Task', 'FYI'];
    const prompt = `Based on this email analysis, suggest appropriate categories from: ${categories.join(', ')}
    
    Analysis: ${JSON.stringify(analysis)}
    
    Return only the category names in a JSON array.`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content || '[]');
  }

  private async generateResponseSuggestions(email: EmailMessage, analysis: EmailAnalysis): Promise<ActionResult> {
    const startTime = Date.now();
    try {
      const prompt = `Generate 2-3 response suggestions for this email:
      
      Original Email:
      From: ${email.from}
      Subject: ${email.subject}
      Body: ${email.body}
      
      Analysis: ${JSON.stringify(analysis)}
      
      Provide responses in JSON format with array of objects containing:
      1. subject
      2. body
      3. tone (formal/casual/neutral)
      4. reasoning`;

      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-4",
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const suggestions = JSON.parse(completion.choices[0].message.content || '[]');
      const drafts = suggestions.map((suggestion: any) => ({
        id: crypto.randomUUID(),
        accountId: email.threadId,
        to: [email.from],
        subject: suggestion.subject,
        body: suggestion.body,
        inReplyTo: email.id,
        savedAt: new Date()
      }));

      return {
        output: drafts,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        output: null,
        duration: Date.now() - startTime,
        error: this.formatError(error)
      };
    }
  }

  private async applyAutomationRules(email: EmailMessage, analysis: EmailAnalysis): Promise<any> {
    const appliedRules: any[] = [];
    
    for (const [id, rule] of this.categoryRules.entries()) {
      const matches = rule.conditions.every(condition => {
        const value = this.getEmailFieldValue(email, condition.field);
        
        switch (condition.operator) {
          case 'contains':
            return typeof value === 'string' && value.includes(condition.value);
          case 'equals':
            return value === condition.value;
          case 'startsWith':
            return typeof value === 'string' && value.startsWith(condition.value);
          case 'endsWith':
            return typeof value === 'string' && value.endsWith(condition.value);
          default:
            return false;
        }
      });

      if (matches) {
        appliedRules.push({
          ruleId: id,
          category: rule.category
        });
      }
    }

    return appliedRules;
  }

  private getEmailFieldValue(email: EmailMessage, field: EmailField): string {
    switch (field) {
      case 'content':
        return email.body;
      case 'from':
        return email.from;
      case 'subject':
        return email.subject;
      default:
        return '';
    }
  }

  private async processCalendarImplications(email: EmailMessage, analysis: EmailAnalysis): Promise<any> {
    if (analysis.meetingRequests.length === 0) {
      return null;
    }

    const calendarActions = [];
    for (const meeting of analysis.meetingRequests) {
      // Create calendar event
      const event = await this.calendarService.createEvent({
        title: email.subject,
        startTime: meeting.proposedTime,
        endTime: new Date(meeting.proposedTime.getTime() + meeting.duration * 60000),
        description: `Created from email: ${email.subject}\n\n${email.body.substring(0, 500)}...`,
        type: EventType.MEETING,
        created: new Date(),
        lastModified: new Date()
      });
      calendarActions.push({ type: 'created', event });
    }

    return calendarActions;
  }

  private async processTaskImplications(email: EmailMessage, analysis: EmailAnalysis): Promise<any> {
    const tasks = [];

    // Create tasks from action items
    for (const action of analysis.requiredActions) {
      const task = await this.taskService.createTask({
        title: action,
        description: `From email: ${email.subject}`,
        dueDate: analysis.deadlines.find(d => d.description.includes(action))?.date,
        priority: this.mapPriority(analysis.priority),
        status: TaskStatus.TODO,
        estimatedDuration: 30,
        tags: ['email'],
        created: new Date(),
        lastModified: new Date(),
        metadata: {
          source: {
            type: 'email',
            id: email.id,
            threadId: email.threadId
          }
        }
      });
      tasks.push(task);
    }

    // Create follow-up task if needed
    if (analysis.requiresResponse) {
      const followUpTask = await this.taskService.createTask({
        title: `Follow up on: ${email.subject}`,
        description: `Need to respond to email from ${email.from}`,
        priority: this.mapPriority(analysis.priority),
        status: TaskStatus.TODO,
        estimatedDuration: 15,
        tags: ['email', 'follow-up'],
        created: new Date(),
        lastModified: new Date(),
        metadata: {
          source: {
            type: 'email',
            id: email.id,
            threadId: email.threadId
          }
        }
      });
      tasks.push(followUpTask);
    }

    return tasks;
  }

  private mapPriority(priority: 'high' | 'medium' | 'low'): TaskPriority {
    switch (priority) {
      case 'high':
        return TaskPriority.HIGH;
      case 'medium':
        return TaskPriority.MEDIUM;
      case 'low':
        return TaskPriority.LOW;
    }
  }

  private async findRelevantTemplates(email: EmailMessage, analysis: EmailAnalysis): Promise<EmailTemplate[]> {
    const relevantTemplates: EmailTemplate[] = [];

    for (const template of this.templates.values()) {
      const similarity = await this.calculateTemplateSimilarity(template, email, analysis);
      if (similarity > 0.7) {
        relevantTemplates.push(template);
      }
    }

    return relevantTemplates.sort((a, b) => b.usageCount - a.usageCount);
  }

  private async calculateTemplateSimilarity(template: EmailTemplate, email: EmailMessage, analysis: EmailAnalysis): Promise<number> {
    const prompt = `Compare this email template to the current email and analysis:

Template:
${JSON.stringify(template)}

Current Email:
${JSON.stringify(email)}

Analysis:
${JSON.stringify(analysis)}

Return a similarity score between 0 and 1, where 1 means perfect match.
Return only the number.`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      temperature: 0.3
    });

    return parseFloat(completion.choices[0].message.content || '0');
  }

  private async updateEmailAnalytics(email: EmailMessage, analysis: EmailAnalysis): Promise<void> {
    // Implementation for updating email analytics
    // This would typically update metrics in a database or analytics service
  }

  public async executeAction(action: string, params: any): Promise<ActionResult> {
    switch (action) {
      case 'process-email':
        return this.processIncomingEmail(params.email);
      case 'generate-response':
        return this.generateResponseSuggestions(params.email, params.analysis);
      case 'categorize':
        return {
          output: await this.categorizeEmail(params.email, params.analysis),
          duration: 0
        };
      case 'create-template':
        return this.createTemplate(params.email, params.name);
      case 'add-rule':
        return this.addCategoryRule(params.rule);
      case 'update-rule':
        return this.updateCategoryRule(params.ruleId, params.updates);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async createTemplate(email: EmailMessage, name: string): Promise<ActionResult> {
    const template: EmailTemplate = {
      id: crypto.randomUUID(),
      name,
      subject: email.subject,
      content: email.body,
      category: 'custom',
      tags: [],
      usageCount: 0,
      lastUsed: new Date()
    };

    this.templates.set(template.id, template);
    this.saveStoredRules();

    return {
      output: template,
      duration: 0
    };
  }

  private async addCategoryRule(rule: EmailCategoryRule): Promise<ActionResult> {
    this.categoryRules.set(rule.id, rule);
    this.saveStoredRules();

    return {
      output: rule,
      duration: 0
    };
  }

  private async updateCategoryRule(ruleId: string, updates: Partial<EmailCategoryRule>): Promise<ActionResult> {
    const rule = this.categoryRules.get(ruleId);
    if (!rule) {
      throw new Error(`Rule not found: ${ruleId}`);
    }

    const updatedRule = { ...rule, ...updates };
    this.categoryRules.set(ruleId, updatedRule);
    this.saveStoredRules();

    return {
      output: updatedRule,
      duration: 0
    };
  }

  async train(data: any[]): Promise<void> {
    // Implement email-specific training logic
    console.log('Training email agent with', data.length, 'samples');
  }
} 