import React from 'react';
import { ArrowLeft, Archive, Trash2, Reply, Forward, Users } from 'lucide-react';
import { format } from 'date-fns';
import { EmailMessage } from '../../services/email/types';
import { FollowUpReminder } from './FollowUpReminder';

interface EmailDetailProps {
  email: EmailMessage;
  onClose: () => void;
  onReply?: () => void;
  onReplyAll?: () => void;
  onForward?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onSetFollowUp: (date: Date) => void;
}

export function EmailDetail({ email, onClose, onReply, onReplyAll, onForward, onArchive, onDelete, onSetFollowUp }: EmailDetailProps) {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={onReply}
            title="Reply"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <Reply className="h-5 w-5" />
          </button>
          <button
            onClick={onReplyAll}
            title="Reply All"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <Users className="h-5 w-5" />
          </button>
          <button
            onClick={onForward}
            title="Forward"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <Forward className="h-5 w-5" />
          </button>
          <button
            onClick={onArchive}
            title="Archive"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <Archive className="h-5 w-5" />
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-red-600 dark:text-red-400"
          >
            <Trash2 className="h-5 w-5" />
          </button>
          <FollowUpReminder onSetReminder={onSetFollowUp} />
        </div>
      </div>

      <div className="p-6 overflow-auto flex-1">
        <h1 className="text-2xl font-bold mb-4">{email.subject}</h1>
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="font-medium">{email.from}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              To: {Array.isArray(email.to) ? email.to.join(', ') : email.to}
            </p>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {format(new Date(email.date), 'PPP p')}
          </p>
        </div>

        <div 
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: email.body || '' }} 
        />
      </div>
    </div>
  );
}