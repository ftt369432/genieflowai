import React, { useState, useEffect } from 'react';
import { useEmail } from '../contexts/EmailContext';
import { EmailAccountConnect } from '../components/email/EmailAccountConnect';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Mail, Plus, RefreshCw, Search } from 'lucide-react';
import { useSupabase } from '../providers/SupabaseProvider';

export function EmailInboxPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useSupabase();
  const { accounts, selectedAccountId, getMessages } = useEmail();
  const [isLoading, setIsLoading] = useState(false);
  const [emails, setEmails] = useState<any[]>([]);

  // Check if we're on the connect page
  const isConnectPage = location.pathname.endsWith('/connect');

  useEffect(() => {
    // Wait for auth to complete before making decisions
    if (authLoading) return;
    
    // If user is not authenticated, redirect to login
    if (!user) {
      navigate('/login');
      return;
    }

    // If no accounts, navigate to connect page
    if (accounts.length === 0 && !isConnectPage) {
      navigate('/email/connect');
      return;
    }

    // If we have accounts and we're on the main email page, load emails
    if (accounts.length > 0 && selectedAccountId && !isConnectPage) {
      loadEmails();
    }
  }, [accounts, selectedAccountId, isConnectPage, user, authLoading]);

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
      <div className="container mx-auto py-8 px-4 flex justify-center items-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // If not authenticated, redirect (this should be handled by the effect)
  if (!user) {
    return null;
  }

  // If we're on the connect page, show the account connect component
  if (isConnectPage) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Connect Email Account</h1>
        <EmailAccountConnect 
          onConnectionSuccess={() => {
            toast.success('Email account connected successfully!');
            navigate('/email');
          }}
          onConnectionError={(error) => {
            toast.error(error);
          }}
        />
      </div>
    );
  }

  // If no accounts, show a loading state (should redirect soon)
  if (accounts.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // Show the inbox view
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Email Inbox</h1>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={loadEmails}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => navigate('/email/compose')}>
              <Plus className="h-4 w-4 mr-2" />
              Compose
            </Button>
            </div>
          </div>
          
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner className="h-8 w-8" />
        </div>
      ) : emails.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gray-50 p-4 border-b">
            <div className="flex justify-between items-center">
              <div className="w-64 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text"
                  placeholder="Search emails..."
                  className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              </div>
            </div>
            
          <ul className="divide-y divide-gray-200">
            {emails.map((email) => (
              <li key={email.id} className="p-4 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${email.read ? 'bg-gray-200' : 'bg-blue-500 text-white'}`}>
                      <Mail size={20} />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between">
                      <p className={`text-sm font-medium ${email.read ? 'text-gray-600' : 'text-gray-900'}`}>
                        {email.from}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(email.date).toLocaleDateString()}
                      </p>
                    </div>
                    <p className={`text-sm ${email.read ? 'text-gray-500' : 'text-gray-900 font-medium'}`}>
                      {email.subject}
                    </p>
                    <p className="mt-1 text-sm text-gray-500 truncate">
                      {email.body && typeof email.body === 'string' 
                        ? email.body.substring(0, 100).replace(/<[^>]*>/g, '') + '...'
                        : '[No content]'}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
          <Mail size={48} className="text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No emails found</h3>
          <p className="text-gray-500">Your inbox is empty or emails are still loading</p>
        </div>
      )}
    </div>
  );
} 