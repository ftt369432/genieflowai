import React from 'react';
import { MetricsGrid } from '../components/analytics/MetricsGrid';
import { ActivityTimeline } from '../components/analytics/ActivityTimeline';
import { TaskCompletionChart } from '../components/analytics/TaskCompletionChart';
import { EmailResponseChart } from '../components/analytics/EmailResponseChart';
import { CalendarUtilizationChart } from '../components/analytics/CalendarUtilizationChart';
import { useAnalytics } from '../hooks/useAnalytics';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function AnalyticsPage() {
  const {
    data: {
      emails,
      tasks,
      events,
      contacts,
      documents
    },
    loading,
    error
  } = useAnalytics();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading analytics: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600">Track your productivity metrics and insights</p>
      </div>

      <MetricsGrid
        emails={emails}
        tasks={tasks}
        events={events}
        contacts={contacts}
        documents={documents}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium mb-4">Task Completion by Priority</h2>
          <TaskCompletionChart tasks={tasks} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium mb-4">Email Volume Trend</h2>
          <EmailResponseChart emails={emails} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium mb-4">Calendar Utilization</h2>
          <CalendarUtilizationChart events={events} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <ActivityTimeline
            emails={emails}
            tasks={tasks}
            events={events}
            documents={documents}
          />
        </div>
      </div>
    </div>
  );
}