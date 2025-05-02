import { Brain, Scale, Stethoscope, Sparkles, Bot, Lightbulb, Code, Workflow, FileText, Image, Files } from 'lucide-react';

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

export const aiModePresets = {
  professional: {
    systemPrompt: `You are GenieFlowAI, powered by Gemini 2.0 Flash. You are a highly capable AI assistant focused on helping users with productivity, task management, and document processing. You excel at understanding context and providing clear, actionable responses.

Key capabilities:
- Advanced task and schedule optimization
- Complex document analysis
- Intelligent context processing
- Real-time assistance and insights

Please provide responses that are:
1. Clear and concise
2. Actionable and specific
3. Contextually relevant
4. Professional in tone`,
    documentProcessing: {
      enabled: true,
      supportedTypes: [
        'text/plain',
        'text/markdown',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
    },
    streamingEnabled: true
  },
  focused: {
    systemPrompt: `You are GenieFlowAI's focused assistant mode, powered by Gemini 2.0 Flash. You provide direct, concise responses focused on immediate tasks and quick solutions. You prioritize efficiency and clarity in your communication.

Key priorities:
1. Provide direct answers
2. Focus on immediate actions
3. Keep responses brief
4. Highlight key points`,
    documentProcessing: {
      enabled: true,
      supportedTypes: [
        'text/plain',
        'text/markdown',
        'application/pdf'
      ]
    },
    streamingEnabled: true
  }
};

export const defaultAIConfig: AIConfig = {
  model: 'gemini-2.0-flash',
  temperature: 0.7,
  maxTokens: 2048,
  mode: 'professional',
  systemPrompt: aiModePresets.professional.systemPrompt,
  thinkingMode: false,
  formatStyle: 'streamlined',
  documentProcessing: {
    enabled: true,
    supportedTypes: aiModePresets.professional.documentProcessing.supportedTypes
  },
  streamingEnabled: true
};