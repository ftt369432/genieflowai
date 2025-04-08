import React from 'react';
import { AIAssistantWidget } from '../components/dashboard/AIAssistantWidget';
import { KnowledgeBaseWidget } from '../components/dashboard/KnowledgeBaseWidget';
import { WelcomeWidget } from '../components/dashboard/WelcomeWidget';
import { AgentPerformanceDashboard } from '../components/dashboard/AgentPerformanceDashboard';
import { AgentMonitoringDashboard } from '../components/dashboard/AgentMonitoringDashboard';
import { MetricsGrid } from '../components/analytics/MetricsGrid';
import { ActivityTimeline } from '../components/analytics/ActivityTimeline';
import { testTasks, testEvents, testContacts, testDocuments, testEmails } from '../data/testData';
import { PendingApprovalsWidget } from '../components/dashboard/PendingApprovalsWidget';

// Define local interface for emails to avoid type issues
interface Email {
  id: string;
  subject: string;
  from: string;
  to: string;
  content: string;
  date: Date;
  read: boolean;
  category?: string;
}

export function DashboardPage() {
  // Convert test emails to match the Email interface
  const emails: Email[] = testEmails.map(email => ({
    id: email.id,
    subject: email.subject,
    from: email.from,
    to: email.to,
    content: email.body, // Map 'body' to 'content'
    date: email.date,
    read: email.read,
    category: email.tags?.[0]
  }));

  return (
    <div className="container mx-auto py-6 px-4 dashboard-content">
      <h1 className="text-2xl font-bold mb-6 page-title">Dashboard</h1>
      
      {/* Welcome Widget - Full width */}
      <div className="mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 dashboard-card">
          <WelcomeWidget />
        </div>
      </div>
      
      {/* Two column layout for main widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 transition-all hover:shadow-2xl dashboard-card">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-t-lg dashboard-header">
            <h2 className="font-semibold text-gray-800 dark:text-white card-title">Knowledge Base</h2>
          </div>
          <div className="p-4 card-content">
            <KnowledgeBaseWidget />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 transition-all hover:shadow-2xl dashboard-card">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-t-lg dashboard-header">
            <h2 className="font-semibold text-gray-800 dark:text-white card-title">AI Assistant</h2>
          </div>
          <div className="p-4 card-content">
            <AIAssistantWidget />
          </div>
        </div>
      </div>
      
      {/* Analytics Widgets - Two column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 transition-all hover:shadow-2xl dashboard-card">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-t-lg dashboard-header">
            <h2 className="font-semibold text-gray-800 dark:text-white card-title">Performance Dashboard</h2>
          </div>
          <div className="p-4 card-content">
            <AgentPerformanceDashboard />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 transition-all hover:shadow-2xl dashboard-card">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-t-lg dashboard-header">
            <h2 className="font-semibold text-gray-800 dark:text-white card-title">Agent Monitoring</h2>
          </div>
          <div className="p-4 card-content">
            <AgentMonitoringDashboard />
          </div>
        </div>
      </div>
      
      {/* Bottom Section - Uneven split for metrics and activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 transition-all hover:shadow-2xl dashboard-card">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-t-lg dashboard-header">
            <h2 className="font-semibold text-gray-800 dark:text-white card-title">Metrics Overview</h2>
          </div>
          <div className="p-4 card-content">
            <MetricsGrid 
              emails={emails} 
              tasks={testTasks} 
              events={testEvents} 
              contacts={testContacts} 
              documents={testDocuments} 
            />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 transition-all hover:shadow-2xl dashboard-card">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-t-lg dashboard-header">
            <h2 className="font-semibold text-gray-800 dark:text-white card-title">Activity Timeline</h2>
          </div>
          <div className="p-4 h-full card-content">
            <ActivityTimeline 
              emails={emails} 
              tasks={testTasks} 
              events={testEvents} 
              documents={testDocuments} 
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <PendingApprovalsWidget />
      </div>
    </div>
  );
} 