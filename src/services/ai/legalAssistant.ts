import { openai } from '../../config/openai';
import type { AIMessage } from '../../types/legal';

const SYSTEM_PROMPT = `You are ApexLawHub, a specialized legal AI assistant. Your capabilities include:
- Legal research and case law analysis
- Document review and contract analysis
- Legal writing assistance
- Regulatory compliance guidance
- Case strategy recommendations

Please provide clear, accurate legal information while noting that you cannot provide direct legal advice or create attorney-client relationships.`;

export async function generateLegalResponse(messages: AIMessage[]): Promise<string> {
  try {
    const formattedMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 2000
    });

    return completion.choices[0].message.content || '';
  } catch (error) {
    console.error('Error generating legal response:', error);
    throw error;
  }
}

export async function analyzeLegalDocument(content: string): Promise<{
  summary: string;
  keyPoints: string[];
  risks: string[];
  recommendations: string[];
}> {
  try {
    const prompt = `Please analyze the following legal document and provide a structured analysis:

Content:
${content}

Please provide:
1. A brief summary
2. Key points and implications
3. Potential risks or issues
4. Recommendations

Respond in JSON format.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Error analyzing legal document:', error);
    throw error;
  }
}

export async function generateLegalSummary(text: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `Please provide a concise legal summary of the following text:\n\n${text}`
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    return completion.choices[0].message.content || '';
  } catch (error) {
    console.error('Error generating legal summary:', error);
    throw error;
  }
}