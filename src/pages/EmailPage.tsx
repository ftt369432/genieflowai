import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, Search, Inbox, Send, Archive, Trash, Mail, RefreshCw, Folder as FolderIcon, Calendar as CalendarIcon } from 'lucide-react';
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
import { EmailToolbar } from '../components/email/EmailToolbar';
// import { EmailEmptyState } from '../components/email/EmailEmptyState'; // Temporarily commented out
// Import the main emailService
import emailServiceInstance from '../services/email/emailService'; // Renamed to avoid conflict if adapter also exports 'emailService'
import { useCalendarStore } from '../store/calendarStore'; // Added import
import { useEmailSelection } from '../hooks/useEmailSelection'; // Import the hook
import { Switch } from '../components/ui/Switch'; // Ensure Switch is imported
import { Label } from '../components/ui/Label';   // For associating with the Switch

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
  console.log('EmailPage: Route params destructured:', { routeAccountId, routeFolderId, routeMessageId });

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
  const { addEvent: addCalendarEventToStore, updateEvent: updateCalendarEventInStore } = useCalendarStore(); // Get store functions
  const { selectedEmails, toggleSelect, selectAll, clearSelection } = useEmailSelection(); // Instantiate the hook
  const [isAutoCalendarEnabled, setIsAutoCalendarEnabled] = useState(false); // New state for the toggle
  const [autoProcessedIds, setAutoProcessedIds] = useState<Set<string>>(new Set()); // New state for session tracking

  // Store getMessages in a ref to keep a stable reference for the useEffect
  const getMessagesRef = useRef(getMessages);
  useEffect(() => {
    getMessagesRef.current = getMessages;
  }, [getMessages]);

  const [showCompose, setShowCompose] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState<string>((routeFolderId || 'INBOX').toUpperCase());
  const [detailedEmail, setDetailedEmail] = useState<EmailMessage | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<Error | null>(null);
  const [composerReplyData, setComposerReplyData] = useState<ComposerReplyData | undefined>(undefined);
  const [composerForwardData, setComposerForwardData] = useState<ComposerForwardData | undefined>(undefined);
  const [composerReplyAllData, setComposerReplyAllData] = useState<ComposerReplyAllData | undefined>(undefined);

  // ADDED LOG START
  console.log(
    `%c[EmailPage] Attempting to render list for folder: ${currentFolderId}.%c Messages in context (%c${messages ? messages.length : 'N/A'}%c):`,
    'color:MediumTurquoise; font-weight:bold;',
    'color:default;',
    'font-weight:bold;',
    'color:default;',
    messages && messages.length > 0
      ? messages.slice(0, 5).map(m => ({ id: m.id, subject: m.subject, date: m.date }))
      : (messages ? 'Context messages array is empty' : 'Context messages is null/undefined')
  );
  // ADDED LOG END

  useEffect(() => {
    if (routeFolderId) {
      setCurrentFolderId(routeFolderId.toUpperCase());
    } else if (!routeMessageId) { // Only default to INBOX if not viewing a specific message
      setCurrentFolderId('INBOX');
    }
  }, [routeFolderId, routeMessageId]);

  useEffect(() => {
    if (!authLoading && user && accounts.length === 0 && !emailContextLoading) {
      console.log('EmailPage: No accounts found, navigating to /email/connect');
      navigate('/email/connect');
    }
  }, [user, authLoading, accounts, emailContextLoading, navigate]);

  useEffect(() => {
    if (authLoading || !user) return; // Wait for auth, ensure user exists

    const accountIdToUse = routeAccountId || selectedAccountId;
    const hasCurrentFolder = typeof currentFolderId === 'string' && currentFolderId !== '';
    const isNotDetailView = typeof routeMessageId === 'undefined' || routeMessageId === '';

    // Explicit checks for currentFolderId and routeMessageId
    if (accountIdToUse && hasCurrentFolder && isNotDetailView) {
      console.log(`EmailPage: Message fetch for list. Account: ${accountIdToUse}, Folder: ${currentFolderId}`);
      getMessagesRef.current(accountIdToUse, { folderId: currentFolderId, pageSize: 25 }); // Restore fetch call
    }
  }, [user, authLoading, routeAccountId, selectedAccountId, currentFolderId, routeMessageId]);

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
      getMessagesRef.current(accId, { folderId: currentFolderId, pageSize: 25, search: searchQuery || undefined });
    } else if (accId && routeMessageId) { // Potentially re-fetch detail view if needed, or rely on cache
        // For now, detail view re-fetches via its own useEffect if routeMessageId changes.
        // Manual refresh for detail view could be added here if desired.
        toast.info("Email detail refreshed (or re-fetched if changed).")
    }
  }, [routeAccountId, selectedAccountId, currentFolderId, getMessagesRef, searchQuery, routeMessageId]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    const accId = routeAccountId || selectedAccountId;
    if (accId && currentFolderId && !routeMessageId) { // Search only in list view
      getMessagesRef.current(accId, { folderId: currentFolderId, pageSize: 25, search: query || undefined });
    }
  }, [routeAccountId, selectedAccountId, currentFolderId, getMessagesRef, routeMessageId]);

  const handleFolderSelect = useCallback((folderId: string) => {
    const accId = routeAccountId || selectedAccountId;
    if (accId) {
      const normalizedFolderId = folderId.toUpperCase();
      // setSearchQuery(''); // Temporarily remove to simplify
      console.log(`[EmailPage] handleFolderSelect: Navigating to /email/folder/${accId}/${normalizedFolderId}`);
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
  }, [detailedEmail, selectedAccountId, routeAccountId, navigate, currentFolderId, getMessagesRef, handleCloseDetailView]);

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
  }, [detailedEmail, selectedAccountId, routeAccountId, navigate, currentFolderId, getMessagesRef, handleCloseDetailView]);

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
                     getMessagesRef.current(accountIdToSendFrom, { folderId: currentFolderId, pageSize: 25 });
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
  }, [selectedAccountId, routeAccountId, currentFolderId, getMessagesRef, routeMessageId]);

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

  const handleAnalyzeAndCalendar = async (emailToAnalyze: EmailMessage) => {
    if (!emailToAnalyze) {
      toast.error('No email selected for analysis.');
      return;
    }
    console.log(`[EmailPage] Triggering analysis for email: ${emailToAnalyze.id} - Subject: ${emailToAnalyze.subject}`);
    toast.info(`Analyzing email: "${emailToAnalyze.subject}"...`, { duration: 10000 }); // Extended duration

    try {
      // This now directly calls the instance method
      const analysisResult = await emailServiceInstance.analyzeEmail(emailToAnalyze);
      console.log('[EmailPage] Analysis Result:', analysisResult);

      if (analysisResult && analysisResult.error) {
        toast.error(`Analysis Error: ${analysisResult.error}`);
      } else if (analysisResult && (analysisResult.calendarEventStatus === 'created' || analysisResult.calendarEventStatus === 'updated')) {
        toast.success(
          `Calendar event ${analysisResult.calendarEventStatus}: ${analysisResult.calendarEventDetails?.summary}`,
          {
            description: `Event ID: ${analysisResult.calendarEventId}`,
            action: analysisResult.calendarEventDetails?.htmlLink
              ? {
                  label: 'View Event',
                  onClick: () => window.open(analysisResult.calendarEventDetails.htmlLink, '_blank'),
                }
              : undefined,
          }
        );

        // Update the Zustand calendar store
        if (analysisResult.calendarEventDetails && analysisResult.calendarEventId) {
          const googleEvent = analysisResult.calendarEventDetails; // This is the Google Calendar Event object
          const storeEventPayload = {
            // id: analysisResult.calendarEventId, // The store's addEvent generates ID, updateEvent uses it
            title: googleEvent.summary || 'Untitled Event',
            start: googleEvent.start?.dateTime ? new Date(googleEvent.start.dateTime) : new Date(),
            end: googleEvent.end?.dateTime ? new Date(googleEvent.end.dateTime) : new Date(),
            description: googleEvent.description || '',
            location: googleEvent.location || '',
            allDay: !!googleEvent.start?.date, // if only 'date' is present, it's an all-day event
            sourceId: 'google-primary', // Assuming a source for Google Calendar events
            url: googleEvent.htmlLink,
            attendees: googleEvent.attendees?.map((att: any) => att.email).filter(Boolean) || [],
            tags: ['email-analysis', `case-${googleEvent.extendedProperties?.private?.genieflowCaseNumber || 'unknown'}`],
          };

          if (analysisResult.calendarEventStatus === 'created') {
            console.log('[EmailPage] Adding new event to calendar store:', storeEventPayload);
            const newStoreEventId = addCalendarEventToStore({
              ...storeEventPayload,
              // For addEvent, we omit 'id' as the store generates it.
              // However, we need to ensure the Google Event ID is stored somewhere if we need to map back later
              // For now, the store's own ID will be primary for store operations.
              // We could add googleEvent.id to a custom field in the store's CalendarEvent type if needed.
            });
            console.log('[EmailPage] Event added to store with new ID:', newStoreEventId);
          } else if (analysisResult.calendarEventStatus === 'updated') {
            // For updateEvent, the ID must be the store's ID if they differ.
            // This assumes the event being updated was already in the store and we know its store ID.
            // This is a GAP: If the event was updated in Google but wasn't in the store or we don't know its store ID,
            // this update will fail or update the wrong event.
            // For now, let's assume we'd need a lookup: find event in store by googleEvent.id (if stored) or by caseNumber, then update.
            // As a simpler first step, if we have analysisResult.calendarEventId (which is the Google ID),
            // and if the store also uses Google IDs, this could work.
            // The current calendarStore.updateEvent takes its own internal ID.
            // THIS PART NEEDS REFINEMENT based on how existing events are fetched/stored.
            // For now, let's try to update if an event with this Google ID is found (hypothetically).
            
            // Let's try to update the event in the store using the Google Event ID.
            // This requires that the store's 'id' field for Google events IS the Google event ID.
            // If `calendarStore.ts` was modified to use Google's event ID for events synced from Google, this would work.
            // Otherwise, we need a way to map Google event ID to store event ID.
            
            // TEMPORARY: For now, let's assume the ID is the Google Event ID for events coming from Google.
            // This is a significant assumption about calendarStore's behavior for external events.
            console.log(`[EmailPage] Updating event in calendar store (ID: ${analysisResult.calendarEventId}):`, storeEventPayload);
            updateCalendarEventInStore(analysisResult.calendarEventId, {
              ...storeEventPayload,
              id: analysisResult.calendarEventId, // Explicitly pass the ID for update
            });
             console.log('[EmailPage] Store update call made for event ID:', analysisResult.calendarEventId);
          }
        }

      } else if (analysisResult && analysisResult.isMeeting === false) {
        toast.info('Email does not appear to be a meeting.');
      } else {
        toast.error('Could not analyze email or determine calendar action.');
      }
    } catch (error) {
      console.error('[EmailPage] Error during manual analysis trigger:', error);
      toast.error('Failed to analyze email. See console for details.');
    }
  };

  const handleBatchCalendarAnalysis = async () => {
    if (selectedEmails.length === 0) {
      toast.info("No emails selected for calendaring.");
      return;
    }
    const emailsToProcess = messages.filter(email => selectedEmails.includes(email.id));
    if (emailsToProcess.length === 0) {
        toast.error("Selected emails could not be found. Please refresh.");
        clearSelection(); 
        return;
    }
    toast.info(`Batch Calendar: Starting to process ${emailsToProcess.length} email(s)...`, { duration: 5000 });
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < emailsToProcess.length; i++) {
      const email = emailsToProcess[i];
      try {
        console.log(`Batch Calendar: Analyzing email ID ${email.id} - ${email.subject}`);
        const analysisResult = await emailServiceInstance.analyzeEmail(email); 
        
        if (analysisResult?.calendarEventStatus === 'created' || analysisResult?.calendarEventStatus === 'updated') {
          toast.success(`Batch Calendar: Event ${analysisResult.calendarEventStatus} for "${email.subject?.substring(0,30) || 'email'}..." (Case: ${analysisResult.meetingDetails?.caseNumber || 'N/A'})`);
          successCount++;
        } else if (analysisResult?.calendarEventStatus === 'skipped_no_case_number' || analysisResult?.calendarEventStatus === 'skipped_no_hearing_details') {
           toast.info(`Batch Calendar: Skipped "${email.subject?.substring(0,30) || 'email'}...": ${analysisResult.error || 'No relevant details'}`);
           skippedCount++;
        } else if (analysisResult?.calendarEventStatus === 'error' || analysisResult?.error) {
          toast.error(`Batch Calendar Error: "${email.subject?.substring(0,30) || 'email'}...": ${analysisResult.error || 'Unknown error'}`);
          errorCount++;
        } else {
           console.log('Batch Calendar: Unhandled analysis result:', analysisResult);
           skippedCount++;
        }
      } catch (error: any) {
        console.error(`Batch Calendar: Error processing email ${email.id}:`, error);
        toast.error(`Batch Calendar Failed: "${email.subject?.substring(0,30) || 'email'}...": ${error.message || 'Unknown error'}`);
        errorCount++;
      }
      // Add delay after processing each email, unless it's the very last one
      if (i < emailsToProcess.length - 1) {
        console.log(`Batch Calendar: Delaying for 1.5s before next email.`);
        await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 second delay
      }
    }
    // Overall summary toast
    if (successCount > 0 && errorCount === 0 && skippedCount === 0) {
      toast.success(`Successfully processed all ${successCount} selected email(s).`);
    } else {
        let summaryMessages: string[] = [];
        if (successCount > 0) summaryMessages.push(`${successCount} succeeded`);
        if (errorCount > 0) summaryMessages.push(`${errorCount} failed`);
        if (skippedCount > 0) summaryMessages.push(`${skippedCount} skipped`);
        toast.info(`Batch processing complete: ${summaryMessages.join(', ')}.`, { duration: 7000 });
    }
    clearSelection(); // Clear selection after processing
  };

  // useEffect for Automatic Calendar Processing
  useEffect(() => {
    if (isAutoCalendarEnabled && messages.length > 0) {
      const processNewMessages = async () => {
        let newEmailsProcessedCount = 0;
        let newErrorsCount = 0;
        
        // Create a list of emails that haven't been attempted for auto-calendaring in this session
        // AND do not already have a definitive calendar status from a previous run (e.g. batch or prior auto-run)
        const emailsToConsider = messages.filter(email => 
            !autoProcessedIds.has(email.id) && 
            !(email.analysis && email.analysis.calendarEventStatus && 
              ['created', 'updated', 'error', 'skipped_no_case_number', 'skipped_no_hearing_details'].includes(email.analysis.calendarEventStatus)
            )
        );

        if (emailsToConsider.length > 0) {
            console.log(`Auto-Calendar: Considering ${emailsToConsider.length} emails for processing.`);
        }

        for (let i = 0; i < emailsToConsider.length; i++) {
          const email = emailsToConsider[i];
          console.log(`Auto-Calendar: Processing ${email.id} - ${email.subject}`);
          try {
            const analysisResult = await emailServiceInstance.analyzeEmail(email);
            setAutoProcessedIds(prev => new Set(prev).add(email.id)); 

            if (analysisResult?.calendarEventStatus === 'created' || analysisResult?.calendarEventStatus === 'updated') {
              toast.success(`Auto-Calendar: Event ${analysisResult.calendarEventStatus} for "${email.subject?.substring(0,25) || 'email'}..."`);
              newEmailsProcessedCount++;
            } else if (analysisResult?.error && 
                       analysisResult.calendarEventStatus !== 'skipped_no_case_number' && 
                       analysisResult.calendarEventStatus !== 'skipped_no_hearing_details') {
              toast.error(`Auto-Calendar Error: "${email.subject?.substring(0,25) || 'email'}..." (${analysisResult.error?.substring(0, 50)})`);
              newErrorsCount++;
            }
          } catch (error: any) {
            setAutoProcessedIds(prev => new Set(prev).add(email.id)); 
            console.error(`Auto-Calendar: Exception processing ${email.id}:`, error);
            toast.error(`Auto-Calendar Exception: "${email.subject?.substring(0,25) || 'email'}..."`);
            newErrorsCount++;
          }
          
          // Add delay after processing each email, unless it's the very last one in this batch
          if (i < emailsToConsider.length - 1) {
            console.log(`Auto-Calendar: Delaying for 2s before next email.`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
          }
        }
        
        if (newEmailsProcessedCount > 0 || newErrorsCount > 0) {
            let summary = "Auto-Calendar summary:";
            if (newEmailsProcessedCount > 0) summary += ` ${newEmailsProcessedCount} event(s) actioned`;
            if (newErrorsCount > 0) summary += `${newEmailsProcessedCount > 0 ? ',' :''} ${newErrorsCount} error(s)`;
            toast.info(summary + ".", { duration: 4000 });
        }
      };
      
      processNewMessages();
    }
  }, [messages, isAutoCalendarEnabled, autoProcessedIds, emailServiceInstance]);

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
          onAnalyzeAndCalendar={handleAnalyzeAndCalendar}
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
              
              const isSelected = currentFolderId === folder.id.toUpperCase();
              
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => handleFolderSelect(folder.id)}
                  className={cn(
                    "w-full flex items-center px-3 py-2 text-sm rounded-md text-left",
                    isSelected
                      ? "bg-muted text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <IconComponent className="h-4 w-4 mr-3 flex-shrink-0" />
                  <span className="flex-1 truncate mr-2">{folder.name}</span>
                  {folder.unreadCount > 0 && (
                     <span className="ml-auto bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                      {folder.unreadCount}
                    </span>
                  )}
                </button>
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
            {messages && messages.length > 0 && !routeMessageId && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <Input
                    type="checkbox"
                    id="select-all-emails"
                    checked={messages.length > 0 && selectedEmails.length === messages.length}
                    onChange={() => selectAll(messages)}
                    disabled={messages.length === 0}
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
                  />
                  <label htmlFor="select-all-emails" className="text-sm text-muted-foreground cursor-pointer select-none">
                    {selectedEmails.length === messages.length && messages.length > 0 ? 'Deselect All' : 'Select All'}
                  </label>
                </div>
                <div className="flex items-center gap-4"> {/* Container for right-side toolbar items */}
                  {selectedEmails.length > 0 && (
                    <Button
                      onClick={handleBatchCalendarAnalysis} 
                      size="sm"
                      variant="outline"
                      className="gap-2"
                    >
                      <CalendarIcon className="h-4 w-4" />
                      Calendar ({selectedEmails.length}) Selected
                    </Button>
                  )}

                  {/* Auto-Calendar Toggle - ADDED HERE */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-calendar-toggle"
                      checked={isAutoCalendarEnabled}
                      onCheckedChange={setIsAutoCalendarEnabled}
                    />
                    <Label htmlFor="auto-calendar-toggle" className="text-sm text-muted-foreground select-none cursor-pointer">
                      Auto-Calendar New Emails
                    </Label>
                  </div>
                </div>
              </div>
            )}
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
                        "flex items-start gap-3 p-4 hover:bg-muted/80 dark:hover:bg-muted/20",
                        !email.read && "bg-muted/50 dark:bg-muted/10",
                        selectedEmails.includes(email.id) && "bg-primary/10 dark:bg-primary/20 border-l-2 border-primary"
                    )}
                  >
                    <div className="flex-shrink-0 pt-0.5">
                      <Input
                        type="checkbox"
                        checked={selectedEmails.includes(email.id)}
                        onChange={(e) => {
                          e.stopPropagation(); 
                          toggleSelect(email.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
                      />
                    </div>
                    <div 
                        className="flex-1 min-w-0 cursor-pointer"
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
                        <div className={cn("w-2 h-2 rounded-full inline-block mr-2 align-middle", !email.read ? "bg-primary" : "bg-transparent")} />
                        
                        <div className="inline-block min-w-0 flex-1 align-middle">
                      <div className="flex items-baseline justify-between">
                        <span className={cn("font-medium truncate max-w-[200px] sm:max-w-[300px]", !email.read ? 'text-foreground' : 'text-muted-foreground')}>
                          {email.from}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(email.date).toLocaleDateString()} {new Date(email.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h4 className={cn("font-medium mt-0.5 truncate", !email.read ? 'text-foreground' : 'text-muted-foreground')}>
                        {email.subject || "(no subject)"}
                      </h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {email.snippet || (email.body && typeof email.body === 'string'
                          ? email.body.substring(0, 150).replace(/<[^>]*>/g, '')
                          : '[No content preview]')}
                      </p>
                        </div>
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
                {emailContextError ? <p className="text-sm text-destructive mt-2">Error: {emailContextError.message}</p> : null}
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