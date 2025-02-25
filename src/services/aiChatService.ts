import { Message } from '../types/ai';

interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function handleAIChat(
  input: string,
  previousMessages: Message[],
  options: ChatOptions = {}
) {
  const {
    model = 'gpt-4',
    temperature = 0.7,
    maxTokens = 1000
  } = options;

  const messages = [
    {
      role: 'system',
      content: 'You are a helpful AI assistant. Provide clear, accurate, and concise responses.'
    },
    ...previousMessages.map(msg => ({
      role: msg.role === 'error' ? 'assistant' : msg.role,
      content: msg.content
    })),
    { role: 'user', content: input }
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    })
  });

  if (!response.ok) {
    throw new Error('Failed to get response from AI');
  }

  const data = await response.json();
  
  return {
    id: Date.now().toString(),
    role: 'assistant',
    content: data.choices[0].message.content,
    timestamp: new Date()
  };
} 