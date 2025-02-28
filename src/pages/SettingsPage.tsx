import React, { useState, useEffect } from 'react';
import { ThemeSelector } from '../components/ui/ThemeSelector';
import { ThemePreview } from '../components/ui/ThemePreview';
import { useTheme } from '../contexts/ThemeContext';
import { Switch } from '../components/ui/Switch';
import { Slider } from '../components/ui/Slider';
import { themes } from '../config/themes';
import { Sun, Moon, Monitor, Brain, Mic, Zap, Bot } from 'lucide-react';
import { useAI } from '../hooks/useAI';
import { useVoiceCommands } from '../hooks/useVoiceCommands';
import { AIModelSelector } from '../components/ai/AIModelSelector';
import { SystemPrompt } from '../components/ai/SystemPrompt';
import type { MessageMetadata } from '../types/ai';

type AIMode = MessageMetadata['mode'];

export function SettingsPage() {
  const { currentTheme, setTheme, mode, setMode } = useTheme();
  const { config, updateConfig } = useAI();
  const { isListening, startListening, stopListening } = useVoiceCommands({
    onCommand: (command) => console.log('Voice command:', command)
  });
  
  const [customEffects, setCustomEffects] = useState(currentTheme.effects || {});
  const [fontSize, setFontSize] = useState([16]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(config.systemPrompt || '');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState(false);
  const [voiceSensitivity, setVoiceSensitivity] = useState([50]);
  const [workflowSettings, setWorkflowSettings] = useState({
    autoSave: false,
    enableSuggestions: false
  });

  // AI Assistant modes
  const aiModes = [
    { value: 'normal' as AIMode, label: 'Normal', icon: Brain, description: 'Balanced responses with clear explanations' },
    { value: 'turbo' as AIMode, label: 'Turbo', icon: Zap, description: 'Quick, concise answers optimized for speed' },
    { value: 'cyborg' as AIMode, label: 'Cyborg', icon: Bot, description: 'Detailed technical analysis and solutions' }
  ];

  const handleEffectToggle = (effect: string) => {
    setCustomEffects(prev => ({
      ...prev,
      [effect]: !prev[effect as keyof typeof prev]
    }));
  };

  const modeOptions = [
    { value: 'light', label: 'Light Mode', icon: Sun },
    { value: 'dark', label: 'Dark Mode', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor }
  ] as const;

  // Handle voice control
  const toggleVoice = () => {
    if (voiceEnabled) {
      stopListening();
    } else {
      startListening();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('fontSize', fontSize[0].toString());
    localStorage.setItem('reducedMotion', reducedMotion.toString());
    localStorage.setItem('highContrast', highContrast.toString());
    localStorage.setItem('voiceEnabled', voiceEnabled.toString());
    localStorage.setItem('voiceFeedback', voiceFeedback.toString());
    localStorage.setItem('voiceSensitivity', voiceSensitivity[0].toString());
    localStorage.setItem('workflowSettings', JSON.stringify(workflowSettings));
  }, [fontSize, reducedMotion, highContrast, voiceEnabled, voiceFeedback, voiceSensitivity, workflowSettings]);

  // Load settings from localStorage
  useEffect(() => {
    const savedWorkflowSettings = localStorage.getItem('workflowSettings');
    if (savedWorkflowSettings) {
      setWorkflowSettings(JSON.parse(savedWorkflowSettings));
    }
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-text-primary">Settings</h1>
      
      <div className="grid gap-8">
        {/* AI Assistant Settings */}
        <section className="bg-paper border border-primary/10 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">AI Assistant</h2>
          <div className="space-y-6">
            {/* AI Mode Selection */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-4">
                Assistant Mode
              </label>
              <div className="grid grid-cols-3 gap-4">
                {aiModes.map((aiMode) => (
                  <button
                    key={aiMode.value}
                    onClick={() => updateConfig({ model: aiMode.value })}
                    className={`
                      flex flex-col items-center justify-center p-4 rounded-lg
                      border-2 transition-all duration-200
                      ${config.model === aiMode.value 
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-transparent hover:border-primary/20 hover:bg-primary/5'
                      }
                    `}
                  >
                    <aiMode.icon className="h-6 w-6 mb-2" />
                    <span className="text-sm font-medium">{aiMode.label}</span>
                    <p className="text-xs text-text-muted mt-2 text-center">
                      {aiMode.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-4">
                AI Model
              </label>
              <AIModelSelector
                selectedModel={config.model}
                onModelChange={(model) => updateConfig({ model })}
                mode={config.model as AIMode}
              />
            </div>

            {/* System Prompt */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-4">
                System Prompt
              </label>
              <SystemPrompt
                prompt={systemPrompt}
                onPromptChange={(prompt) => {
                  setSystemPrompt(prompt);
                  updateConfig({ systemPrompt: prompt });
                }}
                isOpen={true}
                onToggle={() => {}}
                mode={config.model as AIMode}
              />
            </div>
          </div>
        </section>

        {/* Voice Control Settings */}
        <section className="bg-paper border border-primary/10 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">Voice Control</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-text-primary">Enable Voice Commands</label>
                <p className="text-sm text-text-muted">Control the AI assistant using voice commands</p>
              </div>
              <Switch checked={voiceEnabled} onCheckedChange={toggleVoice} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-text-primary">Voice Feedback</label>
                <p className="text-sm text-text-muted">AI assistant responds with voice</p>
              </div>
              <Switch 
                checked={voiceFeedback} 
                onCheckedChange={setVoiceFeedback} 
              />
            </div>
            {voiceEnabled && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-text-primary">Voice Recognition Sensitivity</label>
                  <span className="text-sm text-text-muted">{voiceSensitivity[0]}%</span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={voiceSensitivity}
                  onValueChange={setVoiceSensitivity}
                />
              </div>
            )}
          </div>
        </section>

        {/* Workflow Settings */}
        <section className="bg-paper border border-primary/10 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">Workflow</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-text-primary">Auto-save</label>
                <p className="text-sm text-text-muted">Automatically save changes</p>
              </div>
              <Switch 
                checked={workflowSettings.autoSave} 
                onCheckedChange={(enabled) => setWorkflowSettings(prev => ({ ...prev, autoSave: enabled }))} 
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-text-primary">Smart Suggestions</label>
                <p className="text-sm text-text-muted">Get AI-powered workflow suggestions</p>
              </div>
              <Switch 
                checked={workflowSettings.enableSuggestions} 
                onCheckedChange={(enabled) => setWorkflowSettings(prev => ({ ...prev, enableSuggestions: enabled }))} 
              />
            </div>
          </div>
        </section>

        {/* Appearance Settings */}
        <section className="bg-paper border border-primary/10 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">Appearance</h2>
          <div className="space-y-8">
            {/* Mode Selection */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-4">
                Color Mode
              </label>
              <div className="grid grid-cols-3 gap-4">
                {modeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setMode(option.value)}
                    className={`
                      flex flex-col items-center justify-center p-4 rounded-lg
                      border-2 transition-all duration-200
                      ${mode === option.value 
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-transparent hover:border-primary/20 hover:bg-primary/5'
                      }
                    `}
                  >
                    <option.icon className="h-6 w-6 mb-2" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Selection */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-4">
                Theme
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {themes.map(theme => (
                  <ThemePreview
                    key={theme.id}
                    theme={theme}
                    isActive={theme.id === currentTheme.id}
                    onClick={() => setTheme(theme.id)}
                  />
                ))}
              </div>
            </div>

            {/* Theme Effects */}
            {currentTheme.effects && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-4">
                  Theme Effects
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(currentTheme.effects).map(([effect, enabled]) => (
                    <div key={effect} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                      <div>
                        <label className="text-sm font-medium text-text-primary">
                          {effect.replace('enable', '').replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        <p className="text-xs text-text-muted">
                          {getEffectDescription(effect)}
                        </p>
                      </div>
                      <Switch
                        checked={customEffects[effect as keyof typeof customEffects] ?? enabled}
                        onCheckedChange={() => handleEffectToggle(effect)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Accessibility Settings */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-4">
                Accessibility
              </label>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-text-primary">Font Size</label>
                    <span className="text-sm text-text-muted">{fontSize[0]}px</span>
                  </div>
                  <Slider
                    min={12}
                    max={24}
                    step={1}
                    value={fontSize}
                    onValueChange={setFontSize}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-text-primary">Reduced Motion</label>
                    <p className="text-sm text-text-muted">Minimize animations</p>
                  </div>
                  <Switch checked={reducedMotion} onCheckedChange={setReducedMotion} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-text-primary">High Contrast</label>
                    <p className="text-sm text-text-muted">Increase text contrast</p>
                  </div>
                  <Switch checked={highContrast} onCheckedChange={setHighContrast} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function getEffectDescription(effect: string): string {
  switch (effect) {
    case 'enableGlow':
      return 'Add a subtle glow effect to UI elements';
    case 'enableScanlines':
      return 'Display retro-style scan lines overlay';
    case 'enableGrid':
      return 'Show a grid pattern in the background';
    case 'enableGlitch':
      return 'Apply occasional glitch effects';
    default:
      return '';
  }
} 