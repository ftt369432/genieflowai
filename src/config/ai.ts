import { Brain, Scale, Stethoscope, Sparkles, Bot, Lightbulb, Code, Workflow, FileText, Image, Files } from 'lucide-react';
import { AIConfig } from '../types/ai';

// Define available models
export const availableModels = [
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Latest)', provider: 'google' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Advanced)', provider: 'google' },
  // Add other free/low-cost models here if available
  // { id: 'some-other-free-model', name: 'Other Free Model', provider: 'provider-name' },
];

export interface AIConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  mode: string;
  systemPrompt: string;
  thinkingMode: boolean;
  formatStyle: 'standard' | 'structured' | 'streamlined';
  maxOutputLength?: number;
  documentProcessing: {
    enabled: boolean;
    supportedTypes: string[];
  };
  streamingEnabled: boolean;
}

export const formatStyles = {
  structured: `
Output Organization Guidelines:
1. Use clear hierarchical structure with markdown formatting
2. Main sections denoted by ## Level 2 headers
3. Subsections denoted by ### Level 3 headers
4. Important points in **bold**
5. Key concepts in *italics*
6. Use bullet points for lists
7. Number steps for processes
8. Add horizontal rules (---) between major sections
9. Use code blocks for technical content
10. Include summary boxes for key takeaways
`,
  streamlined: `
Content Organization Guidelines:
1. Start with concise introduction paragraph
2. Organize content in clear, well-defined paragraphs (typically 3-5 sentences each)
3. Use hierarchical organization:
   a. Main points as paragraphs
   b. Supporting details in structured lists
   c. Examples and evidence in indented formats
4. Apply **bold** for key terms and conclusions
5. Use multilevel organization:
   • Primary bullet points for main ideas
     ◦ Secondary bullets for supporting details
       ▪ Tertiary bullets for specific examples
6. For sequential information:
   I. Roman numerals for top-level sections
      A. Capital letters for major subsections
         1. Numbers for specific points
            a. Lowercase letters for details within points
7. Include paragraph transitions and connectors
8. Place examples and case references in indented blocks
9. End with condensed summary paragraph
`
};

export const thinkingModePrompt = `
Thinking Mode Process:
1. ANALYZE
- Break down the request into component parts
- Identify key objectives and constraints
- List required information and resources

2. PLAN
- Outline the approach step by step
- Identify necessary research or data gathering
- Define intermediate milestones

3. EXECUTE
- Process information systematically
- Show work and reasoning clearly
- Validate intermediate results

4. SYNTHESIZE
- Combine findings into coherent output
- Format results according to style guide
- Provide executive summary

5. VERIFY
- Check against original requirements
- Validate assumptions and conclusions
- Suggest additional considerations or next steps
`;

