import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CalendarEvent } from '../types/calendar';

interface CalendarStore {
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  getEventById: (id: string) => CalendarEvent | undefined;
}

export const useCalendarStore = create<CalendarStore>()(
  persist(
    (set, get) => ({
      events: [],

      addEvent: (eventData) => set((state) => ({
        events: [
          ...state.events,
          {
            ...eventData,
            id: crypto.randomUUID(),
          },
        ],
      })),

      updateEvent: (id, updates) => set((state) => ({
        events: state.events.map((event) =>
          event.id === id ? { ...event, ...updates } : event
        ),
      })),

      deleteEvent: (id) => set((state) => ({
        events: state.events.filter((event) => event.id !== id),
      })),

      getEventById: (id) => get().events.find((event) => event.id === id),
    }),
    {
      name: 'calendar-store',
    }
  )
); 