import { AIMessage } from '../../types/ai';

export interface AIResponse {
  content: string;
  role: 'assistant' | 'user' | 'system';
  timestamp: string;
}

export interface AIService {
  getCompletion(prompt: string): Promise<string>;
  chat(messages: AIMessage[]): Promise<AIResponse>;
} 