export interface VoiceCommand {
  action: string;
  parameters: Record<string, any>;
  confidence: number;
}

export interface UserPreferences {
  voiceType: string;
  speechRate: number;
  pitch: number;
  volume: number;
  language: string;
}

export interface PersonalityProfile {
  name: string;
  traits: {
    formality: number;
    empathy: number;
    humor: number;
  };
  preferences: UserPreferences;
}

// Add this to your vite-env.d.ts or a separate types file
interface Window {
  SpeechRecognition: any;
  webkitSpeechRecognition: any;
} 