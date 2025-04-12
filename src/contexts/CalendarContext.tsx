import React, { createContext, useContext, useEffect, useState } from 'react';
import { Calendar, CalendarEvent, calendarService } from '../services/calendar/calendarService';
import { getEnv } from '../config/env';
import { useUserStore } from '../stores/userStore';
import googleAuthService from '../services/auth/googleAuth';

interface CalendarContextType {
  calendars: Calendar[];
  events: CalendarEvent[];
  loading: boolean;
  error: Error | null;
  refreshCalendars: () => Promise<void>;
  refreshEvents: (start: Date, end: Date) => Promise<void>;
}

const CalendarContext = createContext<CalendarContextType>({
  calendars: [],
  events: [],
  loading: true,
  error: null,
  refreshCalendars: async () => {},
  refreshEvents: async () => {},
});

export const useCalendar = () => useContext(CalendarContext);

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // Use the userStore instead of local state
  const user = useUserStore(state => state.user);
  const hasGoogleIntegration = useUserStore(state => state.hasGoogleIntegration);

  const refreshCalendars = async () => {
    try {
      setLoading(true);
      const fetchedCalendars = await calendarService.fetchCalendars();
      setCalendars(fetchedCalendars);
    } catch (error) {
      console.error('Failed to load calendars:', error);
      setError(error instanceof Error ? error : new Error('Failed to load calendars'));
    } finally {
      setLoading(false);
    }
  };

  const refreshEvents = async (start: Date, end: Date) => {
    try {
      setLoading(true);
      const fetchedEvents = await calendarService.fetchEvents(start, end);
      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
      setError(error instanceof Error ? error : new Error('Failed to load events'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadCalendarData() {
      try {
        if (!user?.email) {
          console.log('No user email available, skipping calendar load');
          setLoading(false);
          return;
        }

        console.log('Loading calendar data for user:', user.email);
        
        // Initialize the Google Auth service if the user has a Google integration
        if (hasGoogleIntegration()) {
          await googleAuthService.initialize();
        }
        
        // Get the calendars
        await refreshCalendars();
        
        // Get events for the current month
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        await refreshEvents(start, end);
      } catch (error) {
        console.error('Failed to load calendar data:', error);
        setError(error instanceof Error ? error : new Error('Failed to load calendar data'));
      } finally {
        setLoading(false);
      }
    }

    loadCalendarData();
  }, [user?.email, hasGoogleIntegration]);

  return (
    <CalendarContext.Provider 
      value={{ 
        calendars, 
        events, 
        loading, 
        error,
        refreshCalendars,
        refreshEvents
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}; 