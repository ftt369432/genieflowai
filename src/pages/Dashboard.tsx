import React, { useEffect } from 'react';
import { DashboardOverview } from '../components/dashboard/DashboardOverview';
import { useNotifications } from '../contexts/NotificationContext';

export function Dashboard() {
  const { addNotification, notifications } = useNotifications();

  // Add demo notifications when component mounts, but only once
  useEffect(() => {
    // Check if we've already added demo notifications by looking for welcome message
    const hasWelcomeNotification = notifications.some(
      notification => notification.title === 'Welcome to GenieFlow AI'
    );
    
    // Only add demo notifications if they don't already exist
    if (!hasWelcomeNotification) {
      // Add demo notifications with a slight delay between them
      setTimeout(() => {
        addNotification({
          title: 'Welcome to GenieFlow AI',
          message: 'Your AI assistant is ready to help you boost productivity.',
          type: 'info',
          actionUrl: '/ai-assistant',
          actionLabel: 'Try AI Assistant'
        });
      }, 1000);

      setTimeout(() => {
        addNotification({
          title: 'New email received',
          message: 'You have 3 unread emails in your inbox',
          type: 'info',
          actionUrl: '/email',
          actionLabel: 'Check emails'
        });
      }, 2000);

      setTimeout(() => {
        addNotification({
          title: 'Task due soon',
          message: 'Complete "Project Presentation" by tomorrow 5:00 PM',
          type: 'warning',
          actionUrl: '/tasks',
          actionLabel: 'View tasks'
        });
      }, 3000);

      setTimeout(() => {
        addNotification({
          title: 'Upgrade your plan',
          message: 'Get more AI features with our Pro subscription',
          type: 'success',
          actionUrl: '/subscription',
          actionLabel: 'View plans'
        });
      }, 4000);
    }
  }, [addNotification, notifications]);

  return (
    <div className="container mx-auto">
      <DashboardOverview />
    </div>
  );
} 