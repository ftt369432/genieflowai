import React, { useState } from 'react';
import { AIAssistant } from '../components/ai/AIAssistant';
import { AIErrorBoundary } from '../components/error/AIErrorBoundary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Card } from '../components/ui/Card';
import { Brain, Zap, Clock, Settings, Sparkles } from 'lucide-react';

export function AIAssistantPage() {
  const [activeMode, setActiveMode] = useState<'normal' | 'turbo' | 'cyborg'>('normal');

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyberpunk-dark to-cyberpunk-darker p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-cyberpunk-neon animate-glow" />
            <h1 className="text-3xl font-bold text-white">
              AI Assistant
              <span className="ml-2 text-cyberpunk-neon">v2.0</span>
            </h1>
          </div>
          
          {/* Mode Selector */}
          <div className="flex items-center gap-4 bg-cyberpunk-dark/50 p-2 rounded-lg border border-cyberpunk-neon/30">
            <button
              onClick={() => setActiveMode('normal')}
              className={`px-4 py-2 rounded ${
                activeMode === 'normal' 
                  ? 'bg-cyberpunk-neon/20 text-cyberpunk-neon' 
                  : 'text-gray-400'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => setActiveMode('turbo')}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                activeMode === 'turbo'
                  ? 'bg-cyberpunk-pink/20 text-cyberpunk-pink'
                  : 'text-gray-400'
              }`}
            >
              Turbo <Zap className="h-4 w-4" />
            </button>
            <button
              onClick={() => setActiveMode('cyborg')}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                activeMode === 'cyborg'
                  ? 'bg-cyberpunk-yellow/20 text-cyberpunk-yellow'
                  : 'text-gray-400'
              }`}
            >
              Cyborg <Sparkles className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Assistant Area */}
          <div className="col-span-8">
            <Card className="h-[800px] bg-cyberpunk-dark/50 border-cyberpunk-neon/30">
              <AIErrorBoundary>
                <AIAssistant mode={activeMode} />
              </AIErrorBoundary>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="col-span-4 space-y-6">
            {/* Quick Actions */}
            <Card className="bg-cyberpunk-dark/50 border-cyberpunk-neon/30 p-4">
              <h3 className="text-lg font-medium text-cyberpunk-neon mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <QuickAction
                  icon={<Clock className="h-5 w-5" />}
                  label="Recent Tasks"
                  onClick={() => {}}
                />
                <QuickAction
                  icon={<Settings className="h-5 w-5" />}
                  label="Preferences"
                  onClick={() => {}}
                />
              </div>
            </Card>

            {/* Context Panel */}
            <Card className="bg-cyberpunk-dark/50 border-cyberpunk-neon/30">
              <Tabs defaultValue="knowledge">
                <TabsList className="w-full bg-cyberpunk-dark/50">
                  <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
                  <TabsTrigger value="agents">Active Agents</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>
                <div className="p-4">
                  <TabsContent value="knowledge">
                    <KnowledgeBasePanel />
                  </TabsContent>
                  <TabsContent value="agents">
                    <ActiveAgentsPanel />
                  </TabsContent>
                  <TabsContent value="analytics">
                    <AnalyticsPanel />
                  </TabsContent>
                </div>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon, label, onClick }: { 
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 p-3 rounded-lg bg-cyberpunk-dark hover:bg-cyberpunk-neon/10 
                 border border-cyberpunk-neon/20 text-white transition-all"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function KnowledgeBasePanel() {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-cyberpunk-neon">Recent Documents</h4>
      {/* Add document list here */}
    </div>
  );
}

function ActiveAgentsPanel() {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-cyberpunk-neon">Active Agents</h4>
      {/* Add active agents list here */}
    </div>
  );
}

function AnalyticsPanel() {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-cyberpunk-neon">Performance Metrics</h4>
      {/* Add analytics charts here */}
    </div>
  );
} 