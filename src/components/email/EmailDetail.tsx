import React from 'react';
import { ArrowLeft, Archive, Trash2, Reply, Forward, Users, Info, AlertTriangle, ListChecks, CalendarDays, Tags, MessageSquare } from 'lucide-react'; // Added new icons
import { format } from 'date-fns';
import { EmailMessage, EmailAnalysisMeetingDetails } from '../../services/email/types'; // Ensure EmailAnalysisMeetingDetails is imported
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

// Helper function to render meeting details
const renderMeetingDetails = (meeting?: EmailAnalysisMeetingDetails) => { // Made meeting optional
  if (!meeting) return null;
  return (
    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
      <h4 className="font-semibold text-sm flex items-center"><CalendarDays className="h-4 w-4 mr-2" /> Meeting Details:</h4>
      {meeting.startTime && <p className="text-xs">Start: {format(new Date(meeting.startTime), 'PPP p')}</p>}
      {meeting.endTime && <p className="text-xs">End: {format(new Date(meeting.endTime), 'PPP p')}</p>}
      {meeting.location && <p className="text-xs">Location: {meeting.location}</p>}
      {meeting.description && <p className="text-xs">Description: {meeting.description}</p>}
      {meeting.attendees && meeting.attendees.length > 0 && <p className="text-xs">Attendees: {meeting.attendees.join(', ')}</p>}
    </div>
  );
};

export function EmailDetail({ email, onClose, onReply, onReplyAll, onForward, onArchive, onDelete, onSetFollowUp }: EmailDetailProps) {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Toolbar remains the same */}
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
        <h1 className="text-2xl font-bold mb-1">{email.subject}</h1>
        
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <p className="font-medium">{email.from}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              To: {Array.isArray(email.to) ? email.to.join(', ') : email.to}
            </p>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {email.date ? format(new Date(email.date), 'PPP p') : 'Date not available'}
          </p>
        </div>

        {/* AI Analysis Section */}
        {email.analysis && (
          <div className="mb-6 p-4 border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-gray-900 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center"><Info className="h-5 w-5 mr-2" /> AI Insights</h3>
            
            {email.analysis.summary && (
              <div className="mb-3">
                <h4 className="font-semibold text-sm flex items-center"><MessageSquare className="h-4 w-4 mr-2" /> Summary:</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">{email.analysis.summary}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              {email.analysis.priority && (
                <div>
                  <h4 className="font-semibold text-sm flex items-center"><AlertTriangle className="h-4 w-4 mr-2" /> Priority:</h4>
                  <p className="text-sm capitalize text-gray-700 dark:text-gray-300">{email.analysis.priority}</p>
                </div>
              )}
              {email.analysis.sentiment && (
                <div>
                  <h4 className="font-semibold text-sm">Sentiment:</h4>
                  <p className="text-sm capitalize text-gray-700 dark:text-gray-300">{email.analysis.sentiment}</p>
                </div>
              )}
            </div>
            
            {email.analysis.keywords && email.analysis.keywords.length > 0 && (
              <div className="mb-3">
                <h4 className="font-semibold text-sm flex items-center"><Tags className="h-4 w-4 mr-2" /> Keywords:</h4>
                <div className="flex flex-wrap gap-1 mt-1">
                  {email.analysis.keywords.map((keyword, index) => (
                    <span key={index} className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {email.analysis.actionItems && email.analysis.actionItems.length > 0 && (
              <div className="mb-3">
                <h4 className="font-semibold text-sm flex items-center"><ListChecks className="h-4 w-4 mr-2" /> Action Items:</h4>
                <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                  {email.analysis.actionItems.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
              </div>
            )}

            {/* Safely render meeting details */}
            {renderMeetingDetails(email.analysis.meetingDetails)} 
            
            {email.analysis.isReplyRequired !== undefined && (
                <div className="mt-2"> {/* Added mt-2 for spacing */}
                  <h4 className="font-semibold text-sm">Reply Suggested:</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{email.analysis.isReplyRequired ? 'Yes' : 'No'}</p>
                </div>
            )}
            {email.analysis.suggestedReply && (
                <div className="mt-2">
                  <h4 className="font-semibold text-sm">Suggested Reply Snippet:</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic p-2 border-l-2 border-gray-300 dark:border-gray-600">{email.analysis.suggestedReply}</p>
                </div>
            )}
             {email.analysis.followUpDate && (
                <div className="mt-2">
                  <h4 className="font-semibold text-sm flex items-center"><CalendarDays className="h-4 w-4 mr-2" /> Suggested Follow-up:</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{email.date ? format(new Date(email.analysis.followUpDate), 'PPP') : 'Date not available'}</p>
                </div>
            )}

          </div>
        )}

        <div 
          className="prose dark:prose-invert max-w-none mt-4" // Added mt-4 for spacing if AI section is present
          dangerouslySetInnerHTML={{ __html: email.body || '' }} 
        />
      </div>
    </div>
  );
}