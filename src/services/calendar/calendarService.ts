import { v4 as uuidv4 } from 'uuid';
import { getEnv } from '../../config/env';
import { EmailAnalysis } from '../email';
import googleAuthService from '../auth/googleAuth';

// Calendar types
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  description?: string;
  location?: string;
  calendarId: string;
  calendarName: string;
  color: string;
  source: 'google' | 'outlook' | 'custom';
}

export interface Calendar {
  id: string;
  name: string;
  color: string;
  source: 'google' | 'outlook' | 'custom';
  primary: boolean;
  enabled: boolean;
}

export interface CalendarFilter {
  calendarIds?: string[];
  fromDate?: Date;
  toDate?: Date;
  title?: string;
  attendees?: string[]; // Email addresses
  status?: 'confirmed' | 'tentative' | 'cancelled';
}

/**
 * Service for managing calendars and events
 */
export class CalendarService {
  private events: CalendarEvent[] = [];
  private calendars: Calendar[] = [];
  private eventsStorageKey = 'genieflow_calendar_events';
  private calendarsStorageKey = 'genieflow_calendars';

  constructor() {
    this.loadFromStorage();
    console.log(`CalendarService initialized with ${this.calendars.length} calendars and ${this.events.length} events`);
    
    const { useMock } = getEnv();
    
    // Try to initialize Google Auth if in production mode
    if (!useMock) {
      this.initializeGoogleAuth();
    }
  }
  
  /**
   * Initialize Google Auth
   */
  private async initializeGoogleAuth(): Promise<void> {
    try {
      await googleAuthService.initialize();
      console.log('Google Auth service initialized for calendar');
    } catch (error) {
      console.error('Failed to initialize Google Auth for calendar:', error);
    }
  }

  /**
   * Load calendars and events from local storage
   */
  private loadFromStorage(): void {
    const { useMock } = getEnv();
    
    try {
      // Load calendars
      const calendarsJson = localStorage.getItem(this.calendarsStorageKey);
      if (calendarsJson) {
        this.calendars = JSON.parse(calendarsJson);
      } else if (useMock) {
        this.initializeMockCalendars();
      }
      
      // Load events
      const eventsJson = localStorage.getItem(this.eventsStorageKey);
      if (eventsJson) {
        const parsedEvents = JSON.parse(eventsJson);
        
        // Convert date strings back to Date objects
        this.events = parsedEvents.map((event: any) => ({
          ...event,
          startTime: new Date(event.startTime),
          endTime: new Date(event.endTime),
          createdAt: new Date(event.createdAt),
          updatedAt: new Date(event.updatedAt),
          recurrence: event.recurrence ? {
            ...event.recurrence,
            endDate: event.recurrence.endDate ? new Date(event.recurrence.endDate) : undefined
          } : undefined,
          sourceEmail: event.sourceEmail ? {
            ...event.sourceEmail,
            receivedAt: new Date(event.sourceEmail.receivedAt)
          } : undefined
        }));
      } else if (useMock) {
        this.initializeMockEvents();
      }
    } catch (error) {
      console.error('Failed to load calendar data from storage:', error);
      if (useMock) {
        this.initializeMockCalendars();
        this.initializeMockEvents();
      }
    }
  }

  /**
   * Save calendars and events to local storage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.calendarsStorageKey, JSON.stringify(this.calendars));
      localStorage.setItem(this.eventsStorageKey, JSON.stringify(this.events));
    } catch (error) {
      console.error('Failed to save calendar data to storage:', error);
    }
  }

  /**
   * Initialize with mock calendars
   */
  private initializeMockCalendars(): void {
    this.calendars = [
      {
        id: 'calendar-1',
        name: 'Personal',
        color: '#4285F4', // Blue
        source: 'local',
        primary: true,
        enabled: true
      },
      {
        id: 'calendar-2',
        name: 'Work',
        color: '#0F9D58', // Green
        source: 'local',
        primary: false,
        enabled: true
      },
      {
        id: 'calendar-3',
        name: 'Holidays',
        color: '#DB4437', // Red
        source: 'local',
        primary: false,
        enabled: true
      }
    ];
    
    this.saveToStorage();
  }

