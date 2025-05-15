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

  /**
   * Parses an HH:MM AM/PM time string and a YYYY-MM-DD date string
   * into a local YYYY-MM-DDTHH:MM:SS formatted string.
   */
  private parseDateTimeToLocalStringFormat(dateStr: string, timeStr: string): string | null {
    if (!dateStr || !timeStr) return null;

    const [year, month, day] = dateStr.split('-').map(Number);
    let [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    // Basic validation (can be enhanced)
    if (isNaN(year) || year < 1900 || year > 2200) return null;
    if (isNaN(month) || month < 1 || month > 12) return null;
    if (isNaN(day) || day < 1 || day > 31) return null;
    if (isNaN(hours) || hours < 0 || hours > 23) { // Check before AM/PM adjustment
      if (!(modifier && (hours === 12))) return null;
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
    }

    if (hours < 0 || hours > 23) return null; // Double check hours

    // Format to YYYY-MM-DDTHH:MM:SS
    const HH = String(hours).padStart(2, '0');
    const MM = String(minutes).padStart(2, '0');
    const SS = '00'; // Assuming seconds are always 00
    const YYYY = String(year);
    const M = String(month).padStart(2, '0');
    const D = String(day).padStart(2, '0');

    return `${YYYY}-${M}-${D}T${HH}:${MM}:${SS}`;
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

    const localStartTimeStr = this.parseDateTimeToLocalStringFormat(meetingDetails.eventDate, meetingDetails.eventTime);
    if (!localStartTimeStr) {
      console.error('[AiCalendarService] Failed to parse start date/time to local string format:', { date: meetingDetails.eventDate, time: meetingDetails.eventTime });
      return null;
    }

    let localEndTimeStr: string | null = null;
    if (meetingDetails.endTime && meetingDetails.eventDate) {
      // If endTime is a full ISO UTC string, this specific handling might need review based on expected format of meetingDetails.endTime
      // For now, assuming if it's not explicitly UTC, it's a local time string like eventTime.
      if (meetingDetails.endTime.includes('T') && meetingDetails.endTime.includes('Z')) {
        console.warn('[AiCalendarService] meetingDetails.endTime appears to be a UTC ISO string. Attempting to parse as local time relative to eventDate for consistency. Review this logic if endTime can be UTC.', meetingDetails.endTime);
        // This case is tricky: if it's a UTC string, we'd ideally convert it to a Pacific local time string.
        // For now, we'll try to parse it as if it were a local time string related to eventDate, which might be incorrect if it's truly UTC.
        // A better approach would be to convert this UTC string to 'America/Los_Angeles' local time string.
        // As a simplification, let's assume if it's not parseable as local time string, we default to 1 hour duration.
        const tempEndTime = meetingDetails.endTime.split('T')[1]?.substring(0,5); // try to extract HH:MM
        if (tempEndTime) {
            localEndTimeStr = this.parseDateTimeToLocalStringFormat(meetingDetails.eventDate, tempEndTime); // This assumes it's on the same date and the time part is local.
        }
      } else {
        localEndTimeStr = this.parseDateTimeToLocalStringFormat(meetingDetails.eventDate, meetingDetails.endTime);
      }
      if (!localEndTimeStr) {
        console.warn('[AiCalendarService] Provided endTime could not be parsed to local string format, defaulting to 1 hour duration from start time.', { date: meetingDetails.eventDate, endTime: meetingDetails.endTime });
      }
    }
    
    if (!localEndTimeStr) {
      const [datePart, timePart] = localStartTimeStr.split('T');
      let [hours, minutes] = timePart.split(':').map(Number);
      hours += 1; // Add 1 hour for default duration
      let endDayOffset = 0;
      if (hours >= 24) {
        hours -= 24;
        endDayOffset = 1; // Event ends on the next day
      }
      
      let endDateStr = datePart;
      if (endDayOffset > 0) {
          // Basic date increment, for more complex date math a library is better
          const startDateObj = new Date(datePart + "T00:00:00"); // Use a date object for reliable date increment
          startDateObj.setDate(startDateObj.getDate() + endDayOffset);
          endDateStr = startDateObj.toISOString().split('T')[0];
      }

      const endHH = String(hours).padStart(2, '0');
      const endMM = String(minutes).padStart(2, '0');
      localEndTimeStr = `${endDateStr}T${endHH}:${endMM}:00`;
    }

    // Ensure startTime is before endTime
    // Comparing local strings directly can be problematic if they cross midnight without date change in string.
    // However, Google API will validate. For basic check:
    if (localStartTimeStr >= localEndTimeStr && meetingDetails.eventDate === localEndTimeStr.substring(0,10) /* ensure same day for simple comparison or date was incremented */) {
      console.warn('[AiCalendarService] Start time is on or after end time. Defaulting end time to 1 hour after start (re-evaluating).', { localStartTimeStr, localEndTimeStr });
      const [datePart, timePart] = localStartTimeStr.split('T');
      let [hours, minutes] = timePart.split(':').map(Number);
      hours += 1;
      let endDayOffset = 0;
      if (hours >= 24) {
        hours -= 24;
        endDayOffset = 1;
      }
      let endDateStr = datePart;
      if (endDayOffset > 0) {
          const startDateObj = new Date(datePart + "T00:00:00");
          startDateObj.setDate(startDateObj.getDate() + endDayOffset);
          endDateStr = startDateObj.toISOString().split('T')[0];
      }
      const endHH = String(hours).padStart(2, '0');
      const endMM = String(minutes).padStart(2, '0');
      localEndTimeStr = `${endDateStr}T${endHH}:${endMM}:00`;
    }

    // Construct the new dynamic summary (event title)
    let summaryParts: string[] = [];
    const eventTypeForDisplay = meetingDetails.eventType || "Legal Event"; // Use placeholder if eventType is missing
    summaryParts.push(eventTypeForDisplay);

    if (meetingDetails.personInvolved) {
      summaryParts.push(`for ${meetingDetails.personInvolved}`);
    }
    // Only add time if eventType or personInvolved is present (now summaryParts will always have at least eventTypeForDisplay)
    if (meetingDetails.eventTime) { // Simplified condition as summaryParts will not be empty
      summaryParts.push(`at ${meetingDetails.eventTime}`);
    }
    if (meetingDetails.judgeName) {
      summaryParts.push(`w/ Judge ${meetingDetails.judgeName}`);
    }

    let newSummary = summaryParts.join(' ');
    if (!newSummary) { // Fallback if all parts are missing
      newSummary = meetingDetails.eventTitle || meetingDetails.description || emailSubject;
    }

    const eventInput: AiCalendarEventInput = {
      summary: newSummary, // Use the new dynamically constructed summary
      description: `Event Details:\nCase Number: ${meetingDetails.caseNumber || 'N/A'}\nEvent Type: ${meetingDetails.eventType || 'N/A'}\nPerson Involved: ${meetingDetails.personInvolved || 'N/A'}\nJudge: ${meetingDetails.judgeName || 'N/A'}\nTime: ${meetingDetails.eventTime || 'N/A'} (Date: ${meetingDetails.eventDate || 'N/A'})\nLocation: ${meetingDetails.location || 'N/A'}\nOriginal Description: ${meetingDetails.description || 'N/A'}\n\n(Created from email: "${emailSubject}")`,
      location: meetingDetails.location || undefined,
      start: { dateTime: localStartTimeStr, timeZone: 'America/Los_Angeles' },
      end: { dateTime: localEndTimeStr, timeZone: 'America/Los_Angeles' },
      attendees: meetingDetails.attendees?.map(email => ({ email })).filter(a => a.email) || [],
      source: {
        title: `Original Email: ${emailSubject}`,
        url: emailMessageId ? `https://mail.google.com/mail/u/0/#inbox/${emailMessageId}` : '' 
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
        // Add new fields to extended properties for querying/display if needed later
        if (meetingDetails.personInvolved) privateProps.genieflowPersonInvolved = meetingDetails.personInvolved;
        if (meetingDetails.judgeName) privateProps.genieflowJudgeName = meetingDetails.judgeName;
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
      const createdEvent = await this.googleClient.request<any>(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
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

    const localStartTimeStr = this.parseDateTimeToLocalStringFormat(meetingDetails.eventDate, meetingDetails.eventTime);
    if (!localStartTimeStr) {
      console.error('[AiCalendarService] updateEvent: Failed to parse start date/time to local string format:', { date: meetingDetails.eventDate, time: meetingDetails.eventTime });
      return null;
    }

    let localEndTimeStr: string | null = null;
    if (meetingDetails.endTime && meetingDetails.eventDate) {
      // Similar handling for endTime as in createEventFromAnalysis
      if (meetingDetails.endTime.includes('T') && meetingDetails.endTime.includes('Z')) {
        console.warn('[AiCalendarService] updateEvent: meetingDetails.endTime appears to be a UTC ISO string. Review this logic.', meetingDetails.endTime);
        const tempEndTime = meetingDetails.endTime.split('T')[1]?.substring(0,5);
        if (tempEndTime) {
            localEndTimeStr = this.parseDateTimeToLocalStringFormat(meetingDetails.eventDate, tempEndTime);
        }
      } else {
        localEndTimeStr = this.parseDateTimeToLocalStringFormat(meetingDetails.eventDate, meetingDetails.endTime);
      }
      if (!localEndTimeStr) {
        console.warn('[AiCalendarService] updateEvent: Provided endTime could not be parsed, defaulting to 1 hour duration.');
      }
    }

    if (!localEndTimeStr) {
      const [datePart, timePart] = localStartTimeStr.split('T');
      let [hours, minutes] = timePart.split(':').map(Number);
      hours += 1; // Add 1 hour for default duration
      let endDayOffset = 0;
      if (hours >= 24) {
        hours -= 24;
        endDayOffset = 1; 
      }
      let endDateStr = datePart;
      if (endDayOffset > 0) {
          const startDateObj = new Date(datePart + "T00:00:00");
          startDateObj.setDate(startDateObj.getDate() + endDayOffset);
          endDateStr = startDateObj.toISOString().split('T')[0];
      }
      const endHH = String(hours).padStart(2, '0');
      const endMM = String(minutes).padStart(2, '0');
      localEndTimeStr = `${endDateStr}T${endHH}:${endMM}:00`;
    }
    
    if (localStartTimeStr >= localEndTimeStr && meetingDetails.eventDate === localEndTimeStr.substring(0,10)) {
        console.warn('[AiCalendarService] updateEvent: Start time is on or after end time. Defaulting end time to 1 hour after start (re-evaluating).');
        const [datePart, timePart] = localStartTimeStr.split('T');
        let [hours, minutes] = timePart.split(':').map(Number);
        hours += 1;
        let endDayOffset = 0;
        if (hours >= 24) {
            hours -= 24;
            endDayOffset = 1;
        }
        let endDateStr = datePart;
        if (endDayOffset > 0) {
            const startDateObj = new Date(datePart + "T00:00:00");
            startDateObj.setDate(startDateObj.getDate() + endDayOffset);
            endDateStr = startDateObj.toISOString().split('T')[0];
        }
        const endHH = String(hours).padStart(2, '0');
        const endMM = String(minutes).padStart(2, '0');
        localEndTimeStr = `${endDateStr}T${endHH}:${endMM}:00`;
    }

    // Construct the new dynamic summary (event title) - REPLICATE LOGIC FROM createEventFromAnalysis
    let summaryParts: string[] = [];
    const eventTypeForDisplay = meetingDetails.eventType || "Legal Event"; // Use placeholder if eventType is missing
    summaryParts.push(eventTypeForDisplay);

    if (meetingDetails.personInvolved) {
      summaryParts.push(`for ${meetingDetails.personInvolved}`);
    }
    // Only add time if eventType or personInvolved is present (now summaryParts will always have at least eventTypeForDisplay)
    if (meetingDetails.eventTime) { // Simplified condition as summaryParts will not be empty
      summaryParts.push(`at ${meetingDetails.eventTime}`);
    }
    if (meetingDetails.judgeName) {
      summaryParts.push(`w/ Judge ${meetingDetails.judgeName}`);
    }

    let newSummary = summaryParts.join(' ');
    if (!newSummary) {
      newSummary = meetingDetails.eventTitle || meetingDetails.description || emailSubject;
    }

    // Also update description to include new fields
    const updatedDescription = `Event Details:\nCase Number: ${meetingDetails.caseNumber || 'N/A'}\nEvent Type: ${meetingDetails.eventType || 'N/A'}\nPerson Involved: ${meetingDetails.personInvolved || 'N/A'}\nJudge: ${meetingDetails.judgeName || 'N/A'}\nTime: ${meetingDetails.eventTime || 'N/A'} (Date: ${meetingDetails.eventDate || 'N/A'})\nLocation: ${meetingDetails.location || 'N/A'}\nOriginal Description: ${meetingDetails.description || 'N/A'}\n\n(Updated from email: "${emailSubject}")`;

    const eventPatch: Partial<AiCalendarEventInput> = {
      summary: newSummary,
      description: updatedDescription,
      location: meetingDetails.location || undefined,
      start: { dateTime: localStartTimeStr, timeZone: 'America/Los_Angeles' },
      end: { dateTime: localEndTimeStr, timeZone: 'America/Los_Angeles' },
      attendees: meetingDetails.attendees?.map(email => ({ email })).filter(a => a.email) || [],
      // Source probably doesn't need to change on update, unless the source email itself changed.
      // For now, we don't update it.
      extendedProperties: (() => {
        const privateProps: { [key: string]: string } = {
          genieflowProcessed: 'true',
          genieflowSource: 'emailAnalysis_updated', // Indicate it's an update
        };
        if (emailMessageId) privateProps.emailMessageId = emailMessageId; // Potentially update if new email triggered update
        if (emailThreadId) privateProps.emailThreadId = emailThreadId;
        if (meetingDetails.caseNumber) privateProps.genieflowCaseNumber = meetingDetails.caseNumber;
        if (meetingDetails.eventType) privateProps.genieflowEventType = meetingDetails.eventType;
        if (meetingDetails.personInvolved) privateProps.genieflowPersonInvolved = meetingDetails.personInvolved;
        if (meetingDetails.judgeName) privateProps.genieflowJudgeName = meetingDetails.judgeName;
        return { private: privateProps };
      })()
    };

    if (meetingDetails.location && (meetingDetails.location.toLowerCase().includes('video:') || meetingDetails.location.toLowerCase().includes('meet.google.com'))) {
      eventPatch.conferenceData = {
        createRequest: {
          requestId: `genieflow-update-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" } 
        }
      };
    } else {
      // If location no longer indicates a video meeting, clear conference data.
      // To clear, set conferenceData to null IF it can be set to null.
      // The API might require specific empty object for some fields or just omitting it.
      // For now, let's assume we might want to clear it if it's no longer a video meeting.
      // However, simply not including it in the patch might be enough if it was already set.
      // To be safe, if we want to REMOVE a meet link, we might need to set conferenceData to null.
      // Let's consult Google API docs if this becomes an issue. For now, only add if relevant.
    }

    console.log(`[AiCalendarService] Attempting to patch event ID: ${eventId} with input:`, JSON.stringify(eventPatch, null, 2));

    try {
      const updatedEvent = await this.googleClient.request<any>(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?conferenceDataVersion=1`,
        {
          method: 'PATCH',
          body: JSON.stringify(eventPatch),
        }
      );
      console.log(`[AiCalendarService] Successfully updated event ID: ${eventId}:`, updatedEvent);
      return updatedEvent;
    } catch (error) {
      console.error(`[AiCalendarService] Error updating event ID: ${eventId}:`, error);
      return null;
    }
  }
}

export const aiCalendarService = new AiCalendarService(); 