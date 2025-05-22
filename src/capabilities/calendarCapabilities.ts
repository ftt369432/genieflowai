import { Capability, CapabilityContext } from '../types/capabilities';
import { aiCalendarService } from '../services/calendar/AiCalendarService';
import { EmailAnalysisMeetingDetails } from '../services/email/types';

// TODO: Define a more specific type for GoogleCalendarEvent if available
// For now, using 'any' for the createdEvent output.

export const createCalendarEventFromAnalysisCapability: Capability = {
  id: 'calendar-create-event-from-analysis',
  name: 'Create Calendar Event from Email Analysis',
  description: 'Creates a Google Calendar event based on details extracted from an email analysis, including case number, event type, date, time, attendees, and location.',
  category: 'Calendar',
  version: '1.0.0',
  inputParameters: [
    { name: 'meetingDetails', type: 'EmailAnalysisMeetingDetails', description: 'Object containing extracted details for the event.', required: true },
    { name: 'emailSubject', type: 'string', description: 'The subject of the email from which details were extracted.', required: true },
    { name: 'emailMessageId', type: 'string', description: 'Optional ID of the source email message.', required: false },
    { name: 'emailThreadId', type: 'string', description: 'Optional ID of the source email thread.', required: false },
  ],
  outputParameters: [
    { name: 'createdEvent', type: 'any', description: 'The event object returned by the Google Calendar API upon successful creation, or null if failed.', required: true },
  ],
  target: {
    type: 'service',
    identifier: 'AiCalendarService.createEventFromAnalysis',
  },
  execute: async (
    input: {
      meetingDetails: EmailAnalysisMeetingDetails;
      emailSubject: string;
      emailMessageId?: string;
      emailThreadId?: string;
    },
    context: CapabilityContext
  ): Promise<{ createdEvent: any | null }> => {
    if (!input.meetingDetails || !input.emailSubject) {
      throw new Error('Missing required input parameters: meetingDetails and emailSubject for calendar-create-event-from-analysis.');
    }
    try {
      // The presence of aiCalendarService is assumed here due to direct import.
      // An orchestrator might use context or a service locator pattern based on target.identifier.
      const event = await aiCalendarService.createEventFromAnalysis(
        input.meetingDetails,
        input.emailSubject,
        input.emailMessageId,
        input.emailThreadId
      );
      return { createdEvent: event };
    } catch (error: any) {
      console.error(`Error executing ${createCalendarEventFromAnalysisCapability.id}:`, error);
      // Re-throwing allows the caller (e.g., an orchestrator) to handle it.
      throw new Error(`Failed to create calendar event via ${createCalendarEventFromAnalysisCapability.id}: ${error.message}`);
    }
  },
  tags: ['calendar', 'google-calendar', 'email-integration', 'scheduling', 'event-creation'],
  permissionsRequired: ['google_calendar:write'], // Example permission, adjust as needed
  exampleUsage: {
    meetingDetails: {
      eventTitle: "Case Review Hearing",
      caseNumber: "CV-2024-12345",
      eventType: "Hearing",
      eventDate: "2024-09-15",
      eventTime: "10:00 AM",
      endTime: "11:00 AM",
      location: "Courtroom 5B",
      attendees: ["client@example.com", "opposing_counsel@example.com"],
      description: "Initial hearing for case CV-2024-12345.",
      personInvolved: "John Doe",
      judgeName: "Judge Smith"
    },
    emailSubject: "Fwd: Hearing Schedule for CV-2024-12345",
    emailMessageId: "msg-f:1234567890",
    emailThreadId: "thread-f:0987654321"
  }
};

