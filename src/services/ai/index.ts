/**
 * AI Services Entry Point
 */

import { createAIService, AIProvider, AIService } from './aiServiceFactory';
import { GeminiService } from './gemini';
import { MockAIService } from './mockAI';

// Export the classes
export { GeminiService, MockAIService };
export { AIProvider };
export type { AIService };

// Export a singleton instance for direct use
export const aiService = createAIService();

// Export the factory function
export { createAIService }; 