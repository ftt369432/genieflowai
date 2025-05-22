import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, EventProps as BigCalendarEventProps, EventInteractionArgs } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import { useTheme } from 'next-themes';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import enUS from 'date-fns/locale/en-US';

import { useCalendarStore, CalendarEvent as StoreCalendarEvent, TimeBlock as StoreTimeBlock } from '../store/calendarStore';
import { useTaskStore, Task as StoreTask } from '../store/taskStore';
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

// Define a more specific type for calendar events used by react-big-calendar
interface RbcEvent {
  id: string;
  title: string | undefined;
  start: Date;
  end: Date;
  allDay?: boolean;
  source?: 'event' | 'timeBlock' | 'task';
  description?: string;
  location?: string;
  component?: React.ElementType;
  taskId?: string;
  taskIds?: string[];
  originalStoreEvent?: StoreCalendarEvent;
  originalStoreBlock?: StoreTimeBlock;
  originalStoreTask?: StoreTask;
  calendarType?: string;
}

export function CalendarPage() {
  const { theme } = useTheme();
  const { events, timeBlocks, addEvent, updateEvent, deleteEvent, updateTimeBlock } = useCalendarStore();
  const { tasks } = useTaskStore();
  const [selectedEvent, setSelectedEvent] = useState<RbcEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showSmartScheduler, setShowSmartScheduler] = useState(false);
  const [viewMode, setViewMode] = useState('month');
  const [calendarDate, setCalendarDate] = useState(new Date());

  const calendarEvents: RbcEvent[] = events.map((event: StoreCalendarEvent) => ({
      id: event.id,
      title: event.title,
    start: typeof event.start === 'string' ? parseISO(event.start) : new Date(event.start),
    end: typeof event.end === 'string' ? parseISO(event.end) : new Date(event.end),
    allDay: event.allDay,
      source: 'event',
      description: event.description || '',
      location: event.location || '',
    originalStoreEvent: event,
    calendarType: event.sourceId || 'default', // For styling or filtering
  }));

  const timeBlockEvents: RbcEvent[] = timeBlocks.map((block: StoreTimeBlock) => ({
      id: block.id,
    title: block.name,
    start: typeof block.start === 'string' ? parseISO(block.start) : new Date(block.start),
    end: typeof block.end === 'string' ? parseISO(block.end) : new Date(block.end),
    allDay: false,
      source: 'timeBlock',
      description: block.description || '',
    taskIds: block.tasks || [],
    originalStoreBlock: block,
    calendarType: 'timeBlock',
  }));

  const taskEventOverlays: RbcEvent[] = tasks
    .filter(task => !task.completed && task.dueDate)
    .map((task: StoreTask) => {
      const dueDateDate = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : (task.dueDate ? new Date(task.dueDate) : new Date());
      return {
    id: `task-${task.id}`,
    title: task.title,
        start: dueDateDate,
        end: dueDateDate,
        allDay: true,
    source: 'task',
    description: task.description || '',
        component: TaskOverlay, // Assuming TaskOverlay is defined
    taskId: task.id,
        originalStoreTask: task,
        calendarType: 'task',
      };
    });

  const allEvents: RbcEvent[] = [...calendarEvents, ...timeBlockEvents, ...taskEventOverlays];

  const handleSelectEvent = (event: RbcEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    const newEventPartial: Omit<StoreCalendarEvent, 'id' | 'sourceId' | 'tags'> & Partial<Pick<StoreCalendarEvent, 'sourceId' | 'tags'>> = {
        title: 'New Event',
        start: start,
        end: end,
        allDay: false,
        // sourceId is required by StoreCalendarEvent, provide a default or make it optional
        sourceId: 'primary', // Example default
        tags: [], // Example default
    };
    // setShowEventModal(true); // This would typically open a modal to fill details for newEventPartial
    // For now, let's assume we directly add it or open a modal that then calls addEvent
    // The selectedEvent for the modal should be in RbcEvent format if the modal expects that
    setSelectedEvent({
        id: 'new_slot_event', // temporary ID for modal
        title: 'New Event',
      start,
      end,
        allDay: false,
        source: 'event',
    });
    setShowEventModal(true);
  };

  const moveEventHandler = ({ event, start, end }: EventInteractionArgs<RbcEvent>) => {
    const newStart = typeof start === 'string' ? parseISO(start) : start;
    const newEnd = typeof end === 'string' ? parseISO(end) : end;

    if (event.source === 'event' && event.originalStoreEvent) {
      updateEvent(event.originalStoreEvent.id, {
        start: newStart,
        end: newEnd,
      });
    } else if (event.source === 'timeBlock' && event.originalStoreBlock) {
      if (updateTimeBlock) {
        updateTimeBlock(event.originalStoreBlock.id, {
          start: newStart,
          end: newEnd,
        });
      }
    } else if (event.source === 'task' && event.originalStoreTask?.id ) {
        // Assuming useTaskStore has an updateTask similar to calendar
        const { updateTask } = useTaskStore.getState(); 
        if (updateTask && event.originalStoreTask) {
            updateTask(event.originalStoreTask.id, { dueDate: newStart });
        } else {
            console.warn('Task drag-and-drop: updateTask function not found in taskStore or originalTask missing.');
        }
    }
  };

  // Custom Event component for react-big-calendar
  const CustomEventComponent = (props: BigCalendarEventProps<RbcEvent>) => {
    const { event } = props;
    if (event.source === 'task' && event.component) {
      const EventComponent = event.component;
      return <EventComponent event={event} />;
    }
    return <div>{event.title}</div>;
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
            onEventDrop={moveEventHandler}
            onEventResize={moveEventHandler}
            eventPropGetter={eventStyleGetter}
            components={{ event: CustomEventComponent }}
            view={viewMode as any}
            onView={(newView: any) => setViewMode(newView)}
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
              updateEvent(event.id, {
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