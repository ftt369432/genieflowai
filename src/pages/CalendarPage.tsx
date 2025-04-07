import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import { useTheme } from 'next-themes';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import enUS from 'date-fns/locale/en-US';

import { useCalendarStore } from '../store/calendarStore';
import { useTaskStore } from '../store/taskStore';
import { parseISO } from 'date-fns';
import { ProductivityInsights } from '../components/calendar/ProductivityInsights';
import { OverlaysDropdown } from '../components/calendar/OverlaysDropdown';
import { CalendarRightPanel } from '../components/calendar/CalendarRightPanel';
import { SmartScheduler } from '../components/calendar/SmartScheduler';
import { CalendarEventModal } from '../components/calendar/CalendarEventModal';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui';

import {
  Check,
  ChevronDown,
  Clock,
  Plus,
  MoreHorizontal,
  Sparkles,
  Calendar as CalendarIcon,
  Filter,
  Settings2,
} from 'lucide-react';

// Create a drag-and-drop capable calendar
const DragAndDropCalendar = withDragAndDrop(Calendar);

// Set up localization for the calendar
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Define event styles based on type
const eventStyleGetter = (event: any) => {
  let style = {
    backgroundColor: '#3182ce',
    borderColor: '#2b6cb0',
    color: 'white',
    borderRadius: '4px',
    border: 'none',
    padding: '2px 5px',
    fontSize: '90%',
  };
  
  if (event.type === 'deep-work') {
    style.backgroundColor = '#4f46e5'; // indigo
  } else if (event.type === 'meeting') {
    style.backgroundColor = '#0891b2'; // cyan
  } else if (event.type === 'admin') {
    style.backgroundColor = '#6366f1'; // blue
  } else if (event.type === 'learning') {
    style.backgroundColor = '#8b5cf6'; // violet
  } else if (event.type === 'break') {
    style.backgroundColor = '#d946ef'; // fuchsia
  } else if (event.type === 'task') {
    style.backgroundColor = '#059669'; // emerald
  } else if (event.type === 'automation') {
    style.backgroundColor = '#f59e0b'; // amber
  }
  
  return {
    style
  };
};

// Custom overlay component for tasks
const TaskOverlay = ({ event }: any) => {
  return (
    <div
      style={{
        position: 'absolute',
        borderLeft: '3px solid #059669',
        backgroundColor: 'rgba(5, 150, 105, 0.15)',
        color: '#059669',
        borderRadius: '2px',
        padding: '2px 4px',
        fontSize: '80%',
        cursor: 'pointer',
        zIndex: 1,
        width: '98%',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ marginRight: '4px' }}>●</span>
              {event.title}
            </div>
        </div>
      );
};

