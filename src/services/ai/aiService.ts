import { ENV } from '../../config/env';
import { SupabaseClient } from '@supabase/supabase-js';

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
  private supabase: SupabaseClient | null;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  
  constructor(options?: AIServiceOptions) {
    // Don't call React hooks in class constructor
    this.supabase = null; // Will be initialized later
    this.model = options?.model || 'gpt-3.5-turbo';
    this.temperature = options?.temperature || 0.7;
    this.maxTokens = options?.maxTokens || 1000;
  }

  /**
   * Set the Supabase client (should be called from a React component)
   */
  setSupabaseClient(client: SupabaseClient) {
    this.supabase = client;
  }
  
  /**
   * Generates text using the AI model via Supabase Edge Function
   * @param prompt The prompt to generate text from
   * @returns The generated text
   */
  async generateText(prompt: string): Promise<string> {
    try {
      // Ensure Supabase client is initialized
      if (!this.supabase) {
        console.warn('Supabase client not initialized');
        return this.generateFallbackResponse(prompt);
      }

      // Call Supabase Edge Function for text generation
      const { data, error } = await this.supabase.functions.invoke('generate-text', {
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
    if (ENV.USE_MOCK) {
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

  /**
   * Generates a chat completion with streaming support
   * @param messages Array of chat messages
   * @param options Configuration options
   * @param onChunk Callback function that receives each text chunk as it arrives
   * @returns A promise that resolves when streaming is complete
   */
  async streamChatCompletion(
    messages: Array<{role: string, content: string}>,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      frequencyPenalty?: number;
      presencePenalty?: number;
    } = {},
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      // Always use Gemini for chat completion
      if (ENV.GEMINI_API_KEY || ENV.GOOGLE_API_KEY) {
        return this.streamGeminiCompletion(messages, options, onChunk);
      }
      
      // Fall back to mock streaming for development
      return this.mockStreamCompletion(messages, options, onChunk);
    } catch (error) {
      console.error('Error in streamChatCompletion:', error);
      onChunk('I encountered an error while generating a response. Please try again.');
      throw error;
    }
  }

  /**
   * Stream a response from OpenAI's API
   */
  private async streamOpenAICompletion(
    messages: Array<{role: string, content: string}>,
    options: any,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const apiKey = ENV.OPENAI_API_KEY;
    const model = options.model || 'gpt-3.5-turbo';
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 1000,
          frequency_penalty: options.frequencyPenalty || 0,
          presence_penalty: options.presencePenalty || 0,
          stream: true
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }
      
      if (!response.body) {
        throw new Error('Response body is null');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Decode the chunk and add to buffer
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Process complete SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.substring(6));
              const content = data.choices[0]?.delta?.content || '';
              if (content) onChunk(content);
            } catch (e) {
              console.error('Error parsing SSE message:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error streaming from OpenAI:', error);
      throw error;
    }
  }

  /**
   * Stream a response from Anthropic's API
   */
  private async streamAnthropicCompletion(
    messages: Array<{role: string, content: string}>,
    options: any,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const apiKey = ENV.ANTHROPIC_API_KEY || ENV.CLAUDE_API_KEY;
    const model = options.model || 'claude-2';
    
    try {
      // Convert chat messages to Anthropic's format
      const prompt = messages.map(msg => {
        if (msg.role === 'system') {
          return `Human: <system>${msg.content}</system>\n\nAssistant: `;
        } else if (msg.role === 'user') {
          return `Human: ${msg.content}\n\nAssistant: `;
        } else if (msg.role === 'assistant') {
          return `${msg.content}\n\nHuman: `;
        }
        return '';
      }).join('').trim();
      
      // Make sure prompt ends with "Assistant: "
      const finalPrompt = prompt.endsWith('Assistant: ') 
        ? prompt 
        : prompt + '\n\nAssistant: ';
      
      const response = await fetch('https://api.anthropic.com/v1/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey || '',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          model,
          max_tokens_to_sample: options.maxTokens || 1000,
          temperature: options.temperature || 0.7,
          stream: true
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
      }
      
      if (!response.body) {
        throw new Error('Response body is null');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Decode the chunk and add to buffer
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Process complete SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.substring(6));
              const content = data.completion || '';
              if (content) onChunk(content);
            } catch (e) {
              console.error('Error parsing Anthropic SSE message:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error streaming from Anthropic:', error);
      throw error;
    }
  }

  /**
   * Stream a response from Google's Gemini API
   */
  private async streamGeminiCompletion(
    messages: Array<{role: string, content: string}>,
    options: any,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const apiKey = ENV.GEMINI_API_KEY || ENV.GOOGLE_API_KEY;
    const model = options.model || 'gemini-2.0-flash';
    
    try {
      // Process messages for Gemini API
      const userMessages = messages.filter(m => m.role === 'user');
      const systemMessages = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
      
      // Ensure we have at least one user message
      if (userMessages.length === 0) {
        throw new Error('At least one user message is required for Gemini API');
      }
      
      // Get the last user message
      const lastUserMessage = userMessages[userMessages.length - 1];
      
      // Format for Gemini API - this is for Gemini 2.0 which has a different format
      const requestBody: any = {
        contents: [
          {
            role: 'user',
            parts: [{ text: lastUserMessage.content }]
          }
        ],
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.maxTokens || 1000
        }
      };
      
      // Add system instruction if available
      if (systemMessages) {
        requestBody.systemInstruction = { 
          parts: [{ text: systemMessages }]
        };
      }
      
      console.log('Sending request to Gemini API:', JSON.stringify(requestBody, null, 2));
      
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }
      
      if (!response.body) {
        throw new Error('Response body is null');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Decode the chunk and process
        const chunk = decoder.decode(value, { stream: true });
        
        // Process the chunk directly
        try {
          // Extract text content from the chunk
          if (chunk.includes('"text"')) {
            const textMatch = chunk.match(/"text"\s*:\s*"([^"]*)"/);
            if (textMatch && textMatch[1]) {
              const content = textMatch[1];
              onChunk(content);
              accumulatedText += content;
            }
          }
          // Some responses might be valid JSON - try to parse them
          else if (chunk.trim().startsWith('{')) {
            try {
              const parsedChunk = JSON.parse(chunk);
              const text = parsedChunk.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                onChunk(text);
                accumulatedText += text;
              }
            } catch (jsonErr) {
              // If JSON parsing fails, it's likely an incomplete chunk
              console.log('Incomplete JSON chunk, waiting for more data');
            }
          }
        } catch (e) {
          console.error('Error processing Gemini chunk:', e);
        }
      }
      
      // Return the accumulated text as the final result
      return accumulatedText;
    } catch (error) {
      console.error('Error streaming from Gemini:', error);
      throw error;
    }
  }

  /**
   * Mock a streaming response for development purposes
   */
  private async mockStreamCompletion(
    messages: Array<{role: string, content: string}>,
    options: any,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    // Get the last user message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    
    // Generate a mock response based on the user's message
    let response = '';
    
    if (lastUserMessage.toLowerCase().includes('hello') || lastUserMessage.toLowerCase().includes('hi')) {
      response = "Hello! I'm your AI assistant. How can I help you today?";
    } else if (lastUserMessage.toLowerCase().includes('help')) {
      response = "I'd be happy to help! Please let me know what you need assistance with, and I'll do my best to provide relevant information or guidance.";
    } else if (lastUserMessage.toLowerCase().includes('weather')) {
      response = "I don't have real-time weather data, but I can explain how to find weather forecasts or discuss weather patterns in general. What specific weather information are you looking for?";
    } else {
      response = "Thank you for your message. As a simulated AI, I'm currently operating in mock mode, so my responses are pre-defined. In a production environment, I would be able to provide more tailored responses to your specific questions or needs.";
    }
    
    // Deliver the response in chunks
    const words = response.split(' ');
    const chunkSize = Math.max(1, Math.floor(words.length / 5));
    
    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(' ') + (i + chunkSize < words.length ? ' ' : '');
      onChunk(chunk);
      // Add a delay to simulate typing
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
}

// Create a singleton instance of AIService
// (but don't export it directly to avoid hook errors)
// Components should create their own instance and properly initialize it
// export const aiService = new AIService();

// Instead, provide a factory function
export const createAIService = (options?: AIServiceOptions) => {
  return new AIService(options);
}; 