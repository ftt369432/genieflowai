import { aiProviders } from '../config/aiProviders';
import type { AIProvider } from '../config/aiProviders';

class AIConfig {
  private providers: AIProvider[];

  constructor() {
    this.providers = aiProviders;
  }

  getProviderConfig(providerId: string): AIProvider | undefined {
    return this.providers.find(p => p.id === providerId);
  }

  isEnabled(providerId: string): boolean {
    const provider = this.getProviderConfig(providerId);
    return provider?.enabled ?? false;
  }

  getApiKey(providerId: string): string {
    const provider = this.getProviderConfig(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const key = import.meta.env[provider.apiKeyName];
    if (!key) {
      console.error(`API key not found for provider ${providerId}. Looking for key: ${provider.apiKeyName}`);
      throw new Error(`API key not found for provider ${providerId}`);
    }

    // Don't log the actual key in production
    console.debug(`Found API key for ${providerId}`);
    return key;
  }

  getEnabledProviders(): AIProvider[] {
    return this.providers.filter(provider => this.isEnabled(provider.id));
  }

  getServiceProvider(serviceName: 'ai-drive' | 'ai-assistant' | 'ai-agent'): string {
    // Always return 'google' as the provider regardless of environment settings
    return 'google';
  }
}

export const aiConfig = new AIConfig(); 