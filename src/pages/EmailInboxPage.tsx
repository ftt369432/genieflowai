import React, { useState, useCallback, useEffect } from 'react';
import { useEmail } from '../contexts/EmailContext';
import { EmailAccountConnect } from '../components/email/EmailAccountConnect';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Mail, Plus, RefreshCw, Search } from 'lucide-react';
import { useSupabase } from '../providers/SupabaseProvider';
import { cn } from '../lib/utils';
import { Input } from '../components/ui/Input';

export function EmailInboxPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useSupabase();
  const {
    accounts,
    selectedAccountId,
    messages,
    // folders, // Not used directly here, but could be for folder name in title
    loading: emailContextLoading,
    error: emailContextError,
    getMessages,
    // selectAccount, // Not used here, account selection might be in a main layout
  } = useEmail();

  const [searchQuery, setSearchQuery] = useState('');

  // Check if we're on the connect page based on the URL path
  const isConnectPage = location.pathname.endsWith('/email/connect') || location.pathname.endsWith('/email/connect/');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    // If no accounts and not on connect page, and context is not loading accounts, redirect to connect.
    if (accounts.length === 0 && !isConnectPage && !emailContextLoading) {
      navigate('/email/connect');
      return;
    }
    // If an account is selected and not on connect page, load INBOX messages.
    if (selectedAccountId && !isConnectPage && getMessages) {
      // Default to INBOX for this page, no specific currentFolderId state needed here
      getMessages(selectedAccountId, { folderId: 'INBOX', pageSize: 25 });
    }
  }, [user, authLoading, accounts, selectedAccountId, isConnectPage, getMessages, navigate, emailContextLoading]);

  const handleRefreshEmails = useCallback(() => {
    if (selectedAccountId && !isConnectPage) {
      getMessages(selectedAccountId, { folderId: 'INBOX', pageSize: 25, search: searchQuery || undefined });
    }
  }, [selectedAccountId, isConnectPage, getMessages, searchQuery]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (selectedAccountId && !isConnectPage) {
      // Debounce this in a real app
      getMessages(selectedAccountId, { folderId: 'INBOX', pageSize: 25, search: query || undefined });
    }
  }, [selectedAccountId, isConnectPage, getMessages]);

  // If auth is loading OR (email context is loading AND there are no accounts yet to make a decision on connect page)
  if (authLoading || (emailContextLoading && accounts.length === 0 && !isConnectPage) ) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!user && !isConnectPage) {
     // This case should ideally be handled by the useEffect redirecting to /login
    return null; 
  }

  // Render EmailAccountConnect if on the /email/connect path
  if (isConnectPage) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Connect Email Account</h1>
        <EmailAccountConnect 
          onConnectionSuccess={() => {
            toast.success('Email account connected successfully!');
            navigate('/email'); // Navigate to main email page (EmailPage or EmailInboxPage depending on routing)
          }}
          onConnectionError={(errorMsg) => {
            toast.error(errorMsg);
          }}
        />
      </div>
    );
  }
  
  // If no accounts after loading and not on connect page (should have been redirected by useEffect)
  if (accounts.length === 0 && !emailContextLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex flex-col items-center justify-center h-64">
        <Mail size={48} className="text-gray-400 mb-4" />
        <h3 className="text-lg font-medium">No Email Accounts Connected</h3>
        <p className="text-sm text-muted-foreground mb-4">Please connect an email account to view your inbox.</p>
        <Button onClick={() => navigate('/email/connect')}>Connect Account</Button>
      </div>
    );
  }

  // Show the inbox view if not on connect page and accounts are loaded
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Email Inbox</h1>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleRefreshEmails} disabled={emailContextLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => navigate('/email/compose')} className="btn-genie-primary">
              <Plus className="h-4 w-4 mr-2" />
              Compose
            </Button>
        </div>
      </div>
          
      <div className="bg-card border shadow rounded-lg overflow-hidden">
        <div className="bg-muted/30 p-4 border-b">
            <div className="relative w-full sm:w-auto max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type="text"
                placeholder="Search inbox..."
                className="w-full pl-10 pr-4 py-2"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
        </div>
            
        {emailContextLoading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <Spinner className="h-8 w-8" />
          </div>
        ) : messages.length > 0 ? (
          <ul className="divide-y divide-border">
            {messages.map((email) => (
              <li 
                key={email.id} 
                className={cn(
                    "p-4 hover:bg-muted/50 cursor-pointer",
                    !email.isRead && "bg-muted/30"
                )}
                onClick={() => navigate(`/email/message/${selectedAccountId}/${email.id}`)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3 mt-1">
                     <div className={cn("w-2.5 h-2.5 rounded-full", !email.isRead ? "bg-primary" : "bg-transparent")} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-baseline">
                      <p className={cn("text-sm font-medium truncate max-w-[150px] sm:max-w-xs", !email.isRead ? 'text-foreground' : 'text-muted-foreground')}>
                        {email.from}
                      </p>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(email.date).toLocaleDateString()} {new Date(email.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <p className={cn("text-sm truncate", !email.isRead ? 'text-foreground font-semibold' : 'text-muted-foreground')}>
                      {email.subject || "(no subject)"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground truncate">
                      {email.snippet || (email.body && typeof email.body === 'string' 
                        ? email.body.substring(0, 100).replace(/<[^>]*>/g, '')
                        : '[No content preview]')}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center p-4">
            <Mail size={48} className="text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">No emails found</h3>
            <p className="text-sm text-muted-foreground">
                {searchQuery 
                    ? `No emails found for "${searchQuery}" in your inbox.`
                    : "Your inbox is empty or emails are still loading."}
            </p>
            {emailContextError && <p className="text-sm text-destructive mt-2">Error: {emailContextError.message}</p>}
          </div>
        )}
      </div>
    </div>
  );
} 