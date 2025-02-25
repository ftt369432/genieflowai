import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AgentsPage } from '../pages/AgentsPage';
import { AIAssistant } from '../components/ai/AIAssistant';
import { Dashboard } from '../pages/Dashboard';
import { CalendarPage } from '../pages/CalendarPage';
import { SettingsPage } from '../pages/SettingsPage';
import { WorkflowsPage } from '../pages/WorkflowsPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { KnowledgeBasePage } from '../pages/KnowledgeBasePage';
import { AuthGuard } from '../components/auth/AuthGuard';
import { ModernLayout } from '../components/layout/ModernLayout';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthGuard><ModernLayout /></AuthGuard>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ai-assistant" element={<AIAssistant />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/agents/:agentId" element={<AgentDetail />} />
        <Route path="/workflows" element={<WorkflowsPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/knowledge" element={<KnowledgeBasePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
} 