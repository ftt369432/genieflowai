import { getEnv, EnvironmentConfig } from '../../config/env';
import { useSupabase } from '../../hooks/useSupabase';

/**
 * Options for text generation
 */
export interface TextGenerationOptions {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  topP?: number;
}

/**
 * Options for text analysis
 */
export interface TextAnalysisOptions {
  text: string;
  type: 'sentiment' | 'entities' | 'keywords' | 'summary' | 'classification';
  options?: Record<string, any>;
}

interface AIServiceOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class AIService {
  private supabase;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private envConfig: EnvironmentConfig;
  
  constructor(options?: AIServiceOptions) {
    this.envConfig = getEnv();
    this.supabase = useSupabase();
    
    this.model = options?.model || this.envConfig.aiModel || 'gpt-3.5-turbo'; 
    this.temperature = options?.temperature || this.envConfig.temperature || 0.7;
    this.maxTokens = options?.maxTokens || this.envConfig.maxTokens || 1000;
  }
  
  /**
   * Generates text using the AI model via Supabase Edge Function
   * @param prompt The prompt to generate text from
   * @returns The generated text
   */
  async generateText(prompt: string): Promise<string> {
    try {
      // Corrected: Call Supabase Edge Function via the nested supabase client
      const { data, error } = await this.supabase.supabase.functions.invoke('generate-text', {
        body: {
          prompt,
          model: this.model,
          temperature: this.temperature,
          max_tokens: this.maxTokens
        }
      });
      
      if (error) {
        console.error('Error generating text:', error);
        throw error;
      }
      
      return data.text;
    } catch (error) {
      console.error('Failed to generate text:', error);
      
      // Fallback to a simple response
      return this.generateFallbackResponse(prompt);
    }
  }
  
  /**
   * Summarizes a text using AI
   * @param text The text to summarize
   * @param maxLength Maximum desired length of the summary
   * @returns The summary
   */
  async summarizeText(text: string, maxLength?: number): Promise<string> {
    const prompt = `
      Summarize the following text in a concise way:
      
      ${text.substring(0, 10000)}
      
      ${maxLength ? `Keep the summary under ${maxLength} words.` : ''}
    `;
    
    return this.generateText(prompt);
  }
  
  /**
   * Extracts key topics from a text
   * @param text The text to analyze
   * @param count Number of topics to extract
   * @returns Array of topics
   */
  async extractTopics(text: string, count: number = 5): Promise<string[]> {
    const prompt = `
      Extract exactly ${count} main topics from the following text. 
      Return only the list of topics, one per line:
      
      ${text.substring(0, 10000)}
    `;
    
    const result = await this.generateText(prompt);
    
    // Parse the result to get individual topics
    return result
      .split('\n')
      .map(topic => topic.trim())
      .filter(Boolean)
      .slice(0, count);
  }
  
  /**
   * Answers a question based on the provided context
   * @param question The question to answer
   * @param context The context information
   * @returns The answer
   */
  async answerQuestion(question: string, context: string): Promise<string> {
    const prompt = `
      Use the following information to answer the question.
      
      Context:
      ${context.substring(0, 10000)}
      
      Question: ${question}
      
      If the answer cannot be determined from the context, say so clearly.
    `;
    
    return this.generateText(prompt);
  }
  
  /**
   * Provides a fallback response when AI generation fails
   * @param prompt The original prompt
   * @returns A fallback response
   */
  private generateFallbackResponse(prompt: string): string {
    // Extract a potential question
    const questionMatch = prompt.match(/question:\s*(.+?)(\?|\n|$)/i);
    const seemsLikeQuestion = questionMatch || prompt.includes('?');
    
    if (seemsLikeQuestion) {
      return "I'm unable to answer this question right now. Please try again later or contact support if the problem persists.";
    }
    
    if (prompt.toLowerCase().includes('summarize')) {
      return "I'm unable to generate a summary at the moment. Please try again later.";
    }
    
    return "The AI service is currently unavailable. Please try again later or contact support if the problem persists.";
  }

  /**
   * Analyze text for various attributes
   */
  async analyzeText(options: TextAnalysisOptions): Promise<any> {
    const { text, type, options: analysisOptions = {} } = options;
    
    console.log(`Analyzing text with type: ${type}`);
    
    // In a real application, this would call the appropriate AI service
    // For now, we'll return placeholder responses based on analysis type
    
    switch (type) {
      case 'sentiment':
        return {
          sentiment: 'positive',
          score: 0.8,
          magnitude: 0.9
        };
      case 'entities':
        return {
          entities: [
            { name: 'John Doe', type: 'PERSON', salience: 0.8 },
            { name: 'Acme Inc', type: 'ORGANIZATION', salience: 0.6 },
            { name: 'next Wednesday', type: 'DATE', salience: 0.5 }
          ]
        };
      case 'keywords':
        return {
          keywords: [
            { text: 'meeting', score: 0.9 },
            { text: 'proposal', score: 0.8 },
            { text: 'deadline', score: 0.7 }
          ]
        };
      case 'summary':
        return {
          summary: 'This is a summary of the provided text. Key points are extracted and condensed into a shorter form while preserving the main information.',
          length: {
            original: text.length,
            summary: 120
          }
        };
      case 'classification':
        return {
          categories: [
            { name: 'Business', confidence: 0.8 },
            { name: 'Finance', confidence: 0.6 },
            { name: 'Technology', confidence: 0.4 }
          ],
          topCategory: 'Business'
        };
      default:
        throw new Error(`Unsupported analysis type: ${type}`);
    }
  }

