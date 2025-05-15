import { googleApiClient } from '../google/GoogleAPIClient';
import { EmailAnalysisMeetingDetails } from '../email/types';

// Interface for the data needed to create a calendar event via this service
export interface AiCalendarEventInput {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string; // RFC3339 format, e.g., '2025-06-26T09:00:00-07:00'
    timeZone?: string; // e.g., 'America/Los_Angeles' (optional, API defaults to calendar's timezone)
  };
  end: {
    dateTime: string; // RFC3339 format
    timeZone?: string;
  };
  attendees?: Array<{ email: string }>;
  source?: { // To link back to the email
    title: string; // e.g., Email subject
    url: string;   // e.g., A link to the email if possible (placeholder for now)
  };
  conferenceData?: any; // For Google Meet links if provided explicitly
  // Add extended properties for better linking and future querying
  extendedProperties?: {
    private?: {
      [key: string]: string;
      // emailMessageId?: string; // Removed, covered by index signature
      // emailThreadId?: string;  // Removed, covered by index signature
      // genieflowCaseNumber?: string; // Removed, covered by index signature
      // genieflowEventType?: string;  // Removed, covered by index signature
    };
  };
}

export class AiCalendarService {
  private googleClient = googleApiClient;

  /**
   * Parses an HH:MM AM/PM time string and a YYYY-MM-DD date string 
   * into an ISO string (UTC).
   */
  private parseDateTimeToISO(dateStr: string, timeStr: string): string | null {
    if (!dateStr || !timeStr) return null;

    const [year, month, day] = dateStr.split('-').map(Number);
    let [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (isNaN(year) || year < 1900 || year > 2200) return null; // Basic validation
    if (isNaN(month) || month < 1 || month > 12) return null;
    if (isNaN(day) || day < 1 || day > 31) return null;
    if (isNaN(hours) || hours < 0 || hours > 23) { // Before AM/PM adjustment
      if (!(modifier && (hours === 12))) return null; // allow 12AM/12PM before adjustment
    }
    if (isNaN(minutes) || minutes < 0 || minutes > 59) return null;

    if (modifier) {
        modifier = modifier.toUpperCase();
        if (modifier === 'PM' && hours >= 1 && hours < 12) {
            hours += 12;
        }
        if (modifier === 'AM' && hours === 12) { // Midnight case: 12 AM is 00 hours
            hours = 0;
        }
    } // If no modifier, assume 24-hour format if hours are valid (0-23)

    // Double check hours after AM/PM
    if (hours < 0 || hours > 23) return null;

    try {
      // Create Date object using UTC values to avoid local timezone shifts during ISO conversion
      const date = new Date(Date.UTC(year, month - 1, day, hours, minutes));
      if (isNaN(date.getTime())) return null; // Check if date is valid after construction
      return date.toISOString(); // e.g., "2025-06-26T15:30:00.000Z"
    } catch (e) {
      console.error('[AiCalendarService] Error constructing date for ISO string:', e);
      return null;
    } 
  }

  public async findEventByCaseNumber(caseNumber: string): Promise<any | null> {
    if (!caseNumber) {
      console.warn('[AiCalendarService] findEventByCaseNumber called with no caseNumber.');
      return null;
    }
    console.log(`[AiCalendarService] Attempting to find event by caseNumber: ${caseNumber}`);

    try {
      const encodedPropertyName = encodeURIComponent('genieflowCaseNumber');
      const encodedPropertyValue = encodeURIComponent(caseNumber);
      // We expect only one genieflowCaseNumber property per event for this use case.
      const privateExtendedPropertyQuery = `${encodedPropertyName}=${encodedPropertyValue}`;

      // Fetch up to 5 events, in case of duplicates, though ideally caseNumber should be unique for active events.
      const path = `https://www.googleapis.com/calendar/v3/calendars/primary/events?privateExtendedProperty=${privateExtendedPropertyQuery}&maxResults=5`;

      console.log(`[AiCalendarService] Querying for existing event with path: ${path}`);
      
      const response = await this.googleClient.request<{ items: any[] }>(
        path,
        { method: 'GET' }
      );

      if (response && response.items && response.items.length > 0) {
        // Assuming the first event found is the correct one.
        // If multiple events share the same case number, this might need more sophisticated handling
        // (e.g., sorting by creation date or last modified, though the API doesn't directly sort on extendedProps).
        const event = response.items[0];
        console.log(`[AiCalendarService] Found existing event for caseNumber ${caseNumber} with ID: ${event.id}`);
        return event;
      } else {
        console.log(`[AiCalendarService] No existing event found for caseNumber ${caseNumber}.`);
        return null;
      }
    } catch (error) {
      console.error(`[AiCalendarService] Error finding event by caseNumber ${caseNumber}:`, error);
      return null;
    }
  }

  public async createEventFromAnalysis(
    meetingDetails: EmailAnalysisMeetingDetails, 
    emailSubject: string,
    emailMessageId?: string, 
    emailThreadId?: string
  ): Promise<any | null> {
    if (!meetingDetails.eventDate || !meetingDetails.eventTime) {
      console.warn('[AiCalendarService] Missing eventDate or eventTime. Cannot create calendar event.', meetingDetails);
      return null;
    }

    const startTimeISO = this.parseDateTimeToISO(meetingDetails.eventDate, meetingDetails.eventTime);
    if (!startTimeISO) {
        console.error('[AiCalendarService] Failed to parse start date/time:', {date: meetingDetails.eventDate, time: meetingDetails.eventTime });
        return null;
    }

    let endTimeISO: string | null = null;
    if (meetingDetails.endTime && meetingDetails.eventDate) {
        // Try to parse endTime. It could be a time string like eventTime, or a full ISO string (less likely from current AI prompt).
        // For now, assume it's a time string relative to eventDate if not already ISO.
        if (meetingDetails.endTime.includes('T') && meetingDetails.endTime.includes('Z')) { // Basic check for ISO format
            endTimeISO = meetingDetails.endTime;
        } else {
            endTimeISO = this.parseDateTimeToISO(meetingDetails.eventDate, meetingDetails.endTime);
        }
        if (!endTimeISO) {
            console.warn('[AiCalendarService] Provided endTime could not be parsed, defaulting to 1 hour duration from start time.', {date: meetingDetails.eventDate, endTime: meetingDetails.endTime });
        }
    }
    
    if (!endTimeISO) {
        const startDate = new Date(startTimeISO);
        startDate.setUTCHours(startDate.getUTCHours() + 1); // Add 1 hour in UTC
        endTimeISO = startDate.toISOString();
    }
    
    if (new Date(startTimeISO) >= new Date(endTimeISO)) {
        console.warn('[AiCalendarService] Start time is on or after end time. Defaulting end time to 1 hour after start.', {startTimeISO, endTimeISO});
        const startDate = new Date(startTimeISO);
        startDate.setUTCHours(startDate.getUTCHours() + 1);
        endTimeISO = startDate.toISOString();
    }

    const eventInput: AiCalendarEventInput = {
      summary: meetingDetails.eventType || meetingDetails.description || emailSubject,
      description: `Event Details:\nCase Number: ${meetingDetails.caseNumber || 'N/A'}\nEvent Type: ${meetingDetails.eventType || 'N/A'}\nLocation: ${meetingDetails.location || 'N/A'}\nOriginal Description: ${meetingDetails.description || 'N/A'}\n\n(Created from email: "${emailSubject}")`,
      location: meetingDetails.location || undefined,
      start: { dateTime: startTimeISO }, // Google Calendar API typically infers timezone from user's primary calendar if not specified
      end: { dateTime: endTimeISO },
      attendees: meetingDetails.attendees?.map(email => ({ email })).filter(a => a.email) || [],
      source: {
        title: `Original Email: ${emailSubject}`,
        url: emailMessageId ? `https://mail.google.com/mail/u/0/#inbox/${emailMessageId}` : '' // Example deep link
      },
      extendedProperties: (() => {
        const privateProps: { [key: string]: string } = {
          genieflowProcessed: 'true',
          genieflowSource: 'emailAnalysis',
        };
        if (emailMessageId) privateProps.emailMessageId = emailMessageId;
        if (emailThreadId) privateProps.emailThreadId = emailThreadId;
        if (meetingDetails.caseNumber) privateProps.genieflowCaseNumber = meetingDetails.caseNumber;
        if (meetingDetails.eventType) privateProps.genieflowEventType = meetingDetails.eventType;
        return { private: privateProps };
      })()
    };
    
    if (meetingDetails.location && (meetingDetails.location.toLowerCase().includes('video:') || meetingDetails.location.toLowerCase().includes('meet.google.com'))) {
        eventInput.conferenceData = {
            createRequest: {
                requestId: `genieflow-${Date.now()}`,
                conferenceSolutionKey: { type: "hangoutsMeet" } 
            }
        };
    }

    console.log('[AiCalendarService] Attempting to create calendar event with input:', JSON.stringify(eventInput, null, 2));

    try {
      // The GoogleAPIClient.request method will handle token refresh if necessary.
      // No need to explicitly call signIn() here as it might force a consent prompt
      // when a silent refresh might have been possible or when a token is already available.
      // if (!this.googleClient.isSignedIn()) {
      //   console.log('[AiCalendarService] Google client not signed in. Attempting sign-in for calendar operation.');
      //   await this.googleClient.signIn(); // This will prompt for consent if new scopes were added
      // }

      const createdEvent = await this.googleClient.request<any>(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', // Added conferenceDataVersion=1
        {
          method: 'POST',
          body: JSON.stringify(eventInput),
        }
      );
      console.log('[AiCalendarService] Successfully created calendar event:', createdEvent);
      return createdEvent;
    } catch (error) {
      console.error('[AiCalendarService] Error creating calendar event:', error);
      return null;
    }
  }

  public async updateEvent(
    eventId: string,
    meetingDetails: EmailAnalysisMeetingDetails, 
    emailSubject: string,
    emailMessageId?: string, 
    emailThreadId?: string
  ): Promise<any | null> {
    if (!eventId) {
      console.warn('[AiCalendarService] updateEvent called with no eventId.');
      return null;
    }
    if (!meetingDetails.eventDate || !meetingDetails.eventTime) {
      console.warn('[AiCalendarService] updateEvent: Missing eventDate or eventTime. Cannot update calendar event.', meetingDetails);
      return null;
    }
    console.log(`[AiCalendarService] Attempting to update event ID: ${eventId} with details:`, meetingDetails);

    const startTimeISO = this.parseDateTimeToISO(meetingDetails.eventDate, meetingDetails.eventTime);
    if (!startTimeISO) {
        console.error('[AiCalendarService] updateEvent: Failed to parse start date/time:', {date: meetingDetails.eventDate, time: meetingDetails.eventTime });
        return null;
    }

    let endTimeISO: string | null = null;
    if (meetingDetails.endTime && meetingDetails.eventDate) {
        if (meetingDetails.endTime.includes('T') && meetingDetails.endTime.includes('Z')) { 
            endTimeISO = meetingDetails.endTime;
        } else {
            endTimeISO = this.parseDateTimeToISO(meetingDetails.eventDate, meetingDetails.endTime);
        }
        if (!endTimeISO) {
            console.warn('[AiCalendarService] updateEvent: Provided endTime could not be parsed, defaulting to 1 hour duration from start time.', {date: meetingDetails.eventDate, endTime: meetingDetails.endTime });
        }
    }
    
    if (!endTimeISO) {
        const startDate = new Date(startTimeISO);
        startDate.setUTCHours(startDate.getUTCHours() + 1);
        endTimeISO = startDate.toISOString();
    }
    
    if (new Date(startTimeISO) >= new Date(endTimeISO)) {
        console.warn('[AiCalendarService] updateEvent: Start time is on or after end time. Defaulting end time to 1 hour after start.', {startTimeISO, endTimeISO});
        const startDate = new Date(startTimeISO);
        startDate.setUTCHours(startDate.getUTCHours() + 1);
        endTimeISO = startDate.toISOString();
    }

    const eventInput: AiCalendarEventInput = {
      summary: meetingDetails.eventType || meetingDetails.description || emailSubject,
      // Modify description to indicate it's an update if desired, or keep similar structure
      description: `EVENT UPDATED. New Details:\nCase Number: ${meetingDetails.caseNumber || 'N/A'}\nEvent Type: ${meetingDetails.eventType || 'N/A'}\nLocation: ${meetingDetails.location || 'N/A'}\nOriginal Description from update email: ${meetingDetails.description || 'N/A'}\n\n(Updated from email: "${emailSubject}")`,
      location: meetingDetails.location || undefined,
      start: { dateTime: startTimeISO },
      end: { dateTime: endTimeISO },
      attendees: meetingDetails.attendees?.map(email => ({ email })).filter(a => a.email) || [],
      source: {
        title: `Updated from Email: ${emailSubject}`,
        url: emailMessageId ? `https://mail.google.com/mail/u/0/#inbox/${emailMessageId}` : '' 
      },
      extendedProperties: (() => {
        const privateProps: { [key: string]: string } = {
          genieflowProcessed: 'true',
          genieflowSource: 'emailAnalysisUpdate', // Indicate this event was updated via email analysis
        };
        if (emailMessageId) privateProps.emailMessageId = emailMessageId; // Update to the new email ID
        if (emailThreadId) privateProps.emailThreadId = emailThreadId;   // Update to the new thread ID
        if (meetingDetails.caseNumber) privateProps.genieflowCaseNumber = meetingDetails.caseNumber; // Should be the same, but refresh
        if (meetingDetails.eventType) privateProps.genieflowEventType = meetingDetails.eventType;
        return { private: privateProps };
      })()
    };
    
    if (meetingDetails.location && (meetingDetails.location.toLowerCase().includes('video:') || meetingDetails.location.toLowerCase().includes('meet.google.com'))) {
        eventInput.conferenceData = {
            createRequest: {
                requestId: `genieflow-update-${Date.now()}`,
                conferenceSolutionKey: { type: "hangoutsMeet" } 
            }
        };
    } else {
      // If the new details don't specify a video meeting, we might want to clear existing conference data.
      // Setting conferenceData to null or an empty object might be necessary.
      // For now, if not specified, it will retain existing conference data unless overwritten by a new meet link.
      // To explicitly remove: eventInput.conferenceData = null; (or the API specific way to clear it)
    }

    console.log(`[AiCalendarService] Attempting to update calendar event ID: ${eventId} with input:`, JSON.stringify(eventInput, null, 2));

    try {
      const path = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?conferenceDataVersion=1`;
      const updatedEvent = await this.googleClient.request<any>(
        path,
        {
          method: 'PUT',
          body: JSON.stringify(eventInput),
        }
      );
      console.log('[AiCalendarService] Successfully updated calendar event:', updatedEvent);
      return updatedEvent;
    } catch (error) {
      console.error(`[AiCalendarService] Error updating calendar event ID ${eventId}:`, error);
      return null;
    }
  }
}

export const aiCalendarService = new AiCalendarService(); 