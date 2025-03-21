import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AIAgentsPage } from '../pages/AIAgents';
import { AIAssistant } from '../components/ai/AIAssistant';
import { Dashboard } from '../pages/Dashboard';
import { CalendarPage } from '../pages/CalendarPage';
import { SettingsPage } from '../pages/SettingsPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { KnowledgeBasePage } from '../pages/KnowledgeBasePage';
import { AgentDetail } from '../pages/AgentDetail';
import { AIDrivePage } from '../pages/AIDrive';
import { AuthGuard } from '../components/auth/AuthGuard';
import { ModernLayout } from '../components/layout/ModernLayout';

export function AppRoutes() {
  return (
    <Routes>
      <Route
        element={
          <AuthGuard>
            <ModernLayout />
          </AuthGuard>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/ai-assistant" element={<AIAssistant mode="normal" />} />
        <Route path="/agents" element={<AIAgentsPage />} />
        <Route path="/agents/:agentId" element={<AgentDetail />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/knowledge" element={<KnowledgeBasePage />} />
        <Route path="/drive" element={<AIDrivePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
} 