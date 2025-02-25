import React from 'react';
import { EmailToolbar } from './EmailToolbar';
import { EmailListItem } from './EmailListItem';
import type { Email } from '../../types';
import { useLoading } from '../../hooks/useLoading';
import { useNotifications } from '../../hooks/useNotifications';
import { useError } from '../../hooks/useError';

interface EmailListProps {
  emails: Email[];
  selectedEmails: string[];
  onSelectEmail: (email: Email) => void;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onCreateTasks: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onMove: () => void;
}

export function EmailList({
  emails,
  selectedEmails,
  onSelectEmail,
  onToggleSelect,
  onSelectAll,
  onCreateTasks,
  onArchive,
  onDelete,
  onMove
}: EmailListProps) {
  const { withLoading } = useLoading();
  const { showSuccess } = useNotifications();
  const { handleError } = useError();

  const handleEmailAction = async (action: string) => {
    try {
      await withLoading(
        // Your async action here
        new Promise((resolve) => setTimeout(resolve, 1000))
      );
      showSuccess(`Email ${action} successful`);
    } catch (error) {
      handleError(error instanceof Error ? error : 'Failed to process email');
    }
  };

  return (
    <div className="relative min-h-[500px]">
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {emails.map((email) => (
          <EmailListItem
            key={email.id}
            email={email}
            selected={selectedEmails.includes(email.id)}
            onSelect={onToggleSelect}
            onClick={onSelectEmail}
          />
        ))}
      </div>

      <EmailToolbar
        selectedCount={selectedEmails.length}
        onArchive={onArchive}
        onDelete={onDelete}
        onMove={onMove}
        onCreateTasks={onCreateTasks}
      />
    </div>
  );
}