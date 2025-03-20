import { aiProviders } from '../config/aiProviders';
import type { AIProvider } from '../config/aiProviders';
import { ENV } from '../config/env';

class AIConfig {
  private providers: AIProvider[];

  constructor() {
    this.providers = aiProviders;
    console.log('Initializing AI config with providers:', this.providers.map(p => p.id));
  }

  getProviderConfig(providerId: string): AIProvider | undefined {
    const provider = this.providers.find(p => p.id === providerId);
    if (!provider) {
      console.error(`Provider ${providerId} not found in configuration`);
    }
    return provider;
  }

  isEnabled(providerId: string): boolean {
    const provider = this.getProviderConfig(providerId);
    const enabled = provider?.enabled ?? false;
    console.log(`Provider ${providerId} enabled status:`, enabled);
    return enabled;
  }

  getApiKey(providerId: string): string {
    const provider = this.getProviderConfig(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const envKey = provider.apiKeyName.replace('VITE_', '') as keyof typeof ENV;
    const key = ENV[envKey];
    if (!key || typeof key !== 'string') {
      console.error(`API key not found for provider ${providerId}. Looking for key: ${provider.apiKeyName}`);
      throw new Error(`API key not found for provider ${providerId}`);
    }

    // Don't log the actual key in production
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Found API key for ${providerId} with prefix:`, key.slice(0, 4));
    }
    return key;
  }

  getEnabledProviders(): AIProvider[] {
    const enabled = this.providers.filter(provider => this.isEnabled(provider.id));
    console.log('Enabled providers:', enabled.map(p => p.id));
    return enabled;
  }

  getServiceProvider(serviceName: 'ai-drive' | 'ai-assistant' | 'ai-agent'): string {
    const envKey = `VITE_${serviceName.toUpperCase()}_PROVIDER`.replace('VITE_', '') as keyof typeof ENV;
    const value = ENV[envKey];
    const provider = typeof value === 'string' ? value : 'openai';
    console.log(`Service ${serviceName} using provider:`, provider);
    return provider;
  }
}

export const aiConfig = new AIConfig(); 