import { OpenAI } from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true
}) : null;

export interface ResearchResult {
  response: string;
  error?: string;
}

export async function performDeepResearch(content: string): Promise<ResearchResult> {
  if (!openai) {
    return {
      response: 'OpenAI API key not configured. Research feature is disabled.',
      error: 'API key not available'
    };
  }

  try {
    const researchPrompt = `
      You are a comprehensive research assistant. Analyze the following content and provide a detailed research report.
      
      Content to analyze:
      ${content}

      Provide a structured report that includes:
      - Key findings and main points
      - Definitions and background information
      - Relevant laws, regulations, or medical research
      - Case studies and real-world applications
      - Conflicting viewpoints and debates
      - Emerging trends and future implications
      - Citations from valid sources
      
      Format the response in markdown for better readability.
    `;

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "system", content: researchPrompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return {
      response: aiResponse.choices[0].message.content || '',
    };
  } catch (error) {
    console.error('Research error:', error);
    return {
      response: 'Error performing research. Please check your API key and try again.',
      error: 'Error processing research request'
    };
  }
} 