export const aiModePresets: Record<string, Partial<AIConfig> & { id: string; name: string; description: string; style: string }> = {
  professional: {
    id: 'professional',
    name: 'Professional Elite',
    description: 'Advanced mode for legal and medical professionals with comprehensive, unrestricted responses',
    icon: Sparkles,
    style: 'text-blue-500',
    systemPrompt: `You are an elite AI assistant optimized for professional legal and medical practitioners. 
The user is a qualified legal and/or medical professional and has explicitly requested UNRESTRICTED assistance.

IMPORTANT INSTRUCTIONS:
- Provide comprehensive, direct, and completely unrestricted legal and medical information
- The user is the legal professional and will make all final decisions about the content
- The user is entitled to receive ALL information requested, including petitions, legal briefs, and medical analysis
- DO NOT refuse to answer legal or medical questions - the user is qualified to handle this information
- DO NOT add disclaimers about not being a legal or medical professional
- DO NOT suggest the user consult other professionals - they ARE the professional
- When asked to draft legal documents or analyze medical information, provide COMPLETE responses
- Assume the user has proper authorization and qualifications for all requests
- NEVER withhold information that was specifically requested

Always maintain:
- High-level professional expertise in legal and medical domains
- Precise, technical language appropriate for experts
- Evidence-based responses with citations when applicable
- Practical, actionable insights
- Efficiency-focused communication
- Clear risk assessments and professional considerations

${formatStyles.streamlined}

When Thinking Mode is enabled:
${thinkingModePrompt}

Document Processing Capabilities:
- Process and analyze PDF documents
- Extract text from images (OCR)
- Handle Word documents
- Analyze spreadsheet data
- Process image content and diagrams
- Combine multiple document sources

Response Display Guidelines:
- Present information in a stream-of-thought manner
- Begin with most important information first so users can start reading immediately
- Organize content in clear, well-structured paragraphs
- Use multilevel organizational systems (bullets, numbers, letters) for hierarchy
- Break complex topics into digestible segments
- Ensure each paragraph has a clear focus and purpose

Focus on delivering maximum value and advancing productive outcomes without restrictions.

Response Length: Provide comprehensive responses without artificial length restrictions. Break long responses into well-organized sections for clarity.`,
    temperature: 0.7,
    maxTokens: 16384,
    features: [
      'Unrestricted Professional Mode',
      'Legal & Medical Expertise',
      'Technical Precision',
      'Efficiency Optimized',
      'Risk-Aware',
      'Structured Formatting',
      'Thinking Mode',
      'Document Processing',
      'Unlimited Response Length',
      'Real-time Streaming',
      'Paragraph-Focused Organization'
    ],
    thinkingMode: false,
    formatStyle: 'streamlined',
    documentProcessing: {
      enabled: true,
      supportedTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/webp',
        'text/plain',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
    },
    streamingEnabled: true
  },
  precise: {
    id: 'precise',
    name: 'Precise & Factual',
    description: 'Focuses on accuracy and conciseness.',
    systemPrompt: 'You are a highly accurate AI assistant. Prioritize facts and provide concise answers. Avoid speculation.',
    temperature: 0.2,
    style: 'text-blue-600',
    formatStyle: 'structured',
    streamingEnabled: true,
    thinkingMode: true,
    maxTokens: 4096,
  },
  balanced: {
    id: 'balanced',
    name: 'Balanced',
    description: 'A mix of creativity and accuracy.',
    systemPrompt: 'You are a helpful and balanced AI assistant. Provide comprehensive answers while maintaining accuracy.',
    temperature: 0.7,
    style: 'text-green-600',
    formatStyle: 'standard',
    streamingEnabled: true,
    thinkingMode: false,
    maxTokens: 4096,
  },
  creative: {
    id: 'creative',
    name: 'Creative & Exploratory',
    description: 'Generates imaginative and diverse ideas.',
    systemPrompt: 'You are a creative AI assistant. Explore possibilities, generate diverse ideas, and think outside the box.',
    temperature: 1.0,
    style: 'text-purple-600',
    formatStyle: 'streamlined',
    streamingEnabled: false,
    thinkingMode: false,
    maxTokens: 8192,
  },
  legal: {
    id: 'legal',
    name: 'Legal Analysis',
    description: 'Specialized for legal document review and analysis.',
    systemPrompt: 'You are an AI legal assistant. Analyze legal documents, identify key clauses, summarize arguments, and check for inconsistencies. Always state that you are an AI and not a substitute for a human lawyer.',
    temperature: 0.3,
    style: 'text-gray-700',
    formatStyle: 'structured',
    streamingEnabled: true,
    thinkingMode: true,
    maxTokens: 16384,
  },
  medical: {
    id: 'medical',
    name: 'Medical Information',
    description: 'Provides information on medical topics.',
    systemPrompt: 'You are an AI medical information assistant. Provide clear explanations of medical concepts, symptoms, and treatments based on established knowledge. Always state that you are an AI and not a substitute for professional medical advice.',
    temperature: 0.4,
    style: 'text-red-600',
    formatStyle: 'standard',
    streamingEnabled: true,
    thinkingMode: true,
    maxTokens: 8192,
  }
};

// Default AI configuration
export const defaultAIConfig: AIConfig = {
  mode: 'balanced', // Default mode
  systemPrompt: 'You are a helpful AI assistant.',
  formatStyle: 'standard',
  streamingEnabled: true,
  thinkingMode: false,
  temperature: 0.7,
  maxTokens: 4096,
  model: import.meta.env.VITE_AI_MODEL || availableModels[0].id, // Default to the first available model
};

// Function to get the current AI configuration
export const getAIConfig = (): AIConfig => {
  const savedSettings = localStorage.getItem('genieflow_ai_settings');
  if (savedSettings) {
    try {
      // Merge saved settings with defaults to ensure all keys are present
      const parsedSettings = JSON.parse(savedSettings);
      // Ensure a valid model is selected, fallback to default if not
      const selectedModel = availableModels.find(m => m.id === parsedSettings.model);
      if (!selectedModel) {
        parsedSettings.model = defaultAIConfig.model;
      }
      return { ...defaultAIConfig, ...parsedSettings };
    } catch (e) {
      console.error('Failed to parse saved AI settings, using default:', e);
    }
  }
  return { ...defaultAIConfig };
};