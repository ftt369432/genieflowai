/**
 * Calendar Service Module - Mock Implementation
 */

import { CalendarService, type CalendarEvent, type Calendar, type Attendee, type Reminder, type TimeSlot } from './calendarService';

// Create and export the service instance
export const calendarService = new CalendarService();

// Re-export types
export type { CalendarEvent, Calendar, Attendee, Reminder, TimeSlot }; 