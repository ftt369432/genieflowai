import React from 'react';
import { DraggableDashboard } from '../components/dashboard/DraggableDashboard';
import { AIAssistantWidget } from '../components/dashboard/AIAssistantWidget';
import { KnowledgeBaseWidget } from '../components/dashboard/KnowledgeBaseWidget';
import { GridLayout } from '../components/dashboard/GridLayout';
import { WelcomeWidget } from '../components/dashboard/WelcomeWidget';

const defaultLayout = {
  lg: [
    { i: 'welcome', x: 0, y: 0, w: 12, h: 2 },
    { i: 'knowledge-base', x: 0, y: 2, w: 6, h: 4 },
    { i: 'ai-assistant', x: 6, y: 2, w: 6, h: 4 },
  ]
};

export function DashboardPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <GridLayout
        className="layout"
        layout={defaultLayout.lg}
      >
        <div key="welcome">
          <WelcomeWidget />
        </div>
        <div key="knowledge-base">
          <KnowledgeBaseWidget />
        </div>
        <div key="ai-assistant">
          <AIAssistantWidget />
        </div>
      </GridLayout>
    </div>
  );
} 