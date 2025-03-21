import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CalendarEvent } from '../services/CalendarService';

interface CalendarState {
  events: CalendarEvent[];
  isGoogleCalendarConnected: boolean;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (event: CalendarEvent) => void;
  deleteEvent: (eventId: string) => void;
  connectGoogleCalendar: () => void;
  disconnectGoogleCalendar: () => void;
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      events: [],
      isGoogleCalendarConnected: false,
      addEvent: (event: CalendarEvent) => set((state) => ({ events: [...state.events, event] })),
      updateEvent: (event: CalendarEvent) =>
        set((state) => ({
          events: state.events.map((e) => (e.id === event.id ? event : e)),
        })),
      deleteEvent: (eventId: string) =>
        set((state) => ({
          events: state.events.filter((e) => e.id !== eventId),
        })),
      connectGoogleCalendar: () => set({ isGoogleCalendarConnected: true }),
      disconnectGoogleCalendar: () => set({ isGoogleCalendarConnected: false }),
    }),
    {
      name: 'calendar-storage',
    }
  )
);