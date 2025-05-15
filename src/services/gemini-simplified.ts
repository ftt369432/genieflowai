import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from '@google/generative-ai';
import { getEnv } from '../config/env';
import { EmailMessage, EmailAnalysis, EmailAnalysisMeetingDetails } from './email/types';

export class GeminiSimplifiedService {
  private client: GoogleGenerativeAI;
  private defaultModel = 'gemini-1.5-flash-latest';
  private maxRetries = 3;
  private initialDelayMs = 1000;

  constructor() {
    try {
      const env = getEnv();
      const apiKey = env.geminiApiKey;
      this.client = new GoogleGenerativeAI(apiKey);
      this.defaultModel = env.aiModel || this.defaultModel;
    } catch (error) {
      console.error('Error initializing GeminiSimplifiedService:', error);
      throw error;
    }
  }

  private async exponentialBackoffRetry<T>(
    fn: () => Promise<T>,
    retries = this.maxRetries,
    delayMs = this.initialDelayMs
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof GoogleGenerativeAIFetchError && error.status === 429) {
        if (retries > 0) {
          console.warn(
            `Gemini API rate limit hit. Retrying in ${delayMs / 1000}s... (${retries} retries left)`
          );
          let actualDelay = delayMs;
          if (error.message) {
            const match = error.message.match(/"retryDelay":"(\\d+)s"/);
            if (match && match[1]) {
              actualDelay = parseInt(match[1], 10) * 1000;
              console.log(`Using API suggested retry delay: ${actualDelay / 1000}s`);
            }
          }
          await new Promise(resolve => setTimeout(resolve, actualDelay));
          return this.exponentialBackoffRetry(fn, retries - 1, delayMs * 2);
        } else {
          console.error('Gemini API rate limit retries exhausted.');
          throw error;
        }
      }
      console.error('Gemini API encountered non-retryable error:', error);
      throw error;
    }
  }

  async generateText(prompt: string): Promise<string> {
    const apiCall = async () => {
      const model = this.client.getGenerativeModel({ model: this.defaultModel });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text() || '';
    };

    try {
      return await this.exponentialBackoffRetry(apiCall);
    } catch (error) {
      console.error('Gemini API Error (generateText):', error);
      throw error;
    }
  }

  async getCompletion(parts: Array<{text: string} | {inlineData: {mimeType: string, data: string}}>, options?: { temperature?: number; maxTokens?: number }): Promise<string> {
    const apiCall = async () => {
      const model = this.client.getGenerativeModel({
        model: this.defaultModel,
        generationConfig: {
          temperature: options?.temperature,
          maxOutputTokens: options?.maxTokens,
        }
      });
      
      const result = await model.generateContent(parts);
      const response = await result.response;
      return response.text() || '';
    };

    try {
      return await this.exponentialBackoffRetry(apiCall);
    } catch (error) {
      console.error('Gemini API Error (getCompletion):', error);
      throw error;
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    const apiCall = async () => {
      const model = this.client.getGenerativeModel({ model: 'embedding-001' });
      const embedResult = await model.embedContent(text);
      const values = embedResult.embedding.values;
      if (!values) {
        throw new Error('Embedding values are missing in the response');
      }
      return values;
    };

    try {
      return await this.exponentialBackoffRetry(apiCall);
    } catch (error) {
      console.error('Error getting embedding:', error);
      throw error;
    }
  }

  async analyzeEmailForCalendarEvent(email: EmailMessage): Promise<EmailAnalysis> {
    const prompt = `Analyze the following email content and extract information for a calendar event and general email analysis.
Email Subject: "${email.subject}"
Email Body:
\"\"\"
${email.body}
\"\"\"
Email Date: "${email.date}" // This is the received date, use for context.

Please determine if this email discusses a new meeting, an update to an existing meeting, or is not related to a calendar event.

If it IS related to a calendar event, extract the following details for the 'meetingDetails' object:
- eventTitle: A concise title for the calendar event (e.g., "Hearing for John Doe").
- eventDate: The date of the event (YYYY-MM-DD). If not specified, use the email date as a reference or state "Not Specified".
- eventTime: The start time of the event (HH:MM in 24-hour format, or HH:MM AM/PM). If not specified, state "Not Specified".
- endTime: The end time of the event (HH:MM in 24-hour format, or HH:MM AM/PM). If not specified, leave blank.
- timeZone: The timezone for the event (e.g., "America/Los_Angeles", "PST", "UTC"). If not specified, state "Not Specified" or assume UTC.
- location: The location of the event. If not specified, state "Not Specified".
- attendees: A list of attendee email addresses, if any.
- description: A brief description for the calendar event, derived from the email body.
- caseNumber: Extract any case number or similar identifier (e.g., ADJxxxxxxx, WCxxxx). If not present, leave blank.
- eventType: The type of event. Prioritize specific legal hearing types if mentioned (e.g., "MSC", "Lien Conference", "Status Conference", "Priority Conference", "Trial"). Otherwise, use more general types like "Hearing", "Meeting", "Call", "Deadline". If not clear, use "General Event".
- personInvolved: The primary person or client name involved in the event (e.g., "Richard Nombrano", "Miguel Corpeno", "Jane Smith"). If not clearly identifiable, leave blank.
- judgeName: The name of the judge, if mentioned (e.g., "Randal Hursh", "Judge Smith"). If not applicable or not mentioned, leave blank.

Also, provide a general analysis of the email with the following top-level keys:
- priority: "high", "medium", or "low".
- category: A relevant category for the email (e.g., "Legal", "Work Update", "Personal").
- sentiment: "positive", "negative", "neutral", or "urgent".
- actionItems: A list of action items from the email.
- summary: A brief summary of the entire email.
- keywords: A list of relevant keywords.
- isCourtDocument: true or false.
- isReplyRequired: true or false.
- suggestedReply: A brief suggested reply if applicable.
- followUpDate: A suggested follow-up date (YYYY-MM-DD) if applicable.
- isMeeting: Set to true if meetingDetails are present and contain at least an eventTitle, eventDate, and eventTime; false otherwise.

Format your entire response as a SINGLE, RAW JSON object. The top-level keys of this object should DIRECTLY correspond to the EmailAnalysis interface fields listed above (e.g., "priority", "category", "summary", "meetingDetails", "isMeeting", etc.).
Do NOT wrap this JSON object within another key (like "emailAnalysis": { ... }).
The calendar event details should be nested under the 'meetingDetails' key *within* this main JSON object.

Example of the expected JSON structure (fields in meetingDetails are optional if not found):
{
  "priority": "high",
  "category": "Legal",
  "summary": "This email is about a hearing.",
  "actionItems": ["Prepare for hearing"],
  "keywords": ["hearing", "legal"],
  "isCourtDocument": true,
  "isReplyRequired": false,
  "suggestedReply": "",
  "followUpDate": "",
  "meetingDetails": { 
    "eventTitle": "Hearing for Miguel Corpeno",
    "eventDate": "2024-08-15",
    "eventTime": "14:00",
    "endTime": "15:00",
    "timeZone": "America/Los_Angeles",
    "location": "Courtroom 3B",
    "attendees": ["lawyer@example.com"],
    "description": "Hearing for case ADJ123456 involving Miguel Corpeno.",
    "caseNumber": "ADJ123456",
    "eventType": "Hearing",
    "personInvolved": "Miguel Corpeno",
    "judgeName": "Judge Randal Hursh"
  },
  "isMeeting": true
}

If the email is NOT about a calendar event, the 'meetingDetails' field should NOT be included in the JSON response (i.e., it should be undefined in the resulting object), and 'isMeeting' should be set to false.
If the email IS about a calendar event, 'isMeeting' must be true, and 'meetingDetails' must be populated with extracted details.

Your response MUST be ONLY the JSON object itself, starting with '{' and ending with '}'. Do not include any explanatory text, markdown formatting (like \`\`\`json ... \`\`\` or \`\`\` ... \`\`\`), or anything else outside of the JSON structure. The response must be directly parsable as JSON.
`;

    let rawAiResponseText = '';
    let jsonToParse: string = '';

    try {
      rawAiResponseText = await this.generateText(prompt);
      jsonToParse = rawAiResponseText.trim();

      if (jsonToParse.startsWith("```json\n") && jsonToParse.endsWith("\n```")) {
        jsonToParse = jsonToParse.substring("```json\n".length, jsonToParse.length - "\n```".length).trim();
      } else if (jsonToParse.startsWith("```") && jsonToParse.endsWith("```")) {
        jsonToParse = jsonToParse.substring(3, jsonToParse.length - 3).trim();
        if (jsonToParse.toLowerCase().startsWith("json\n")) {
            jsonToParse = jsonToParse.substring("json\n".length).trim();
        }
      }
      if (jsonToParse.startsWith("```")) {
          const markdownRegex = /^```(?:json)?\s*([\s\S]*?)\s*```$/;
          const markdownMatch = jsonToParse.match(markdownRegex);
          if (markdownMatch && markdownMatch[1]) {
            jsonToParse = markdownMatch[1].trim();
          }
      }
      
      let parsedResponse = JSON.parse(jsonToParse);

      const topLevelKeys = Object.keys(parsedResponse);
      if (topLevelKeys.length === 1 && typeof parsedResponse[topLevelKeys[0]] === 'object' && parsedResponse[topLevelKeys[0]] !== null) {
        const nestedObject = parsedResponse[topLevelKeys[0]];
        if ('priority' in nestedObject || 'summary' in nestedObject || 'meetingDetails' in nestedObject || 'isMeeting' in nestedObject) {
          parsedResponse = nestedObject;
        }
      }
      
      const meetingDetails = parsedResponse.meetingDetails || undefined;
      const isMeeting = !!(meetingDetails && meetingDetails.eventTitle && meetingDetails.eventDate && meetingDetails.eventTime);

      const finalMeetingDetails: EmailAnalysisMeetingDetails | undefined = meetingDetails ? {
        eventTitle: meetingDetails.eventTitle,
        caseNumber: meetingDetails.caseNumber,
        eventType: meetingDetails.eventType,
        eventDate: meetingDetails.eventDate,
        eventTime: meetingDetails.eventTime,
        endTime: meetingDetails.endTime,
        timeZone: meetingDetails.timeZone,
        location: meetingDetails.location,
        attendees: meetingDetails.attendees,
        description: meetingDetails.description,
        personInvolved: meetingDetails.personInvolved,
        judgeName: meetingDetails.judgeName,
      } : undefined;

      const analysisResult: EmailAnalysis = {
        messageId: email.id,
        priority: parsedResponse.priority || 'medium',
        category: parsedResponse.category || 'Uncategorized',
        sentiment: parsedResponse.sentiment || 'neutral',
        actionItems: parsedResponse.actionItems || [],
        summary: parsedResponse.summary || 'No summary provided.',
        keywords: parsedResponse.keywords || [],
        isCourtDocument: parsedResponse.isCourtDocument === undefined ? false : parsedResponse.isCourtDocument,
        isReplyRequired: parsedResponse.isReplyRequired === undefined ? false : parsedResponse.isReplyRequired,
        suggestedReply: parsedResponse.suggestedReply || '',
        followUpDate: parsedResponse.followUpDate || '',
        meetingDetails: finalMeetingDetails,
        rawAiResponse: rawAiResponseText, 
        isMeeting: isMeeting,
        calendarEventId: null,
        calendarEventStatus: 'pending_analysis',
        calendarEventError: null,
        error: undefined,
        calendarEventDetails: null,
      };
      
      return analysisResult;

    } catch (error) {
      console.error('Error analyzing email for calendar event:', error);
      console.error('Raw AI Response that caused error:', JSON.stringify(rawAiResponseText));
      console.error('Processed JSON string that was attempted to parse (jsonToParse in catch):', JSON.stringify(jsonToParse));

      let errorMessage = 'Unknown error during analysis.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      return {
        messageId: email.id,
        priority: 'medium',
        category: 'Error',
        sentiment: 'neutral',
        actionItems: [],
        summary: 'Error during AI analysis. Could not parse email content.',
        keywords: [],
        isCourtDocument: false,
        isReplyRequired: false,
        suggestedReply: '',
        followUpDate: '',
        meetingDetails: undefined,
        rawAiResponse: rawAiResponseText || 'No response from AI or error before generation.',
        isMeeting: false,
        error: errorMessage,
        calendarEventId: null,
        calendarEventStatus: 'analysis_failed',
        calendarEventError: errorMessage,
        calendarEventDetails: null,
      };
    }
  }
}

export const geminiSimplifiedService = new GeminiSimplifiedService();

export default { geminiSimplifiedService };