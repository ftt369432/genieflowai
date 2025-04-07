import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_CLAUDE_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const ClaudeService = {
  async sendMessage(content: string) {
    const message = await anthropic.messages.create({
      model: 'claude-2',
      max_tokens: 1000,
      messages: [{ role: 'user', content }]
    });

    if (message.content[0].type === 'text') {
      return message.content[0].text;
    }
    
    return "Unable to process response from Claude";
  }
} as const; 