export const updateCalendarEventCapability: Capability = {
  id: 'calendar-update-event',
  name: 'Update Calendar Event from Email Analysis',
  description: 'Updates an existing Google Calendar event based on details extracted from an email analysis.',
  category: 'Calendar',
  version: '1.0.0',
  inputParameters: [
    { name: 'eventId', type: 'string', description: 'The ID of the calendar event to update.', required: true },
    { name: 'meetingDetails', type: 'EmailAnalysisMeetingDetails', description: 'Object containing updated details for the event.', required: true },
    { name: 'emailSubject', type: 'string', description: 'The subject of the email that triggered the update.', required: true },
    { name: 'emailMessageId', type: 'string', description: 'Optional ID of the source email message for the update.', required: false },
    { name: 'emailThreadId', type: 'string', description: 'Optional ID of the source email thread for the update.', required: false },
  ],
  outputParameters: [
    { name: 'updatedEvent', type: 'any', description: 'The updated event object from Google Calendar API, or null if failed.', required: true },
  ],
  target: {
    type: 'service',
    identifier: 'AiCalendarService.updateEvent',
  },
  execute: async (
    input: {
      eventId: string;
      meetingDetails: EmailAnalysisMeetingDetails;
      emailSubject: string;
      emailMessageId?: string;
      emailThreadId?: string;
    },
    context: CapabilityContext
  ): Promise<{ updatedEvent: any | null }> => {
    if (!input.eventId || !input.meetingDetails || !input.emailSubject) {
      throw new Error('Missing required input parameters: eventId, meetingDetails, and emailSubject for calendar-update-event.');
    }
    try {
      const event = await aiCalendarService.updateEvent(
        input.eventId,
        input.meetingDetails,
        input.emailSubject,
        input.emailMessageId,
        input.emailThreadId
      );
      return { updatedEvent: event };
    } catch (error: any) {
      console.error(`Error executing ${updateCalendarEventCapability.id}:`, error);
      throw new Error(`Failed to update calendar event ${input.eventId}: ${error.message}`);
    }
  },
  tags: ['calendar', 'google-calendar', 'email-integration', 'scheduling', 'event-update'],
  permissionsRequired: ['google_calendar:write'],
  exampleUsage: {
    eventId: "existing_event_abcdef123456",
    meetingDetails: {
      eventTitle: "UPDATED Case Review Hearing",
      caseNumber: "CV-2024-12345",
      eventType: "Hearing",
      eventDate: "2024-09-16", // Date changed
      eventTime: "02:30 PM",   // Time changed
      location: "Courtroom 5B - Virtual Link Added",
      attendees: ["client@example.com", "opposing_counsel@example.com", "paralegal@example.com"],
      description: "Updated hearing details for case CV-2024-12345. Now includes virtual attendance option.",
      personInvolved: "John Doe",
      judgeName: "Judge Smith"
    },
    emailSubject: "URGENT UPDATE: Hearing Schedule for CV-2024-12345 Changed",
    emailMessageId: "msg-f:1234567899",
    emailThreadId: "thread-f:0987654321"
  }
};

export const findCalendarEventByCaseNumberCapability: Capability = {
  id: 'calendar-find-event-by-casenumber',
  name: 'Find Calendar Event by Case Number',
  description: 'Finds a Google Calendar event based on a specific case number stored in its extended properties.',
  category: 'Calendar',
  version: '1.0.0',
  inputParameters: [
    { name: 'caseNumber', type: 'string', description: 'The case number to search for.', required: true },
  ],
  outputParameters: [
    { name: 'foundEvent', type: 'any', description: 'The event object from Google Calendar API if found, or null.', required: true },
  ],
  target: {
    type: 'service',
    identifier: 'AiCalendarService.findEventByCaseNumber',
  },
  execute: async (
    input: {
      caseNumber: string;
    },
    context: CapabilityContext
  ): Promise<{ foundEvent: any | null }> => {
    if (!input.caseNumber) {
      throw new Error('Missing required input parameter: caseNumber for calendar-find-event-by-casenumber.');
    }
    try {
      const event = await aiCalendarService.findEventByCaseNumber(input.caseNumber);
      return { foundEvent: event };
    } catch (error: any) {
      console.error(`Error executing ${findCalendarEventByCaseNumberCapability.id}:`, error);
      throw new Error(`Failed to find calendar event by case number ${input.caseNumber}: ${error.message}`);
    }
  },
  tags: ['calendar', 'google-calendar', 'search', 'event-retrieval', 'case-management'],
  permissionsRequired: ['google_calendar:read'], // Assuming read permission is sufficient
  exampleUsage: {
    caseNumber: "CV-2024-12345"
  }
};

// To register this capability, import it and call:
// import { useCapabilityRegistryStore } from '../stores/capabilityRegistryStore';
// import { createCalendarEventFromAnalysisCapability } from './calendarCapabilities';
// useCapabilityRegistryStore.getState().registerCapability(createCalendarEventFromAnalysisCapability);
// This should typically be done once during application initialization (e.g., in App.tsx or a setup file).

// Add other calendar-related capabilities here, e.g., for updating or finding events. 