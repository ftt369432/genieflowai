import { useState, useEffect } from 'react';
import type { Email, Task, CalendarEvent, Contact, Document } from '../types';
import { fetchEmails } from '../services/email/emailService';
import { fetchTasks } from '../services/tasks/taskService';
import { fetchEvents } from '../services/calendar/calendarService';
import { fetchContacts } from '../services/contacts/contactService';
import { fetchDocuments } from '../services/documents/documentService';

interface AnalyticsData {
  emails: Email[];
  tasks: Task[];
  events: CalendarEvent[];
  contacts: Contact[];
  documents: Document[];
}

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData>({
    emails: [],
    tasks: [],
    events: [],
    contacts: [],
    documents: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalyticsData() {
      try {
        setLoading(true);
        setError(null);

        const [
          emailsResponse,
          tasksData,
          eventsData,
          contactsData,
          documentsData
        ] = await Promise.all([
          fetchEmails(),
          fetchTasks(),
          fetchEvents(),
          fetchContacts(),
          fetchDocuments()
        ]);

        setData({
          emails: emailsResponse.data,
          tasks: tasksData,
          events: eventsData,
          contacts: contactsData,
          documents: documentsData
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    }

    loadAnalyticsData();
  }, []);

  return { data, loading, error };
}