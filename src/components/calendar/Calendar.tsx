import React, { useState, useEffect } from 'react';
import { format, addDays, subDays, startOfMonth, endOfMonth, isSameMonth, isSameDay, isBefore, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { CalendarEvent, Calendar as CalendarType, calendarService } from '../../services/calendar/calendarService';
import googleAuthService from '../../services/auth/googleAuth';
import { cn } from '../../lib/utils';

interface CalendarProps {
  className?: string;
}

export function Calendar({ className }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<CalendarType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  
  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);
  
  useEffect(() => {
    const fetchCalendarData = async () => {
      setIsLoading(true);
      try {
        // Initialize Google Auth
        await googleAuthService.initialize();

        // Fetch calendars
        const fetchedCalendars = await calendarService.fetchCalendars();
        setCalendars(fetchedCalendars);
        
        // Fetch events for the current month view
        const fetchedEvents = await calendarService.fetchEvents(startDate, endDate);
        setEvents(fetchedEvents);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCalendarData();
  }, [currentDate]);

  const previousMonth = () => {
    setCurrentDate(prevDate => subDays(prevDate, 30));
  };

  const nextMonth = () => {
    setCurrentDate(prevDate => addDays(prevDate, 30));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate dates for the current month view
  const daysInMonth = () => {
    const days = [];
    const firstDayOfMonth = startOfMonth(currentDate);
    const dayOfWeek = firstDayOfMonth.getDay();
    
    // Add days from previous month to fill the first week
    const prevMonthDays = dayOfWeek;
    const firstVisibleDate = subDays(firstDayOfMonth, prevMonthDays);
    
    // Generate 42 days (6 weeks) to ensure we have enough days for any month
    for (let i = 0; i < 42; i++) {
      const date = addDays(firstVisibleDate, i);
      days.push(date);
    }
    
    return days;
  };

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter(event => 
      isSameDay(date, event.start) || 
      (isBefore(event.start, date) && isSameDay(date, event.end)) ||
      (isBefore(event.start, date) && isBefore(date, event.end))
    );
  };
  
  // Render the day cell with its events
  const renderDay = (date: Date) => {
    const dayEvents = getEventsForDay(date);
    const isCurrentMonth = isSameMonth(date, currentDate);
    const isToday = isSameDay(date, new Date());
    
    return (
      <div 
        key={date.toString()} 
        className={cn(
          "border border-border h-32 p-1 overflow-hidden",
          !isCurrentMonth && "opacity-40 bg-muted/20",
          isToday && "bg-primary/5 border-primary/20"
        )}
      >
        <div className="flex justify-between items-start">
          <span 
            className={cn(
              "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
              isToday && "bg-primary text-primary-foreground"
            )}
          >
            {format(date, 'd')}
          </span>
        </div>
        <div className="mt-1 space-y-1 max-h-[calc(100%-2rem)] overflow-hidden">
          {dayEvents.slice(0, 3).map((event, index) => (
            <div 
              key={event.id + index}
              className="text-xs truncate rounded px-1 py-0.5"
              style={{ backgroundColor: event.color + '33' }} // Add transparency
            >
              {event.title}
            </div>
          ))}
          {dayEvents.length > 3 && (
            <div className="text-xs text-muted-foreground pl-1">
              +{dayEvents.length - 3} more
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("bg-background flex flex-col h-full", className)}>
      <div className="flex justify-between items-center p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToToday}
            className="ml-4 text-xs"
          >
            Today
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full" />
        </div>
      ) : (
        <>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-2 text-center text-sm font-medium">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="flex-1 grid grid-cols-7">
            {daysInMonth().map(date => renderDay(date))}
          </div>
        </>
      )}
    </div>
  );
} 