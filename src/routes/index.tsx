import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AIAgentsPage } from '../pages/AIAgents';
import { AIPage } from '../pages/AIPage';
import { Dashboard } from '../pages/Dashboard';
import { CalendarPage } from '../pages/CalendarPage';
import { SettingsPage } from '../pages/SettingsPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { KnowledgeBasePage } from '../pages/KnowledgeBasePage';
import { AgentDetail } from '../pages/AgentDetail';
import { AIDrivePage } from '../pages/AIDrive';
import { AuthGuard } from '../components/auth/AuthGuard';
import { ModernLayout } from '../components/layout/ModernLayout';
import { LoginPage } from '../pages/LoginPage';
import { AgentWizardPage } from '../pages/AgentWizardPage';
import { NotebookPage } from '../pages/NotebookPage';
import { AutomationPage } from '../pages/AutomationPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected routes */}
      <Route
        element={
          <AuthGuard>
            <ModernLayout />
          </AuthGuard>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/ai" element={<AIPage />} />
        <Route path="/agents" element={<AIAgentsPage />} />
        <Route path="/agents/:agentId" element={<AgentDetail />} />
        <Route path="/agent-wizard" element={<AgentWizardPage />} />
        <Route path="/notebooks" element={<NotebookPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/knowledge" element={<KnowledgeBasePage />} />
        <Route path="/drive" element={<AIDrivePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/automation" element={<AutomationPage />} />
      </Route>
    </Routes>
  );
} 