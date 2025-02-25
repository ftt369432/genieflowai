export class MockOpenAIService {
  async getCompletion(prompt: string, options: { maxTokens?: number; temperature?: number; model?: string } = {}) {
    // Return a mock response based on the prompt
    return `Mock response for prompt: "${prompt}"`;
  }

  async getEmbedding(text: string) {
    // Return a mock embedding
    return [0.1, 0.2, 0.3]; // Example embedding
  }
}

// Create a singleton instance
export const mockOpenAIService = new MockOpenAIService(); 