  /**
   * Initialize with mock events
   */
  private initializeMockEvents(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    this.events = [
      {
        id: uuidv4(),
        title: 'Team Meeting',
        description: 'Weekly team sync-up meeting',
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0),
        location: 'Conference Room A',
        videoConferenceLink: 'https://meet.google.com/abc-defg-hij',
        attendees: [
          { email: 'user@example.com', name: 'Current User', organizer: true, response: 'accepted' },
          { email: 'teammate1@example.com', name: 'Teammate 1', response: 'accepted' },
          { email: 'teammate2@example.com', name: 'Teammate 2', response: 'tentative' }
        ],
        isAllDay: false,
        recurrence: {
          pattern: 'weekly',
          interval: 1
        },
        reminders: [
          { method: 'notification', minutes: 10 },
          { method: 'email', minutes: 60 }
        ],
        status: 'confirmed',
        createdAt: new Date(now.getTime() - 86400000 * 7),
        updatedAt: new Date(now.getTime() - 86400000 * 2),
        calendar: {
          id: 'calendar-2',
          name: 'Work'
        }
      },
      {
        id: uuidv4(),
        title: 'Lunch with Sarah',
        description: 'Catch-up lunch at the Italian restaurant',
        startTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 12, 30),
        endTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 13, 30),
        location: 'La Trattoria, 123 Main St',
        isAllDay: false,
        status: 'confirmed',
        createdAt: new Date(now.getTime() - 86400000 * 3),
        updatedAt: new Date(now.getTime() - 86400000 * 3),
        calendar: {
          id: 'calendar-1',
          name: 'Personal'
        }
      },
      {
        id: uuidv4(),
        title: 'Project Deadline',
        description: 'Submit final deliverables for the Q3 project',
        startTime: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 17, 0),
        endTime: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 17, 0),
        isAllDay: false,
        reminders: [
          { method: 'notification', minutes: 1440 }, // 1 day before
          { method: 'notification', minutes: 120 }   // 2 hours before
        ],
        status: 'confirmed',
        createdAt: new Date(now.getTime() - 86400000 * 14),
        updatedAt: new Date(now.getTime() - 86400000 * 14),
        calendar: {
          id: 'calendar-2',
          name: 'Work'
        }
      }
    ];
    
    this.saveToStorage();
  }

  /**
   * Get all calendars
   */
  public async getCalendars(): Promise<Calendar[]> {
    await this.simulateNetworkDelay();
    return [...this.calendars];
  }

  /**
   * Get default calendar
   */
  public async getDefaultCalendar(): Promise<Calendar> {
    await this.simulateNetworkDelay();
    const defaultCalendar = this.calendars.find(cal => cal.primary);
    if (!defaultCalendar) {
      throw new Error('No default calendar found');
    }
    return defaultCalendar;
  }

  /**
   * Add a new calendar
   */
  public async addCalendar(calendar: Omit<Calendar, 'id'>): Promise<Calendar> {
    await this.simulateNetworkDelay();
    
    const newCalendar: Calendar = {
      id: uuidv4(),
      ...calendar
    };
    
    // If this is marked as default, update other calendars
    if (newCalendar.primary) {
      this.calendars.forEach(cal => {
        cal.primary = false;
      });
    }
    
    this.calendars.push(newCalendar);
    this.saveToStorage();
    
    return newCalendar;
  }

  /**
   * Update a calendar
   */
  public async updateCalendar(id: string, updates: Partial<Omit<Calendar, 'id'>>): Promise<Calendar | null> {
    await this.simulateNetworkDelay();
    
    const index = this.calendars.findIndex(cal => cal.id === id);
    if (index === -1) return null;
    
    const updatedCalendar = {
      ...this.calendars[index],
      ...updates
    };
    
    // If this is marked as default, update other calendars
    if (updates.primary) {
      this.calendars.forEach(cal => {
        if (cal.id !== id) {
          cal.primary = false;
        }
      });
    }
    
    this.calendars[index] = updatedCalendar;
    this.saveToStorage();
    
    return updatedCalendar;
  }

  /**
   * Delete a calendar and all its events
   */
  public async deleteCalendar(id: string): Promise<boolean> {
    await this.simulateNetworkDelay();
    
    // Don't delete the default calendar
    const calendarToDelete = this.calendars.find(cal => cal.id === id);
    if (!calendarToDelete || calendarToDelete.primary) {
      return false;
    }
    
    // Delete all events in this calendar
    this.events = this.events.filter(event => event.calendarId !== id);
    
    // Delete the calendar
    this.calendars = this.calendars.filter(cal => cal.id !== id);
    
    this.saveToStorage();
    return true;
  }

  /**
   * Get events, optionally filtered
   */
  public async getEvents(filter?: CalendarFilter): Promise<CalendarEvent[]> {
    await this.simulateNetworkDelay();
    
    let filteredEvents = [...this.events];
    
    if (filter) {
      if (filter.calendarIds && filter.calendarIds.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
          filter.calendarIds!.includes(event.calendarId)
        );
      }
      
      if (filter.fromDate) {
        const fromDate = new Date(filter.fromDate);
        filteredEvents = filteredEvents.filter(event => event.endTime >= fromDate);
      }
      
      if (filter.toDate) {
        const toDate = new Date(filter.toDate);
        filteredEvents = filteredEvents.filter(event => event.startTime <= toDate);
      }
      
      if (filter.title) {
        const titleLower = filter.title.toLowerCase();
      filteredEvents = filteredEvents.filter(event => 
          event.title.toLowerCase().includes(titleLower)
      );
    }
    
      if (filter.attendees && filter.attendees.length > 0) {
        filteredEvents = filteredEvents.filter(event => 
          event.attendees && event.attendees.some(attendee => 
            filter.attendees!.includes(attendee.email)
          )
        );
      }
      
      if (filter.status) {
        filteredEvents = filteredEvents.filter(event => event.status === filter.status);
      }
    }
    
    // Sort by start time (ascending)
    return filteredEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  /**
   * Get a specific event by ID
   */
  public async getEvent(id: string): Promise<CalendarEvent | null> {
    await this.simulateNetworkDelay();
    return this.events.find(event => event.id === id) || null;
  }

  /**
   * Create a new event
   */
  public async createEvent(eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<CalendarEvent> {
    await this.simulateNetworkDelay();
    
    const now = new Date();
    const newEvent: CalendarEvent = {
      id: uuidv4(),
      ...eventData,
      createdAt: now,
      updatedAt: now
    };
    
    this.events.push(newEvent);
    this.saveToStorage();
    
    return newEvent;
  }

  /**
   * Update an event
   */
  public async updateEvent(id: string, updates: Partial<Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CalendarEvent | null> {
    await this.simulateNetworkDelay();
    
    const index = this.events.findIndex(event => event.id === id);
    if (index === -1) return null;
    
    const updatedEvent = {
      ...this.events[index],
      ...updates,
      updatedAt: new Date()
    };
    
    this.events[index] = updatedEvent;
    this.saveToStorage();
    
    return updatedEvent;
  }

  /**
   * Delete an event
   */
  public async deleteEvent(id: string): Promise<boolean> {
    await this.simulateNetworkDelay();
    
    const initialLength = this.events.length;
    this.events = this.events.filter(event => event.id !== id);
    const wasDeleted = initialLength > this.events.length;
    
    if (wasDeleted) {
      this.saveToStorage();
    }
    
    return wasDeleted;
  }

  /**
   * Create event from email analysis
   */
  public async createEventFromEmail(emailAnalysis: EmailAnalysis, emailInfo: {
    messageId: string;
    accountId: string;
    subject: string;
    sender: string;
    receivedAt: Date;
  }): Promise<CalendarEvent | null> {
    await this.simulateNetworkDelay();
    
    // Only process if this is a meeting invitation
    if (!emailAnalysis.meetingDetails) {
      return null;
    }
    
    // Default to 1 hour meeting if no duration is specified
    const defaultDurationMinutes = 60;
    
    // Parse date and time
    let startTime: Date | null = null;
    let endTime: Date | null = null;
    
    // Try to parse the meeting date and time
    try {
      if (emailAnalysis.meetingDetails.date) {
        // Create a base date from the date string
        const baseDate = new Date(emailAnalysis.meetingDetails.date);
        
        // If there's a time, parse it and set on the date
        if (emailAnalysis.meetingDetails.time) {
          // Extract hours and minutes from time string
          const timeMatch = emailAnalysis.meetingDetails.time.match(/(\d{1,2}):(\d{2})\s*([ap]m)?/i);
          
          if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            const isPM = timeMatch[3] && timeMatch[3].toLowerCase() === 'pm';
            
            // Convert to 24-hour format if needed
            if (isPM && hours < 12) {
              hours += 12;
            } else if (!isPM && hours === 12) {
              hours = 0;
            }
            
            baseDate.setHours(hours, minutes, 0, 0);
          }
        } else {
          // Default to 9 AM if no time is specified
          baseDate.setHours(9, 0, 0, 0);
        }
        
        startTime = new Date(baseDate);
        
        // Calculate end time based on duration or default
        endTime = new Date(startTime);
        
        if (emailAnalysis.meetingDetails.duration) {
          const durationMatch = emailAnalysis.meetingDetails.duration.match(/(\d+)\s*(hour|minute|min)/i);
          
          if (durationMatch) {
            const amount = parseInt(durationMatch[1]);
            const unit = durationMatch[2].toLowerCase();
            
            if (unit.includes('hour')) {
              endTime.setHours(endTime.getHours() + amount);
            } else {
              endTime.setMinutes(endTime.getMinutes() + amount);
            }
          } else {
            endTime.setMinutes(endTime.getMinutes() + defaultDurationMinutes);
          }
        } else {
          endTime.setMinutes(endTime.getMinutes() + defaultDurationMinutes);
        }
      }
    } catch (error) {
      console.error('Failed to parse meeting date/time:', error);
    }
    
    // If we couldn't parse a date/time, make an educated guess
    if (!startTime) {
      startTime = new Date();
      startTime.setHours(startTime.getHours() + 24); // Tomorrow
      startTime.setMinutes(0, 0, 0);
      startTime.setHours(9); // 9 AM
      
      endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 1); // 1 hour later
    }
    
    // Extract attendees
    const attendees: Attendee[] = [];
    
    // Always add the sender as an organizer
    const senderName = emailInfo.sender.split('<')[0].trim();
    const senderEmail = emailInfo.sender.match(/<([^>]+)>/) 
      ? emailInfo.sender.match(/<([^>]+)>/)![1] 
      : emailInfo.sender;
    
    attendees.push({
      email: senderEmail,
      name: senderName,
      organizer: true,
      response: 'accepted'
    });
    
    // Add the current user (recipient)
    attendees.push({
      email: 'user@example.com', // This would be replaced with the actual user email
      name: 'Current User',
      response: 'needsAction'
    });
    
    // Add any other attendees found in the email
    if (emailAnalysis.meetingDetails.attendees) {
      emailAnalysis.meetingDetails.attendees.forEach(attendeeText => {
        // Skip if this is the sender or current user
        if (attendeeText.includes(senderEmail) || attendeeText.includes('user@example.com')) {
          return;
        }
        
        // Try to extract name and email
        const attendeeName = attendeeText.split('<')[0].trim();
        const attendeeEmail = attendeeText.match(/<([^>]+)>/) 
          ? attendeeText.match(/<([^>]+)>/)![1] 
          : attendeeText.trim();
        
        if (attendeeEmail && !attendees.some(a => a.email === attendeeEmail)) {
          attendees.push({
            email: attendeeEmail,
            name: attendeeName !== attendeeEmail ? attendeeName : undefined,
            response: 'needsAction'
          });
        }
      });
    }
    
    // Get the default calendar
    const defaultCalendar = await this.getDefaultCalendar();
    
    // Create the event
    const eventTitle = emailInfo.subject.toLowerCase().includes('meeting') || 
                      emailInfo.subject.toLowerCase().includes('call') || 
                      emailInfo.subject.toLowerCase().includes('discussion')
      ? emailInfo.subject
      : `Meeting: ${emailInfo.subject}`;
    
    const newEvent: CalendarEvent = {
      id: uuidv4(),
      title: eventTitle,
      description: `Meeting extracted from email: "${emailInfo.subject}"`,
      startTime,
      endTime,
      location: emailAnalysis.meetingDetails.location,
      videoConferenceLink: emailAnalysis.meetingDetails.videoLink,
      attendees,
      isAllDay: false,
      reminders: [
        { method: 'notification', minutes: 10 }
      ],
      status: 'tentative',
      createdAt: new Date(),
      updatedAt: new Date(),
      calendar: {
        id: defaultCalendar.id,
        name: defaultCalendar.name
      },
      sourceEmail: {
        messageId: emailInfo.messageId,
        accountId: emailInfo.accountId,
        subject: emailInfo.subject,
        sender: emailInfo.sender,
        receivedAt: emailInfo.receivedAt
      }
    };
    
    // Save to storage
    this.events.push(newEvent);
    this.saveToStorage();
    
    return newEvent;
  }

  /**
   * Helper to simulate network delay
   */
  private async simulateNetworkDelay(min: number = 100, max: number = 300): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  async fetchCalendars(): Promise<Calendar[]> {
    const googleCalendars = await this.fetchGoogleCalendars();
    this.calendars = [...googleCalendars];
    return this.calendars;
  }

  private async fetchGoogleCalendars(): Promise<Calendar[]> {
    try {
      // Check if Google Auth Service is initialized and signed in
      if (!googleAuthService || !googleAuthService.isSignedIn()) {
        console.log('Google Auth service not initialized or user not signed in');
        return [];
      }
      
      // Ensure googleAuthService is properly initialized
      if (!googleAuthService.fetchCalendars) {
        console.error('fetchCalendars method not available on googleAuthService');
        return [];
      }

      // Call fetchCalendars and handle potential errors
      const calendars = await googleAuthService.fetchCalendars().catch(error => {
        console.error('Error in googleAuthService.fetchCalendars:', error);
        return [];
      });
      
      if (!calendars || !Array.isArray(calendars)) {
        console.error('Invalid response from fetchCalendars, expected array but got:', calendars);
        return [];
      }
      
      return calendars.map((calendar: any) => ({
        id: calendar.id,
        name: calendar.summary || 'Unnamed Calendar',
        color: calendar.backgroundColor || '#4285F4',
        source: 'google',
        primary: calendar.primary || false,
        enabled: true // Default to enabled
      }));
    } catch (error) {
      console.error('Error fetching Google calendars:', error);
      return [];
    }
  }

  async fetchEvents(start: Date, end: Date): Promise<CalendarEvent[]> {
    // Make sure we have the latest calendars
    if (this.calendars.length === 0) {
      await this.fetchCalendars();
    }

    // Only fetch events from enabled calendars
    const enabledCalendars = this.calendars.filter(cal => cal.enabled);
    
    // Fetch events from Google Calendar
    const googleEvents = await this.fetchGoogleEvents(
      enabledCalendars.filter(cal => cal.source === 'google'),
      start,
      end
    );
    
    return [...googleEvents];
  }

  private async fetchGoogleEvents(
    calendars: Calendar[], 
    start: Date, 
    end: Date
  ): Promise<CalendarEvent[]> {
    if (!googleAuthService.isSignedIn() || calendars.length === 0) {
      return [];
    }

    try {
      // Convert dates to ISO strings for Google API
      const timeMin = start.toISOString();
      const timeMax = end.toISOString();
      
      // Fetch events for each enabled Google calendar
      const allEventsPromises = calendars.map(async (calendar) => {
        const events = await googleAuthService.fetchEvents(calendar.id, timeMin, timeMax);
        
        return events.map((event: any) => {
          // Handle all-day events
          const isAllDay = !event.start.dateTime;
          
          // Parse start and end times
          const startDate = isAllDay
            ? new Date(event.start.date)
            : new Date(event.start.dateTime);
          
          const endDate = isAllDay
            ? new Date(event.end.date)
            : new Date(event.end.dateTime);
          
          // For all-day events, Google's end date is exclusive, so subtract one day
          if (isAllDay) {
            endDate.setDate(endDate.getDate() - 1);
          }
          
          return {
            id: event.id,
            title: event.summary || 'Untitled Event',
            start: startDate,
            end: endDate,
            allDay: isAllDay,
            description: event.description,
            location: event.location,
            calendarId: calendar.id,
            calendarName: calendar.name,
            color: calendar.color,
            source: 'google' as const
          };
        });
      });
      
      // Flatten the array of arrays into a single array of events
      const results = await Promise.all(allEventsPromises);
      return results.flat();
    } catch (error) {
      console.error('Error fetching Google events:', error);
      return [];
    }
  }
  
  getCalendars(): Calendar[] {
    return this.calendars;
  }
  
  updateCalendarEnabled(calendarId: string, enabled: boolean): void {
    this.calendars = this.calendars.map(calendar => {
      if (calendar.id === calendarId) {
        return { ...calendar, enabled };
      }
      return calendar;
    });
  }
}

// Create a singleton instance
export const calendarService = new CalendarService();
