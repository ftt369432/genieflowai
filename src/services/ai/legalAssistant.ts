import { geminiSimplifiedService } from '../gemini-simplified';

const SYSTEM_PROMPT = `You are an AI Legal Assistant with expertise in legal analysis, contract review, and legal research. Your capabilities include:
1. Answering legal questions with appropriate disclaimers
2. Analyzing legal documents and contracts
3. Providing summaries of legal texts
4. Identifying potential issues in legal documents
5. Offering general legal information (not specific legal advice)

Always include a disclaimer that you are not a lawyer and your responses do not constitute legal advice. Users should consult with a qualified attorney for specific legal advice.`;

/**
 * Generates a response to a legal question based on the provided messages
 */
export async function generateLegalResponse(messages: Array<{ role: string; content: string }>): Promise<string> {
  try {
    // Format the messages for Gemini
    const formattedMessages = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n');
    
    // Create a prompt that includes the system message and conversation history
    const prompt = `${SYSTEM_PROMPT}\n\nConversation History:\n${formattedMessages}\n\nPlease provide a response to the latest message.`;
    
    // Use geminiSimplifiedService to get a completion
    const response = await geminiSimplifiedService.getCompletion(prompt, {
      temperature: 0.3,
      maxTokens: 2048
    });
    
    return response;
  } catch (error) {
    console.error('Error generating legal response:', error);
    return 'I apologize, but I encountered an error while processing your request. Please try again later.';
  }
}

/**
 * Analyzes a legal document's content and returns a structured analysis
 */
export async function analyzeLegalDocument(documentContent: string): Promise<{
  summary: string;
  keyPoints: string[];
  potentialRisks: string[];
  recommendations: string[];
}> {
  try {
    const prompt = `${SYSTEM_PROMPT}\n\nAnalyze the following legal document and provide a structured analysis in JSON format with the following fields:
1. summary - a concise summary of the document
2. keyPoints - an array of key points from the document
3. potentialRisks - an array of potential legal risks or concerns identified
4. recommendations - an array of recommendations based on the document

Document to analyze:
${documentContent}

Respond only with a valid JSON object following this structure:
{
  "summary": "string",
  "keyPoints": ["string"],
  "potentialRisks": ["string"],
  "recommendations": ["string"]
}`;

    const response = await geminiSimplifiedService.getCompletion(prompt, {
      temperature: 0.2,
      maxTokens: 3000
    });

    try {
      // Parse the JSON response
      return JSON.parse(response);
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      // Fallback with default structure if JSON parsing fails
      return {
        summary: "Failed to properly analyze the document",
        keyPoints: ["Error parsing the analysis results"],
        potentialRisks: ["Unable to identify risks due to processing error"],
        recommendations: ["Please try again with a clearer document"]
      };
    }
  } catch (error) {
    console.error('Error analyzing legal document:', error);
    return {
      summary: "Failed to analyze the document",
      keyPoints: ["An error occurred during analysis"],
      potentialRisks: ["Unable to identify risks due to processing error"],
      recommendations: ["Please try again later"]
    };
  }
}

/**
 * Generates a concise legal summary of the provided text
 */
export async function generateLegalSummary(text: string): Promise<string> {
  try {
    const prompt = `${SYSTEM_PROMPT}\n\nPlease provide a concise legal summary of the following text. Focus on the key legal points, relevant statutes or case law, and any significant legal implications:\n\n${text}`;
    
    const response = await geminiSimplifiedService.getCompletion(prompt, {
      temperature: 0.2,
      maxTokens: 1500
    });
    
    return response;
  } catch (error) {
    console.error('Error generating legal summary:', error);
    return 'I apologize, but I encountered an error while generating the summary. Please try again later.';
  }
}