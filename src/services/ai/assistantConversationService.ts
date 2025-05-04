import { geminiService } from './gemini';

class AssistantConversationService {
  private geminiService = geminiService;

  generateWelcomeMessage(assistant: any | null): string {
    if (assistant) {
      return `Hello! I'm ${assistant.name}. ${assistant.description || ''}`;
    }
    return 'Hello! I\'m ready to help you configure a new AI assistant.';
  }

  async generateResponse(
    userMessage: string,
    context: {
      name: string;
      description?: string;
      systemPrompt?: string;
      knowledgeFolders?: string[];
    },
    history: { role: string; content: string }[]
  ): Promise<string> {
    const prompt = `
You are an AI assistant with the following configuration:
Name: ${context.name}
${context.description ? `Description: ${context.description}` : ''}
${context.systemPrompt ? `System Prompt: ${context.systemPrompt}` : ''}
${context.knowledgeFolders?.length ? `Knowledge folders: ${context.knowledgeFolders.join(', ')}` : ''}

Previous conversation:
${history.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

User: ${userMessage}

Respond as the assistant would based on this configuration.
`;

    return await this.geminiService.getCompletion(prompt, {
      temperature: 0.7,
      maxTokens: 1000
    });
  }

  extractSystemPromptSuggestion(message: string): string | null {
    // Look for patterns that suggest system prompt content
    const promptPatterns = [
      /you should be (.*?)(?:\.|$)/i,
      /your role should be (.*?)(?:\.|$)/i,
      /system prompt: (.*?)(?:\.|$)/i,
      /configure you to (.*?)(?:\.|$)/i
    ];

    for (const pattern of promptPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }
}

export const assistantConversationService = new AssistantConversationService();