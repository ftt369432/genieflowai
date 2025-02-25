import React, { useState, useCallback } from 'react';
import { Plus, Search, Inbox, Send, Archive, Trash, ChevronRight } from 'lucide-react';
import { EmailDashboard } from '../components/email/EmailDashboard';
import { EmailDetail } from '../components/email/EmailDetail';
import { EmailCompose } from '../components/email/EmailCompose';
import { EmailFolders } from '../components/email/EmailFolders';
import { CreateFolderDialog } from '../components/email/CreateFolderDialog';
import { useEmails } from '../hooks/useEmails';
import { useEmailFolders } from '../hooks/useEmailFolders';
import { useNotifications } from '../hooks/useNotifications';
import type { Email } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { EmailSearch } from '../components/email/EmailSearch';
import { MoveToFolderDialog } from '../components/email/MoveToFolderDialog';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function EmailPage() {
  const { emails, isLoading, loadEmails, markAsRead, sendEmail, archiveEmails, deleteEmails, moveEmails } = useEmails();
  const { folders, unreadCounts, createFolder, updateFolderCount } = useEmailFolders();
  const { showSuccess } = useNotifications();

  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [showCompose, setShowCompose] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [emailsToMove, setEmailsToMove] = useState<string[]>([]);

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    if (!email.read) {
      markAsRead(email.id);
    }
  };

  const handleToggleSelect = (emailId: string) => {
    setSelectedEmails(current =>
      current.includes(emailId)
        ? current.filter(id => id !== emailId)
        : [...current, emailId]
    );
  };

  const handleSelectFolder = (folderId: string) => {
    if (folderId === 'inbox' && !showCompose) {
      setShowCompose(true);
    } else {
      setSelectedFolder(folderId);
      setSelectedEmail(null);
      setSelectedEmails([]);
    }
  };

  const handleCreateFolder = (name: string) => {
    const newFolder = createFolder(name);
    showSuccess(`Folder "${name}" created`);
    setShowFolderDialog(false);
    setSelectedFolder(newFolder.id);
  };

  const handleSendEmail = async (email: Partial<Email>) => {
    await sendEmail(email);
    showSuccess('Email sent successfully');
    setShowCompose(false);
    loadEmails();
  };

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleMoveEmails = useCallback(async (targetFolder: string) => {
    await moveEmails(emailsToMove, targetFolder);
    setEmailsToMove([]);
    setShowMoveDialog(false);
  }, [moveEmails]);

  return (
    <div className="h-full flex">
      {/* Email Sidebar */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4">
          <Button className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Compose
          </Button>
        </div>

        <nav className="flex-1">
          <a href="#inbox" className="flex items-center px-4 py-2 text-sm text-primary-500 bg-gray-100 dark:bg-gray-700">
            <Inbox className="h-4 w-4 mr-3" />
            Inbox
            <span className="ml-auto bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">3</span>
          </a>
          <a href="#sent" className="flex items-center px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <Send className="h-4 w-4 mr-3" />
            Sent
          </a>
          <a href="#archive" className="flex items-center px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <Archive className="h-4 w-4 mr-3" />
            Archive
          </a>
          <a href="#trash" className="flex items-center px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <Trash className="h-4 w-4 mr-3" />
            Trash
          </a>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Folders</h3>
          <button className="flex items-center w-full text-left px-2 py-1 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <ChevronRight className="h-4 w-4 mr-2" />
            Add Folder
          </button>
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search emails..."
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary-500" />
                    <span className="font-medium">Sender Name</span>
                    <span className="text-sm text-gray-500">Feb 24, 2024</span>
                  </div>
                  <h4 className="font-medium mt-1">Email Subject</h4>
                  <p className="text-sm text-gray-500 truncate">
                    Preview of the email content goes here...
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showCompose && (
        <EmailCompose
          onSend={handleSendEmail}
          onCancel={() => setShowCompose(false)}
        />
      )}

      {showFolderDialog && (
        <CreateFolderDialog
          onSubmit={handleCreateFolder}
          onClose={() => setShowFolderDialog(false)}
        />
      )}

      {showMoveDialog && (
        <MoveToFolderDialog
          folders={folders}
          onMove={handleMoveEmails}
          onClose={() => setShowMoveDialog(false)}
        />
      )}
    </div>
  );
}