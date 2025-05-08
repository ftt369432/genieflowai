import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Search, Inbox, Send, Archive, Trash, Mail, RefreshCw, Folder as FolderIcon } from 'lucide-react';
import { useEmail } from '../contexts/EmailContext';
import { EmailComposer } from '../components/email/EmailComposer';
import { EmailDetail } from '../components/email/EmailDetail';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { useNavigate, useParams } from 'react-router-dom';
import { useSupabase } from '../providers/SupabaseProvider';
import { cn } from '../lib/utils';
import { EmailMessage, EmailDraft, EmailAccount } from '../services/email/types';
import emailServiceAdapter from '../services/email/EmailServiceAdapter';
import { toast } from 'sonner';

// Define the type for replyTo data directly, matching EmailComposer's expectation
interface ComposerReplyData {
  messageId: string;
  subject: string;
  to: string; // Original sender
  body: string;
}

// Define the type for forwardFrom data, matching EmailComposer's expectation
interface ComposerForwardData {
  messageId: string;
  subject: string;
  body: string;
}

// Define the type for ComposerReplyAllData
interface ComposerReplyAllData {
  messageId: string;
  subject: string;
  to: string[];
  cc: string[];
  body: string;
}

export function EmailPage() {
  const navigate = useNavigate();
  const params = useParams<{ accountId?: string; folderId?: string; messageId?: string }>();
  const { accountId: routeAccountId, folderId: routeFolderId, messageId: routeMessageId } = params;
  console.log('EmailPage: Route params:', params);

  const { user, loading: authLoading } = useSupabase();
  const {
    accounts,
    selectedAccountId,
    messages,
    folders,
    loading: emailContextLoading,
    error: emailContextError,
    getMessages,
    selectAccount,
  } = useEmail();

  const [showCompose, setShowCompose] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState<string>((routeFolderId || 'INBOX').toUpperCase());
  const [detailedEmail, setDetailedEmail] = useState<EmailMessage | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<Error | null>(null);
  const [composerReplyData, setComposerReplyData] = useState<ComposerReplyData | undefined>(undefined);
  const [composerForwardData, setComposerForwardData] = useState<ComposerForwardData | undefined>(undefined);
  const [composerReplyAllData, setComposerReplyAllData] = useState<ComposerReplyAllData | undefined>(undefined);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    if (accounts.length === 0 && !emailContextLoading && !authLoading) { // ensure accounts are checked after auth
      navigate('/email/connect');
      return;
    }

    const accountIdToUse = routeAccountId || selectedAccountId;
    if (accountIdToUse && getMessages && currentFolderId && !routeMessageId) {
      console.log(`EmailPage: Initial message fetch for list. Account: ${accountIdToUse}, Folder: ${currentFolderId}`);
      getMessages(accountIdToUse, { folderId: currentFolderId, pageSize: 25 });
    }
  }, [user, authLoading, accounts, routeAccountId, selectedAccountId, getMessages, currentFolderId, navigate, emailContextLoading, routeMessageId]);

  useEffect(() => {
    if (routeFolderId) {
      setCurrentFolderId(routeFolderId.toUpperCase());
    } else if (!routeMessageId) { // Only default to INBOX if not viewing a specific message
      setCurrentFolderId('INBOX');
    }
  }, [routeFolderId, routeMessageId]);

  useEffect(() => {
    console.log('EmailPage: Detail fetch useEffect triggered. Params:', { routeAccountId, routeMessageId });
    const fetchEmailDetails = async (accId: string, msgId: string) => {
      console.log(`EmailPage: Fetching details for account ${accId}, message ${msgId}`);
      setDetailLoading(true);
      setDetailError(null);
      setDetailedEmail(null); // Clear previous email
      try {
        const result = await emailServiceAdapter.getMessage(accId, msgId);
        if (result.message) {
          setDetailedEmail(result.message);
        } else {
          setDetailError(new Error('Email not found.'));
          console.error(`EmailPage: emailServiceAdapter.getMessage returned null for ${msgId}`);
        }
      } catch (err) {
        console.error('EmailPage: Error fetching email details:', err);
        setDetailError(err instanceof Error ? err : new Error('Failed to load email details'));
      } finally {
        setDetailLoading(false);
      }
    };

    if (routeAccountId && routeMessageId) {
      fetchEmailDetails(routeAccountId, routeMessageId);
    } else {
      console.log('EmailPage: routeMessageId is undefined, clearing detailedEmail and ensuring not in detail loading state.');
      setDetailedEmail(null);
      setDetailLoading(false); // Ensure detailLoading is false if no messageId
      setDetailError(null);
    }
  }, [routeAccountId, routeMessageId]);

  const handleRefreshEmails = useCallback(() => {
    const accId = routeAccountId || selectedAccountId;
    if (accId && currentFolderId && !routeMessageId) { // Refresh list view only
      getMessages(accId, { folderId: currentFolderId, pageSize: 25, search: searchQuery || undefined });
    } else if (accId && routeMessageId) { // Potentially re-fetch detail view if needed, or rely on cache
        // For now, detail view re-fetches via its own useEffect if routeMessageId changes.
        // Manual refresh for detail view could be added here if desired.
        toast.info("Email detail refreshed (or re-fetched if changed).")
    }
  }, [routeAccountId, selectedAccountId, currentFolderId, getMessages, searchQuery, routeMessageId]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    const accId = routeAccountId || selectedAccountId;
    if (accId && currentFolderId && !routeMessageId) { // Search only in list view
      getMessages(accId, { folderId: currentFolderId, pageSize: 25, search: query || undefined });
    }
  }, [routeAccountId, selectedAccountId, currentFolderId, getMessages, routeMessageId]);

  const handleFolderSelect = useCallback((folderId: string) => {
    const accId = routeAccountId || selectedAccountId;
    if (accId) {
      const normalizedFolderId = folderId.toUpperCase();
      // No need to setCurrentFolderId here as navigate will trigger useEffect for folderId
      setSearchQuery(''); // Clear search when changing folder
      navigate(`/email/folder/${accId}/${normalizedFolderId}`);
    }
  }, [routeAccountId, selectedAccountId, navigate]);
  
  const handleCloseDetailView = () => {
    console.log('[EmailPage] handleCloseDetailView called');
    const accId = routeAccountId || selectedAccountId;
    // Navigate back to the folder the user was in, or a default like INBOX
    // currentFolderId should reflect the folder of the detailedEmail, or last selected folder
    const targetFolder = routeFolderId || currentFolderId || 'INBOX';
    if (accId) {
      navigate(`/email/folder/${accId}/${targetFolder}`);
    }
    // detailedEmail, detailLoading, detailError will be reset by the detail fetch useEffect
    // when routeMessageId becomes undefined.
  };

  const handleReply = useCallback(() => {
    console.log('[EmailPage] handleReply called');
    if (detailedEmail) {
      const replyData: ComposerReplyData = {
        messageId: detailedEmail.id,
        subject: `Re: ${detailedEmail.subject}`,
        to: detailedEmail.from,
        body: `\n\n--- Original Message ---\nFrom: ${detailedEmail.from}\nTo: ${Array.isArray(detailedEmail.to) ? detailedEmail.to.join(', ') : detailedEmail.to}\nDate: ${new Date(detailedEmail.date).toLocaleString()}\nSubject: ${detailedEmail.subject}\n\n${detailedEmail.body || ''}`,
      };
      setComposerReplyData(replyData);
      setComposerForwardData(undefined);
      setComposerReplyAllData(undefined);
      setShowCompose(true);
    }
  }, [detailedEmail]);

  const handleReplyAll = useCallback(() => {
    console.log('[EmailPage] handleReplyAll called');
    if (detailedEmail && user && accounts) {
      const currentAccount = accounts.find(acc => acc.id === (routeAccountId || selectedAccountId));
      const currentUserEmail = currentAccount?.email?.toLowerCase();

      let toRecipients: string[] = [];
      if (detailedEmail.from && detailedEmail.from.toLowerCase() !== currentUserEmail) {
        toRecipients.push(detailedEmail.from);
      }

      let ccRecipients: string[] = [];
      const processRecipients = (recipients: string | string[] | undefined) => {
        if (!recipients) return [];
        return (Array.isArray(recipients) ? recipients : [recipients])
          .map(r => r.toLowerCase())
          .filter(r => r !== currentUserEmail && !toRecipients.map(tr => tr.toLowerCase()).includes(r));
      };
      
      ccRecipients.push(...processRecipients(detailedEmail.to));
      ccRecipients.push(...processRecipients(detailedEmail.cc));
      
      if (detailedEmail.from && !toRecipients.map(tr => tr.toLowerCase()).includes(detailedEmail.from.toLowerCase()) && detailedEmail.from.toLowerCase() !== currentUserEmail) {
        toRecipients.unshift(detailedEmail.from);
      }
      if(toRecipients.length === 0 && detailedEmail.from && detailedEmail.from.toLowerCase() !== currentUserEmail) {
          toRecipients.push(detailedEmail.from);
      }


      const replyAllData: ComposerReplyAllData = {
        messageId: detailedEmail.id,
        subject: `Re: ${detailedEmail.subject}`,
        to: [...new Set(toRecipients)],
        cc: [...new Set(ccRecipients)],
        body: `\n\n--- Original Message ---\nFrom: ${detailedEmail.from}\nTo: ${Array.isArray(detailedEmail.to) ? detailedEmail.to.join(', ') : detailedEmail.to}\nCc: ${Array.isArray(detailedEmail.cc) ? detailedEmail.cc.join(', ') : detailedEmail.cc || ''}\nDate: ${new Date(detailedEmail.date).toLocaleString()}\nSubject: ${detailedEmail.subject}\n\n${detailedEmail.body || ''}`,
      };
      setComposerReplyAllData(replyAllData);
      setComposerReplyData(undefined);
      setComposerForwardData(undefined);
      setShowCompose(true);
    }
  }, [detailedEmail, user, accounts, routeAccountId, selectedAccountId]);

  const handleForward = useCallback(() => {
    console.log('[EmailPage] handleForward called');
    if (detailedEmail) {
      const forwardData: ComposerForwardData = {
        messageId: detailedEmail.id,
        subject: `Fwd: ${detailedEmail.subject}`,
        body: `\n\n--- Forwarded Message ---\nFrom: ${detailedEmail.from}\nTo: ${Array.isArray(detailedEmail.to) ? detailedEmail.to.join(', ') : detailedEmail.to}\nDate: ${new Date(detailedEmail.date).toLocaleString()}\nSubject: ${detailedEmail.subject}\n\n${detailedEmail.body || ''}`,
      };
      setComposerForwardData(forwardData);
      setComposerReplyData(undefined);
      setComposerReplyAllData(undefined);
      setShowCompose(true);
    }
  }, [detailedEmail]);

  const handleArchive = useCallback(async () => {
    const accountIdToArchive = routeAccountId || selectedAccountId;
    if (!detailedEmail || !accountIdToArchive) {
      toast.error('Cannot archive email: Missing email details or account ID.');
      return;
    }
    const messageId = detailedEmail.id;
    try {
      await toast.promise(
        emailServiceAdapter.archiveMessage(accountIdToArchive, messageId),
        {
          loading: 'Archiving email...',
          success: () => {
            handleCloseDetailView(); // Navigate back to list view
            // Optionally, refresh the list from where the email was archived
            // getMessages(accountIdToArchive, { folderId: currentFolderId, pageSize: 25 });
            return 'Email archived successfully!';
          },
          error: 'Failed to archive email.',
        }
      );
    } catch (error) {
      console.error('Error invoking archiveMessage:', error);
      toast.error('An unexpected error occurred while trying to archive.');
    }
  }, [detailedEmail, selectedAccountId, routeAccountId, navigate, currentFolderId, getMessages, handleCloseDetailView]);

  const handleDelete = useCallback(async () => {
    const accountIdToDelete = routeAccountId || selectedAccountId;
    if (!detailedEmail || !accountIdToDelete) {
      toast.error('Cannot delete email: Missing email details or account ID.');
      return;
    }
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the email "${detailedEmail.subject}"? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    const messageId = detailedEmail.id;
    try {
      await toast.promise(
        emailServiceAdapter.deleteMessage(accountIdToDelete, messageId),
        {
          loading: 'Deleting email...',
          success: () => {
            handleCloseDetailView(); // Navigate back to list view
            return 'Email deleted successfully!';
          },
          error: 'Failed to delete email.',
        }
      );
    } catch (error) {
      console.error('Error invoking deleteMessage:', error);
      toast.error('An unexpected error occurred while trying to delete.');
    }
  }, [detailedEmail, selectedAccountId, routeAccountId, navigate, currentFolderId, getMessages, handleCloseDetailView]);

  const handleComposerSend = useCallback(async (draft: EmailDraft) => {
    const accountIdToSendFrom = draft.accountId || routeAccountId || selectedAccountId;
    if (!accountIdToSendFrom) {
      toast.error('Cannot send email: Account ID is missing.');
      return;
    }
    try {
      await toast.promise(
          emailServiceAdapter.sendMessage(accountIdToSendFrom, draft),
          {
              loading: 'Sending email...',
              success: () => {
                  setShowCompose(false);
                  setComposerReplyData(undefined);
                  setComposerForwardData(undefined);
                  setComposerReplyAllData(undefined);
                  if (currentFolderId && !routeMessageId) { // Refresh list if in list view
                     getMessages(accountIdToSendFrom, { folderId: currentFolderId, pageSize: 25 });
                  } else if (routeMessageId) { // If sending from detail view, perhaps refresh that specific email or related thread
                    // For now, just closes composer.
                  }
                  return 'Email sent successfully!';
              },
              error: 'Failed to send email.',
          }
      );
    } catch (error) {
      console.error('Error invoking sendMessage:', error);
      toast.error('An unexpected error occurred while trying to send.');
    }
  }, [selectedAccountId, routeAccountId, currentFolderId, getMessages, routeMessageId]);

  const handleComposerSaveDraft = useCallback(async (draft: EmailDraft) => {
      const accountIdToSaveTo = draft.accountId || routeAccountId || selectedAccountId;
      if (!accountIdToSaveTo) {
        toast.error('Cannot save draft: Account ID is missing.');
        return;
      }
      try {
          // await emailServiceAdapter.saveDraft(accountIdToSaveTo, draft);
          toast.info('Draft saved (mock - implementation pending).');
      } catch(error) {
          console.error('EmailPage: Failed to save draft:', error);
          toast.error('Failed to save draft.');
      }
  }, [selectedAccountId, routeAccountId]);

  console.log('[EmailPage] Values JUST BEFORE RENDER LOGIC:', {
    showCompose, routeMessageId, detailedEmail: !!detailedEmail, detailLoading,
    emailContextLoading, messagesLength: messages.length, currentFolderId
  });

  // General loading state (auth, or initial account/folder load for list view)
  if (authLoading || (emailContextLoading && messages.length === 0 && !routeMessageId && !detailedEmail && !detailError)) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner className="h-8 w-8" /> Loading page...
      </div>
    );
  }

  if (!user) return null; // Should be caught by useEffect, but good guard

  // === Full Page Email Detail View ===
  if (routeMessageId) {
    let detailPageContent;
    if (detailLoading) {
      detailPageContent = (
        <div className="flex justify-center items-center h-full">
          <Spinner className="h-8 w-8" /> Loading Email...
        </div>
      );
    } else if (detailError) {
      detailPageContent = (
        <div className="p-4 text-destructive text-center">
          <p>Error loading email: {detailError.message}</p>
          <Button onClick={handleCloseDetailView} variant="outline" className="mt-4">
            Back to Emails
          </Button>
        </div>
      );
    } else if (detailedEmail) {
      detailPageContent = (
        <EmailDetail 
          email={detailedEmail} 
          onClose={handleCloseDetailView}
          onReply={handleReply}
          onForward={handleForward}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onSetFollowUp={(date) => console.log('Set followup:', date)} // Placeholder
          onReplyAll={handleReplyAll}
        />
      );
    } else { // Fallback if no detail, no error, no loading (e.g., email not found after fetch)
      detailPageContent = (
        <div className="p-4 text-muted-foreground text-center">
          <p>The requested email was not found or is still loading.</p>
          <Button onClick={handleCloseDetailView} variant="outline" className="mt-4">
            Back to Emails
          </Button>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col bg-background"> {/* Ensure EmailDetail takes full page */}
        {detailPageContent}
        {showCompose && (
          <EmailComposer
            isOpen={showCompose}
            onClose={() => {
              setShowCompose(false);
              setComposerReplyData(undefined);
              setComposerForwardData(undefined);
              setComposerReplyAllData(undefined);
            }}
            onSend={handleComposerSend}
            onSaveDraft={handleComposerSaveDraft}
            replyTo={composerReplyData}
            forwardFrom={composerForwardData}
            replyAllTo={composerReplyAllData}
            accountId={routeAccountId || selectedAccountId} 
          />
        )}
      </div>
    );
  }

  // === Email List View (Default View) ===
  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-2xl font-bold">My Emails</h1>
        <div className="flex items-center space-x-3">
          {accounts.length > 1 && (
            <select 
              value={selectedAccountId || ''}
              onChange={(e) => {
                const newAccountId = e.target.value;
                selectAccount(newAccountId); // Update context
                // Navigate to the same folder (or default) for the new account
                navigate(`/email/folder/${newAccountId}/${currentFolderId || 'INBOX'}`);
              }}
              className="p-2 border rounded-md bg-background text-foreground"
            >
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name || acc.email}</option>)}
            </select>
          )}
          <Button variant="outline" onClick={handleRefreshEmails} disabled={emailContextLoading && !routeMessageId}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => {
            setComposerReplyData(undefined); 
            setComposerForwardData(undefined);
            setComposerReplyAllData(undefined);
            setShowCompose(true);
          }} className="btn-genie-primary">
            <Plus className="h-4 w-4 mr-2" />
            Compose
          </Button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Email Sidebar */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-y-auto">
          <div className="p-4">
            <Button className="w-full gap-2 btn-genie-primary" onClick={() => {
               setComposerReplyData(undefined);
               setComposerForwardData(undefined);
               setComposerReplyAllData(undefined);
               setShowCompose(true);
            }}>
              <Plus className="h-4 w-4" />
              Compose
            </Button>
          </div>
          <nav className="flex-1 px-2 py-2 space-y-1">
            {folders.map(folder => {
              let IconComponent = FolderIcon;
              if (folder.id.toUpperCase() === 'INBOX') IconComponent = Inbox;
              if (folder.id.toUpperCase() === 'SENT') IconComponent = Send;
              if (folder.id.toUpperCase() === 'ARCHIVE') IconComponent = Archive;
              if (folder.id.toUpperCase() === 'TRASH' || folder.name.toUpperCase() === 'TRASH' || folder.id.toUpperCase() === 'DELETED' ) IconComponent = Trash;
              
              return (
                <a
                  key={folder.id}
                  href="#"
                  onClick={(e) => { e.preventDefault(); handleFolderSelect(folder.id); }}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm rounded-md",
                    currentFolderId === folder.id.toUpperCase() // Ensure comparison is consistent
                      ? "bg-muted text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <IconComponent className="h-4 w-4 mr-3" />
                  <span className="flex-1 truncate">{folder.name}</span>
                  {folder.unreadCount > 0 && (
                     <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                      {folder.unreadCount}
                    </span>
                  )}
                </a>
              );
            })}
          </nav>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Account</h3>
            {selectedAccountId && accounts.find(acc => acc.id === selectedAccountId) && (
              <div className="flex items-center p-2 text-sm">
                <Mail className="h-4 w-4 mr-2 text-gray-500" />
                <span className="truncate">{accounts.find(acc => acc.id === selectedAccountId)?.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Email List Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder={`Search in ${folders.find(f => f.id.toUpperCase() === currentFolderId)?.name || 'emails'}...`}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {(emailContextLoading && messages.length === 0) ? (
              <div className="flex justify-center items-center h-64">
                <Spinner className="h-8 w-8" /> Loading messages...
              </div>
            ) : messages.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {messages.map((email) => (
                  <div 
                    key={email.id} 
                    className={cn(
                        "flex items-start gap-4 p-4 hover:bg-muted/80 dark:hover:bg-muted/20 cursor-pointer",
                        !email.isRead && "bg-muted/50 dark:bg-muted/10"
                    )}
                    onClick={() => {
                      const accountToNavigate = selectedAccountId || routeAccountId || accounts[0]?.id;
                      if (accountToNavigate) {
                        navigate(`/email/message/${accountToNavigate}/${email.id}`);
                      } else {
                        console.error("No account ID available for navigation to message detail.");
                        toast.error("Could not open email: Account not identified.")
                      }
                    }}
                  >
                    <div className={cn("w-2 h-2 rounded-full mt-1.5", !email.isRead ? "bg-primary" : "bg-transparent")} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between">
                        <span className={cn("font-medium truncate max-w-[200px] sm:max-w-[300px]", !email.isRead ? 'text-foreground' : 'text-muted-foreground')}>
                          {email.from}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(email.date).toLocaleDateString()} {new Date(email.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h4 className={cn("font-medium mt-0.5 truncate", !email.isRead ? 'text-foreground' : 'text-muted-foreground')}>
                        {email.subject || "(no subject)"}
                      </h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {email.snippet || (email.body && typeof email.body === 'string'
                          ? email.body.substring(0, 150).replace(/<[^>]*>/g, '')
                          : '[No content preview]')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <Mail size={48} className="text-gray-400 mb-4" />
                <h3 className="text-lg font-medium">No emails found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery 
                    ? `No emails found for "${searchQuery}" in ${folders.find(f => f.id.toUpperCase() === currentFolderId)?.name || 'this folder'}.`
                    : `Your ${folders.find(f => f.id.toUpperCase() === currentFolderId)?.name || 'folder'} is empty.`}
                </p>
                {emailContextError && <p className="text-sm text-destructive mt-2">Error: {emailContextError.message}</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCompose && (
        <EmailComposer
          isOpen={showCompose}
          onClose={() => {
            setShowCompose(false);
            setComposerReplyData(undefined);
            setComposerForwardData(undefined);
            setComposerReplyAllData(undefined);
          }}
          onSend={handleComposerSend}
          onSaveDraft={handleComposerSaveDraft}
          replyTo={composerReplyData}
          forwardFrom={composerForwardData}
          replyAllTo={composerReplyAllData}
          accountId={selectedAccountId}
        />
      )}
    </div>
  );
}