export function CalendarPage() {
  const { theme } = useTheme();
  const { events, timeBlocks, addEvent, updateEvent, deleteEvent } = useCalendarStore();
  const { tasks } = useTaskStore();
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showSmartScheduler, setShowSmartScheduler] = useState(false);
  const [viewMode, setViewMode] = useState('week');
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Convert events and timeBlocks to calendar events
  const calendarEvents = [
    ...events.map(event => ({
      id: event.id,
      title: event.title,
      start: parseISO(event.start),
      end: parseISO(event.end),
      type: event.category || 'default',
      source: 'event',
      description: event.description || '',
      location: event.location || '',
    })),
    ...timeBlocks.map(block => ({
      id: block.id,
      title: block.title,
      start: parseISO(block.start),
      end: parseISO(block.end),
      type: block.type || 'default',
      source: 'timeBlock',
      description: block.description || '',
      taskIds: block.taskIds || [],
    })),
  ];

  // Create task overlays if enabled
  const taskOverlays = tasks.filter(task => !task.completed && task.dueDate).map(task => ({
    id: `task-${task.id}`,
    title: task.title,
    start: parseISO(task.dueDate!),
    end: parseISO(task.dueDate!),
    type: 'task',
    source: 'task',
    description: task.description || '',
    component: TaskOverlay,
    taskId: task.id,
  }));

  // Add task overlays to calendar events if enabled
  const allEvents = [...calendarEvents, ...taskOverlays];

  // Handle event selection
  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  // Handle event creation
  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    const title = '';
    setSelectedEvent({
      title,
      start,
      end,
      type: 'default',
      source: 'timeBlock', // Default to creating a time block
      description: '',
    });
    setShowEventModal(true);
  };

  // Handle event drag and drop
  const moveEvent = ({ event, start, end }: { event: any; start: Date; end: Date }) => {
    if (event.source === 'event') {
      updateEvent({
        id: event.id,
        start: start.toISOString(),
        end: end.toISOString(),
      });
    } else if (event.source === 'timeBlock') {
      // Update time block
      const updatedBlock = {
        id: event.id,
        start: start.toISOString(),
        end: end.toISOString(),
      };
      // Call appropriate update function
    }
  };

  // Handle event resize
  const resizeEvent = ({ event, start, end }: { event: any; start: Date; end: Date }) => {
    moveEvent({ event, start, end });
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h1 className="text-2xl font-bold">Calendar</h1>
          
          <div className="flex items-center space-x-2">
            <OverlaysDropdown />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <Check className="mr-2 h-4 w-4" />
                  All Events
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  Meetings Only
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  Focus Time Only
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Clock className="mr-2 h-4 w-4" />
                  Show Time Blocks
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              size="sm" 
              onClick={() => setShowSmartScheduler(true)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Optimize Schedule
            </Button>
            
            <Button 
              onClick={() => handleSelectSlot({ start: new Date(), end: new Date(new Date().getTime() + 60 * 60 * 1000) })}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-2 px-4 border-b">
          <div className="flex gap-2">
            <Button variant={viewMode === 'day' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('day')}>
              Day
            </Button>
            <Button variant={viewMode === 'week' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('week')}>
              Week
            </Button>
            <Button variant={viewMode === 'month' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('month')}>
              Month
            </Button>
            <Button variant={viewMode === 'agenda' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('agenda')}>
              Agenda
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCalendarDate(new Date())}>
              Today
            </Button>
            <Button variant="ghost" size="sm" onClick={() => {
              // Previous period based on current view
              const newDate = new Date(calendarDate);
              if (viewMode === 'day') newDate.setDate(newDate.getDate() - 1);
              else if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
              else if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
              setCalendarDate(newDate);
            }}>
              Back
            </Button>
            <Button variant="ghost" size="sm" onClick={() => {
              // Next period based on current view
              const newDate = new Date(calendarDate);
              if (viewMode === 'day') newDate.setDate(newDate.getDate() + 1);
              else if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
              else if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
              setCalendarDate(newDate);
            }}>
              Next
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          <DragAndDropCalendar
            localizer={localizer}
            events={allEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            selectable
            resizable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            onEventDrop={moveEvent}
            onEventResize={resizeEvent}
            eventPropGetter={eventStyleGetter}
            components={{
              event: (props) => {
                if (props.event.source === 'task') {
                  return <props.event.component event={props.event} />;
                }
                return <div>{props.title}</div>;
              }
            }}
            view={viewMode}
            onView={(newView) => setViewMode(newView)}
            date={calendarDate}
            onNavigate={(newDate) => setCalendarDate(newDate)}
          />
        </div>
      </div>
      
      {/* Right panel */}
      <CalendarRightPanel />
      
      {/* Event Modal */}
      <CalendarEventModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        event={selectedEvent}
        onSave={(event) => {
          if (event.id) {
            // Update existing event
            if (event.source === 'event') {
              updateEvent({
                id: event.id,
                title: event.title,
                start: event.start.toISOString(),
                end: event.end.toISOString(),
                category: event.type,
                description: event.description,
                location: event.location,
              });
            } else {
              // Update time block
              // Call appropriate update function
            }
          } else {
            // Create new event
            const id = Date.now().toString();
            addEvent({
              id,
              title: event.title,
              start: event.start.toISOString(),
              end: event.end.toISOString(),
              category: event.type,
              description: event.description,
              location: event.location,
            });
          }
          setShowEventModal(false);
        }}
      />
      
      {/* Smart Scheduler Modal */}
      <SmartScheduler
        isOpen={showSmartScheduler}
        onClose={() => setShowSmartScheduler(false)}
        tasks={tasks}
        onSchedule={(schedule) => {
          // Handle the AI-generated schedule
          console.log('AI Schedule:', schedule);
          setShowSmartScheduler(false);
        }}
      />
    </div>
  );
}