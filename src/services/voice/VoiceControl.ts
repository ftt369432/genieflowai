import { PersonalityProfile, UserPreferences } from '../../types/voice';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export class VoiceControl {
  private recognition: any;
  private synthesis: SpeechSynthesisUtterance;
  private commandHandlers: Map<string, (params: any) => void>;
  private personalityProfile: PersonalityProfile;
  private userPreferences: UserPreferences;

  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.synthesis = new SpeechSynthesisUtterance();
    this.setupRecognition();
    this.commandHandlers = new Map();
    
    // Initialize with defaults
    this.personalityProfile = {
      name: 'Default',
      traits: {
        formality: 0.5,
        empathy: 0.7,
        humor: 0.3
      },
      preferences: {
        voiceType: 'default',
        speechRate: 1,
        pitch: 1,
        volume: 1,
        language: 'en-US'
      }
    };
    
    this.userPreferences = this.personalityProfile.preferences;
  }

  // ... rest of implementation
} 