import { Capability, CapabilityContext, ParameterDefinition } from '../types/capabilities';
import { AIService } from '../services/ai/aiService';

// It might be preferable to inject or get AIService instance via context or a factory
// For now, creating a default instance here.
const aiServiceInstance = new AIService(); 

export const summarizeTextCapability: Capability = {
  id: 'document-summarize-text',
  name: 'Summarize Text Content',
  description: 'Summarizes a given block of text using an AI model. The desired maximum length of the summary can be specified.',
  category: 'Document', // Or 'TextProcessing', 'AI'
  version: '1.0.0',
  inputParameters: [
    { name: 'text', type: 'string', description: 'The text content to be summarized.', required: true },
    { name: 'maxLength', type: 'number', description: 'Optional maximum desired length of the summary (e.g., in words or tokens, depending on AI model specifics). Interpretation of this value depends on the underlying AI service.', required: false },
  ],
  outputParameters: [
    { name: 'summary', type: 'string', description: 'The generated summary of the text.', required: true },
  ],
  target: {
    type: 'service',
    identifier: 'AIService.summarizeText',
  },
  execute: async (
    input: {
      text: string;
      maxLength?: number;
    },
    context: CapabilityContext
  ): Promise<{ summary: string }> => {
    if (!input.text) {
      throw new Error('Missing required input parameter: text for document-summarize-text.');
    }
    try {
      // Here, we use the aiServiceInstance created in this file.
      // In a more advanced setup, the orchestrator might resolve target.identifier to the correct service instance.
      const summary = await aiServiceInstance.summarizeText(input.text, input.maxLength);
      return { summary };
    } catch (error: any) {
      console.error(`Error executing ${summarizeTextCapability.id}:`, error);
      throw new Error(`Failed to summarize text: ${error.message}`);
    }
  },
  tags: ['document', 'text-processing', 'summarization', 'ai', 'nlp'],
  permissionsRequired: ['ai:generate_text'], // Example permission
  exampleUsage: {
    text: "This is a long piece of text about the history of artificial intelligence, its current applications, and future prospects. It covers various sub-topics like machine learning, natural language processing, computer vision, and robotics. The goal is to provide a comprehensive overview for readers interested in the field.",
    maxLength: 50 // e.g., 50 words
  }
};

// To register this capability, import it and call:
// import { useCapabilityRegistryStore } from '../stores/capabilityRegistryStore';
// import { summarizeTextCapability } from './documentCapabilities';
// useCapabilityRegistryStore.getState().registerCapability(summarizeTextCapability);
// This should typically be done once during application initialization. 