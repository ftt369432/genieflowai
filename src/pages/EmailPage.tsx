import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Search, Inbox, Send, Archive, Trash, ChevronRight, Mail, RefreshCw } from 'lucide-react';
import { useEmail } from '../contexts/EmailContext';
import { EmailComposer } from '../components/email/EmailComposer';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSupabase } from '../providers/SupabaseProvider';

export function EmailPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabase();
  const { accounts, selectedAccountId, getMessages } = useEmail();
  const [isLoading, setIsLoading] = useState(false);
  const [emails, setEmails] = useState<any[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Wait for auth to complete before making decisions
    if (authLoading) return;
    
    // If user is not authenticated, redirect to login
    if (!user) {
      navigate('/login');
      return;
    }

    // If no accounts, navigate to connect page
    if (accounts.length === 0) {
      navigate('/email/connect');
      return;
    }

    // If we have accounts, load emails
    if (accounts.length > 0 && selectedAccountId) {
      loadEmails();
    }
  }, [accounts, selectedAccountId, user, authLoading]);

  const loadEmails = async () => {
    if (!selectedAccountId) return;
    
    setIsLoading(true);
    try {
      const { messages } = await getMessages(selectedAccountId, { 
        folderId: 'INBOX' 
      });
      setEmails(messages || []);
    } catch (error) {
      console.error('Failed to load emails:', error);
      toast.error('Failed to load emails');
    } finally {
      setIsLoading(false);
    }
  };

  // If auth is loading, show spinner
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // If not authenticated, redirect (this should be handled by the effect)
  if (!user) {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-2xl font-bold">Email</h1>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={loadEmails}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCompose(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Compose
          </Button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Email Sidebar */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-auto">
          <div className="p-4">
            <Button className="w-full gap-2" onClick={() => setShowCompose(true)}>
              <Plus className="h-4 w-4" />
              Compose
            </Button>
          </div>

          <nav className="flex-1">
            <a href="#inbox" className="flex items-center px-4 py-2 text-sm text-primary-500 bg-gray-100 dark:bg-gray-700">
              <Inbox className="h-4 w-4 mr-3" />
              Inbox
              <span className="ml-auto bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                {emails.filter(email => !email.read).length}
              </span>
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
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Account</h3>
            {accounts.map(account => (
              <div key={account.id} className="flex items-center p-2 text-sm">
                <Mail className="h-4 w-4 mr-2 text-gray-500" />
                <span className="truncate">{account.email}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Email List and Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search emails..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Spinner className="h-8 w-8" />
              </div>
            ) : emails.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {emails.map((email) => (
                  <div 
                    key={email.id} 
                    className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => navigate(`/email/message/${email.id}`)}
                  >
                    <input 
                      type="checkbox" 
                      className="mt-1" 
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {!email.read && (
                          <div className="h-2 w-2 rounded-full bg-primary-500" />
                        )}
                        <span className={`font-medium ${email.read ? 'text-gray-600' : 'text-gray-900'}`}>
                          {email.from}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(email.date).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className={`font-medium mt-1 ${email.read ? 'text-gray-600' : 'text-gray-900'}`}>
                        {email.subject}
                      </h4>
                      <p className="text-sm text-gray-500 truncate">
                        {email.body && typeof email.body === 'string'
                          ? email.body.substring(0, 100).replace(/<[^>]*>/g, '') + '...'
                          : '[No content]'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64">
                <Mail size={48} className="text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No emails found</h3>
                <p className="text-gray-500">Your inbox is empty or emails are still loading</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCompose && (
        <EmailComposer
          isOpen={showCompose}
          onClose={() => setShowCompose(false)}
        />
      )}
    </div>
  );
}