import { geminiService } from './gemini';
import { AIDocument } from '../../types/ai';

export class LegalAssistant {
  private systemPrompt: string;

  constructor() {
    this.systemPrompt = `You are a legal AI assistant. Your role is to help with legal document analysis, 
    contract review, and legal research. Always maintain professional language and cite relevant laws 
    when possible. If you're unsure about something, clearly state that and suggest consulting a 
    qualified legal professional.`;
  }

  async analyzeDocument(document: AIDocument): Promise<string> {
    try {
      const prompt = `${this.systemPrompt}\n\nPlease analyze the following legal document:\n\n${document.content}`;
      return await geminiService.getCompletion(prompt);
    } catch (error) {
      console.error('Error analyzing legal document:', error);
      throw error;
    }
  }

  async reviewContract(contract: AIDocument): Promise<string> {
    try {
      const prompt = `${this.systemPrompt}\n\nPlease review the following contract and identify any potential issues or areas of concern:\n\n${contract.content}`;
      return await geminiService.getCompletion(prompt);
    } catch (error) {
      console.error('Error reviewing contract:', error);
      throw error;
    }
  }
}