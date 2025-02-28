import React from 'react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { Sparkles, Zap, Brain, Star } from 'lucide-react';

export interface AIModelSelectorProps {
  value: string;
  onChange: (model: string) => void;
}

interface ModelOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  features?: string[];
}

const models: ModelOption[] = [
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description: 'Our newest multimodal model, with next generation features and improved capabilities',
    icon: <Sparkles className="w-5 h-5" />,
    features: ['Multimodal support', 'Next-gen features', 'Improved capabilities']
  },
  {
    id: 'gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash-Lite',
    description: 'Our fastest and most cost-efficient multimodal model with great performance for high-frequency tasks',
    icon: <Zap className="w-5 h-5" />,
    features: ['High performance', 'Cost-efficient', 'Fast response time']
  },
  {
    id: 'gemini-2.0-pro',
    name: 'Gemini 2.0 Pro',
    description: 'Our best performing multimodal model with features for a wide variety of reasoning tasks',
    icon: <Brain className="w-5 h-5" />,
    features: ['Advanced reasoning', 'Wide task support', 'Best performance']
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    description: 'Balanced model for general-purpose use',
    icon: <Star className="w-5 h-5" />,
    features: ['General purpose', 'Balanced performance', 'Cost-effective']
  }
];

export function AIModelSelector({ value, onChange }: AIModelSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      {models.map((model) => (
        <Card
          key={model.id}
          className={cn(
            'relative p-4 cursor-pointer transition-all hover:shadow-md',
            'border-2',
            value === model.id ? 'border-primary bg-primary/5' : 'border-transparent hover:border-primary/20'
          )}
          onClick={() => onChange(model.id)}
        >
          <div className="absolute top-2 right-2 text-primary">
            {model.icon}
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">{model.name}</h3>
            <p className="text-xs text-muted-foreground">{model.description}</p>
            {model.features && (
              <div className="flex flex-wrap gap-1 mt-2">
                {model.features.map((feature, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-xs"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            )}
          </div>
          {value === model.id && (
            <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none" />
          )}
        </Card>
      ))}
    </div>
  );
} 