  /**
   * Generate embeddings for a piece of text
   */
  async generateEmbeddings(text: string): Promise<number[]> {
    if (this.envConfig.useMock) {
      return this.mockGenerateEmbeddings();
    }
    
    // In a real implementation, this would call an embedding API
    return this.mockGenerateEmbeddings();
  }

  /**
   * Mock embeddings for testing
   */
  private mockGenerateEmbeddings(): number[] {
    // Generate a 128-dimensional vector of random values between -1 and 1
    return Array.from({ length: 128 }, () => Math.random() * 2 - 1);
  }

  // Mock response generators
  private mockEmailAnalysis(): string {
    return JSON.stringify({
      summary: "This email is regarding the upcoming project deadline and requesting a status update on the assigned tasks.",
      keyPoints: [
        "Project XYZ deadline is on Friday",
        "Team meeting scheduled for Wednesday at 2pm",
        "Status update requested by end of day"
      ],
      actionItems: [
        "Provide status update by today",
        "Prepare presentation for Wednesday meeting",
        "Complete assigned tasks before Friday"
      ],
      tone: "professional",
      priority: "high"
    }, null, 2);
  }

  private mockEmailResponse(prompt: string): string {
    if (prompt.includes('professional')) {
      return `Dear [Sender],

Thank you for your email regarding the project status. I appreciate you reaching out.

I'm pleased to inform you that we are on track to meet the Friday deadline. All assigned tasks are approximately 80% complete, and we anticipate no issues with delivery.

I will have the presentation ready for our Wednesday meeting, where I can provide more detailed information on our progress.

Best regards,
[Your Name]`;
    } else {
      return `Hi there,

Thanks for checking in about the project! We're making good progress and should definitely hit the Friday deadline without any problems.

I'll have everything ready for our meeting on Wednesday and can walk everyone through what we've done so far.

Let me know if you need anything else before then!

Cheers,
[Your Name]`;
    }
  }

  private mockCategorization(): string {
    return JSON.stringify([
      {
        category: "important",
        confidence: 0.85,
        explanation: "From a key stakeholder regarding project deadline"
      },
      {
        category: "follow-up",
        confidence: 0.78,
        explanation: "Contains specific requests requiring action"
      }
    ], null, 2);
  }

  private mockTaskExtraction(): string {
    return JSON.stringify([
      {
        task: "Send status update",
        dueDate: "2023-07-25",
        assignee: "me",
        priority: "high",
        context: "Project manager requested update on progress"
      },
      {
        task: "Prepare presentation slides",
        dueDate: "2023-07-26",
        assignee: "me",
        priority: "medium",
        context: "For team meeting on Wednesday"
      },
      {
        task: "Complete project deliverables",
        dueDate: "2023-07-28",
        assignee: "team",
        priority: "high",
        context: "Final deadline for project XYZ"
      }
    ], null, 2);
  }

  private mockImportanceAnalysis(): string {
    return JSON.stringify({
      importanceLevel: 4,
      urgency: 4,
      reasoning: "Email is from a project manager regarding an upcoming deadline, contains specific action items with due dates, and requires a response today."
    }, null, 2);
  }

  private mockSentimentAnalysis(): string {
    return JSON.stringify({
      sentiment: "neutral",
      tone: "professional",
      emotionScores: {
        happiness: 0.2,
        sadness: 0.1,
        fear: 0.3,
        surprise: 0.1,
        anger: 0.1
      },
      analysis: "The email is written in a professional tone with slight urgency. There's no negative sentiment, but there is some pressure implied by the upcoming deadline."
    }, null, 2);
  }

  private mockSummary(): string {
    return `Summary of 5 emails:

1. High Priority (2):
   - Project deadline reminder from John (CEO): Final deliverables due this Friday
   - Client feedback from Sarah (Acme Corp): Urgent revisions needed on proposal

2. Medium Priority (2):
   - Team meeting invitation from Marketing: Discuss Q3 strategy (tomorrow at 2pm)
   - Invoice notification from Accounting: Monthly expense reports due next week

3. Low Priority (1):
   - Office announcement: New coffee machine installed in break room

The most urgent items requiring attention are the client feedback from Acme Corp and the project deadline reminder.`;
  }
}

// Export the singleton instance
export const aiService = new AIService(); 