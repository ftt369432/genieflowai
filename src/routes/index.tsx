import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AIPage } from '../pages/AIPage';
import { DashboardPage } from '../pages/DashboardPage';
import { CalendarPage } from '../pages/CalendarPage';
import { SettingsPage } from '../pages/SettingsPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { KnowledgeBasePage } from '../pages/KnowledgeBasePage';
import { AgentDetail } from '../pages/AgentDetail';
import { AIDrivePage } from '../pages/AIDrive';
import { AssistantsPage } from '../pages/AssistantsPage';
import { CreateLegalAssistant } from '../components/legal/CreateLegalAssistant';
import { AuthGuard } from '../components/auth/AuthGuard';
import { ModernLayout } from '../components/layout/ModernLayout';
import { LoginPage } from '../pages/LoginPage';
import { AgentWizardPage } from '../pages/AgentWizardPage';
import { NotebookPage } from '../pages/NotebookPage';
import { AutomationPage } from '../pages/AutomationPage';
import EmailConnectSuccess from '../pages/EmailConnectSuccess';
import EmailConnectError from '../pages/EmailConnectError';
import { AutomationAuditDashboard } from '../components/dashboard/AutomationAuditDashboard';
import { AgentsPageComponent } from '../pages/AgentsPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Email connection callback routes - must be outside of auth guard */}
      <Route path="/email/connect/success" element={<EmailConnectSuccess />} />
      <Route path="/email/connect/error" element={<EmailConnectError />} />
      
      {/* Protected routes */}
      <Route
        element={
          <AuthGuard>
            <ModernLayout />
          </AuthGuard>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/ai" element={<AIPage />} />
        <Route path="/agents" element={<AgentsPageComponent />} />
        <Route path="/agents/:agentId" element={<AgentDetail />} />
        <Route path="/agent-wizard" element={<AgentWizardPage />} />
        <Route path="/notebooks" element={<NotebookPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/knowledge" element={<KnowledgeBasePage />} />
        <Route path="/drive" element={<AIDrivePage />} />
        <Route path="/assistants" element={<AssistantsPage />} />
        <Route path="/assistants/legal" element={<CreateLegalAssistant />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/automation" element={<AutomationPage />} />
        <Route path="/dashboard/audit" element={<AutomationAuditDashboard />} />
      </Route>
    </Routes>
  );
} 