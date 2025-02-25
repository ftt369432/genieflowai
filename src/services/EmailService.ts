import { AIService } from './AIService';

export interface Email {
  id: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  content: string;
  attachments?: Array<{
    name: string;
    type: string;
    content: string;
  }>;
  labels?: string[];
  timestamp: Date;
  read: boolean;
  starred: boolean;
  important: boolean;
}

export interface EmailDraft {
  subject: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  content: string;
  attachments?: Array<{
    name: string;
    type: string;
    content: string;
  }>;
}

export class EmailService {
  private aiService: AIService;

  constructor(aiService?: AIService) {
    this.aiService = aiService || new AIService();
  }

  async analyzeEmail(email: Email): Promise<{
    priority: 'high' | 'medium' | 'low';
    sentiment: 'positive' | 'neutral' | 'negative';
    actionItems: string[];
    summary: string;
  }> {
    const prompt = `
      Analyze the following email:
      Subject: ${email.subject}
      From: ${email.from}
      Content: ${email.content}

      Provide:
      1. Priority level (high/medium/low)
      2. Sentiment (positive/neutral/negative)
      3. Action items
      4. Brief summary
    `;

    const analysis = await this.aiService.getCompletion(prompt);
    // Parse AI response and structure it
    // This is a simplified implementation
    return {
      priority: 'medium',
      sentiment: 'neutral',
      actionItems: [],
      summary: analysis
    };
  }

  async draftResponse(email: Email, context?: Record<string, any>): Promise<EmailDraft> {
    const prompt = `
      Draft a response to the following email:
      Subject: ${email.subject}
      From: ${email.from}
      Content: ${email.content}
      ${context ? `Context: ${JSON.stringify(context)}` : ''}

      Consider:
      1. Professional tone
      2. Clear and concise
      3. Address all points
      4. Maintain context
    `;

    const response = await this.aiService.getCompletion(prompt);

    return {
      subject: `Re: ${email.subject}`,
      to: [email.from],
      content: response
    };
  }

  async categorizeEmail(email: Email): Promise<string[]> {
    const prompt = `
      Categorize the following email:
      Subject: ${email.subject}
      Content: ${email.content}

      Suggest appropriate labels/categories.
    `;

    const categories = await this.aiService.getCompletion(prompt);
    return categories.split(',').map(c => c.trim());
  }

  async extractEntities(email: Email): Promise<{
    people: string[];
    organizations: string[];
    dates: string[];
    locations: string[];
  }> {
    const prompt = `
      Extract entities from the following email:
      Subject: ${email.subject}
      Content: ${email.content}

      Extract:
      1. People mentioned
      2. Organizations
      3. Dates and times
      4. Locations
    `;

    const entities = await this.aiService.getCompletion(prompt);
    // Parse AI response and structure it
    // This is a simplified implementation
    return {
      people: [],
      organizations: [],
      dates: [],
      locations: []
    };
  }

  async suggestFollowUp(email: Email): Promise<{
    shouldFollowUp: boolean;
    suggestedDate?: Date;
    reason?: string;
  }> {
    const prompt = `
      Analyze if this email needs follow-up:
      Subject: ${email.subject}
      Content: ${email.content}

      Consider:
      1. Pending actions
      2. Unanswered questions
      3. Expected responses
      4. Deadlines mentioned
    `;

    const analysis = await this.aiService.getCompletion(prompt);
    // Parse AI response and structure it
    // This is a simplified implementation
    return {
      shouldFollowUp: false
    };
  }
} 