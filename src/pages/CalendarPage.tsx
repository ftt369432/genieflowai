import React, { useState } from 'react';
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../utils/cn';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  type: 'meeting' | 'task' | 'reminder';
  priority: 'low' | 'medium' | 'high';
  attendees?: Array<{
    name: string;
    avatar: string;
  }>;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SAMPLE_EVENTS: CalendarEvent[] = [
  {
    id: '1',
    title: 'Team Meeting',
    description: 'Weekly sync with the development team',
    startTime: new Date(2024, 1, 15, 10, 0),
    endTime: new Date(2024, 1, 15, 11, 0),
    type: 'meeting',
    priority: 'high',
    attendees: [
      { name: 'Alice', avatar: '👩‍💼' },
      { name: 'Bob', avatar: '👨‍💼' },
      { name: 'Charlie', avatar: '👨‍💻' }
    ]
  },
  {
    id: '2',
    title: 'Project Deadline',
    description: 'Submit final deliverables',
    startTime: new Date(2024, 1, 20, 17, 0),
    endTime: new Date(2024, 1, 20, 18, 0),
    type: 'task',
    priority: 'high'
  }
];

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(SAMPLE_EVENTS);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { colors } = useTheme();

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + (direction === 'next' ? 1 : -1),
      1
    ));
  };

  const getDayEvents = (date: Date) => {
    return events.filter(event => 
      event.startTime.getDate() === date.getDate() &&
      event.startTime.getMonth() === date.getMonth() &&
      event.startTime.getFullYear() === date.getFullYear()
    );
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 border border-border/50" />
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayEvents = getDayEvents(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = selectedDate?.toDateString() === date.toDateString();

      days.push(
        <div
          key={day}
          className={cn(
            "h-24 border border-border/50 p-1 cursor-pointer transition-colors",
            isToday && "bg-primary/5",
            isSelected && "border-primary",
            "hover:border-primary/50"
          )}
          onClick={() => setSelectedDate(date)}
        >
          <div className="flex justify-between items-start">
            <span className={cn(
              "text-sm font-medium",
              isToday ? "text-primary" : "text-text-primary"
            )}>
              {day}
            </span>
            {dayEvents.length > 0 && (
              <span className="text-xs text-primary bg-primary/10 px-1.5 rounded-full">
                {dayEvents.length}
              </span>
            )}
          </div>
          
          {dayEvents.slice(0, 2).map(event => (
            <div
              key={event.id}
              className={cn(
                "text-xs p-1 rounded truncate",
                event.type === 'meeting' && "bg-primary/10 text-primary",
                event.type === 'task' && "bg-warning/10 text-warning",
                event.type === 'reminder' && "bg-info/10 text-info"
              )}
            >
              {event.title}
            </div>
          ))}
          {dayEvents.length > 2 && (
            <div className="text-xs text-text-secondary">
              +{dayEvents.length - 2} more
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Calendar</h1>
          <p className="text-text-secondary">Schedule and manage your events</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Event
        </Button>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-text-primary">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
          Today
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-px mb-px">
            {DAYS.map(day => (
              <div
                key={day}
                className="p-2 text-center text-sm font-medium text-text-secondary"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-px bg-border">
            {renderCalendarDays()}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Events */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle>
              Events for {selectedDate.toLocaleDateString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getDayEvents(selectedDate).map(event => (
                <div
                  key={event.id}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-lg border border-border",
                    "hover:border-primary/20"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg",
                    event.type === 'meeting' && "bg-primary/10",
                    event.type === 'task' && "bg-warning/10",
                    event.type === 'reminder' && "bg-info/10"
                  )}>
                    {event.type === 'meeting' ? <Calendar className="w-5 h-5" /> :
                     event.type === 'task' ? <Clock className="w-5 h-5" /> :
                     <Calendar className="w-5 h-5" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-text-primary">{event.title}</h4>
                        <p className="text-sm text-text-secondary">{event.description}</p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="text-sm text-text-secondary">
                        {event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                        {event.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {event.attendees && (
                        <div className="flex -space-x-2">
                          {event.attendees.map((attendee, index) => (
                            <div
                              key={index}
                              className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs ring-2 ring-paper"
                              title={attendee.name}
                            >
                              {attendee.avatar}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}