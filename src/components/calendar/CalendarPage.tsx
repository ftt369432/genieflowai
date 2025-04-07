import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { useCalendarStore } from '../../store/calendarStore';
import { useTaskStore } from '../../store/taskStore';
import { ProductivityInsights } from './ProductivityInsights';
import { SmartScheduler } from './SmartScheduler';
import { TaskOverlayToggle } from './TaskOverlayToggle';
import { CalendarEventModal } from './CalendarEventModal';
import { 
  Plus, 
  BarChart2, 
  Clock, 
  Filter, 
  Calendar as CalendarIcon, 
  Sparkles,
  MoreHorizontal,
  Settings2,
  Check
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/DropdownMenu';

// Setup the localizer
const localizer = momentLocalizer(moment);

// Style events based on their type
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
  const { events, timeBlocks, addEvent, updateEvent, deleteEvent, addTimeBlock } = useCalendarStore();
  const { tasks } = useTaskStore();
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showSmartScheduler, setShowSmartScheduler] = useState(false);
  const [viewMode, setViewMode] = useState('week');
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Format events and timeBlocks for the calendar
  const calendarEvents = [
    // Format regular events
    ...events.map(event => ({
      id: event.id,
      title: event.title,
      start: new Date(event.start),
      end: new Date(event.end),
      type: event.category || 'default',
      source: 'event',
      description: event.description || '',
      location: event.location || '',
    })),
    // Format time blocks
    ...timeBlocks.map(block => ({
      id: block.id,
      title: block.title,
      start: new Date(block.start),
      end: new Date(block.end),
      type: block.type || 'default',
      source: 'timeBlock',
      description: block.description || '',
      taskIds: block.taskIds || [],
    })),
  ];

  // Format task overlays (for tasks with due dates)
  const taskOverlays = tasks
    .filter(task => !task.completed && task.dueDate)
    .map(task => ({
      id: `task-${task.id}`,
      title: task.title,
      start: new Date(task.dueDate!),
      end: new Date(task.dueDate!),
      type: 'task',
      source: 'task',
      description: task.description || '',
      component: TaskOverlay,
      taskId: task.id,
    }));

  // Combine all event types
  const allEvents = [...calendarEvents, ...taskOverlays];

  // Handle event selection
  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  // Handle slot selection for new event creation
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
      // Update time block with the same API call structure
      updateEvent({
        id: event.id,
        start: start.toISOString(),
        end: end.toISOString(),
      });
    }
  };

  // Handle event resize
  const resizeEvent = ({ event, start, end }: { event: any; start: Date; end: Date }) => {
    moveEvent({ event, start, end });
  };

  // Save event from modal
  const handleSaveEvent = (eventData: any) => {
    // If it's a new event
    if (!eventData.id) {
      if (eventData.source === 'timeBlock') {
        addTimeBlock({
          id: Math.random().toString(36).substring(2, 9), // Generate random ID
          title: eventData.title,
          start: eventData.start.toISOString(),
          end: eventData.end.toISOString(),
          type: eventData.type || 'deep-work',
          description: eventData.description || '',
          taskIds: eventData.taskIds || [],
        });
      } else {
        addEvent({
          id: Math.random().toString(36).substring(2, 9), // Generate random ID
          title: eventData.title,
          start: eventData.start.toISOString(),
          end: eventData.end.toISOString(),
          category: eventData.type || 'default',
          description: eventData.description || '',
          location: eventData.location || '',
        });
      }
    } else {
      // Update existing event
      updateEvent({
        id: eventData.id,
        title: eventData.title,
        start: eventData.start.toISOString(),
        end: eventData.end.toISOString(),
        category: eventData.type || 'default',
        description: eventData.description || '',
        location: eventData.location || '',
      });
    }
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  // Delete event
  const handleDeleteEvent = (eventId: string) => {
    deleteEvent(eventId);
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  return (
    <div className="container mx-auto p-4 max-w-[1400px]">
      <div className="flex flex-col space-y-4">
        {/* Header section */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Calendar</h1>
          
          <div className="flex items-center space-x-2">
            <TaskOverlayToggle />
            
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
                  <span>Deep Work</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Check className="mr-2 h-4 w-4" />
                  <span>Meetings</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Check className="mr-2 h-4 w-4" />
                  <span>Admin Tasks</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings2 className="mr-2 h-4 w-4" />
                  <span>Calendar Settings</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button size="sm" onClick={() => setShowSmartScheduler(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Optimize Schedule
            </Button>
            
            <Button size="sm" onClick={() => handleSelectSlot({ start: new Date(), end: new Date(new Date().getTime() + 30*60000) })}>
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-12 gap-4">
          {/* Main Calendar */}
          <div className="col-span-12 md:col-span-9">
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <Tabs value={viewMode} onValueChange={setViewMode} className="w-64">
                      <TabsList>
                        <TabsTrigger value="day">Day</TabsTrigger>
                        <TabsTrigger value="week">Week</TabsTrigger>
                        <TabsTrigger value="month">Month</TabsTrigger>
                        <TabsTrigger value="agenda">Agenda</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newDate = new Date(calendarDate);
                        if (viewMode === 'day') {
                          newDate.setDate(newDate.getDate() - 1);
                        } else if (viewMode === 'week') {
                          newDate.setDate(newDate.getDate() - 7);
                        } else if (viewMode === 'month') {
                          newDate.setMonth(newDate.getMonth() - 1);
                        }
                        setCalendarDate(newDate);
                      }}
                    >
                      Previous
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCalendarDate(new Date())}
                    >
                      Today
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newDate = new Date(calendarDate);
                        if (viewMode === 'day') {
                          newDate.setDate(newDate.getDate() + 1);
                        } else if (viewMode === 'week') {
                          newDate.setDate(newDate.getDate() + 7);
                        } else if (viewMode === 'month') {
                          newDate.setMonth(newDate.getMonth() + 1);
                        }
                        setCalendarDate(newDate);
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Calendar
                  localizer={localizer}
                  events={allEvents}
                  startAccessor="start"
                  endAccessor="end"
                  selectable
                  resizable
                  style={{ 
                    height: "700px", 
                    margin: '0 auto',
                  }}
                  defaultView={viewMode}
                  view={viewMode as any}
                  onView={(view) => setViewMode(view)}
                  date={calendarDate}
                  onNavigate={(date) => setCalendarDate(date)}
                  eventPropGetter={eventStyleGetter}
                  onSelectEvent={handleSelectEvent}
                  onSelectSlot={handleSelectSlot}
                  onEventDrop={moveEvent}
                  onEventResize={resizeEvent}
                  dayLayoutAlgorithm="no-overlap"
                  components={{
                    event: (props) => {
                      // Use custom component if specified
                      if (props.event.component) {
                        const EventComponent = props.event.component;
                        return <EventComponent event={props.event} />;
                      }
                      
                      return (
                        <div>
                          <div>{props.title}</div>
                          {props.event.description && (
                            <div style={{ fontSize: '80%' }}>{props.event.description}</div>
                          )}
                        </div>
                      );
                    },
                  }}
                  popup
                  formats={{
                    dayHeaderFormat: (date) => moment(date).format('dddd, MMMM Do'),
                  }}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="col-span-12 md:col-span-3 space-y-4">
            <ProductivityInsights />
            
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Upcoming
                </CardTitle>
                <CardDescription>
                  Your schedule for today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {calendarEvents
                    .filter(event => {
                      const today = new Date();
                      const eventDate = new Date(event.start);
                      return (
                        eventDate.getDate() === today.getDate() &&
                        eventDate.getMonth() === today.getMonth() &&
                        eventDate.getFullYear() === today.getFullYear()
                      );
                    })
                    .sort((a, b) => a.start.getTime() - b.start.getTime())
                    .map(event => (
                      <div
                        key={event.id}
                        className="flex items-start p-2 rounded-md hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => handleSelectEvent(event)}
                      >
                        <div
                          className="w-2 h-2 mt-1.5 rounded-full mr-2"
                          style={{ backgroundColor: event.type === 'deep-work' ? '#4f46e5' : 
                                   event.type === 'meeting' ? '#0891b2' : 
                                   event.type === 'admin' ? '#6366f1' :
                                   event.type === 'learning' ? '#8b5cf6' :
                                   '#3182ce' }}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}
                          </p>
                        </div>
                        <button className="ml-2 text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    
                  {calendarEvents.filter(event => {
                    const today = new Date();
                    const eventDate = new Date(event.start);
                    return (
                      eventDate.getDate() === today.getDate() &&
                      eventDate.getMonth() === today.getMonth() &&
                      eventDate.getFullYear() === today.getFullYear()
                    );
                  }).length === 0 && (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      No events scheduled for today
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Event Modal */}
      {showEventModal && (
        <CalendarEventModal
          isOpen={showEventModal}
          onClose={() => {
            setShowEventModal(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
        />
      )}
      
      {/* Smart Scheduler */}
      <SmartScheduler
        isOpen={showSmartScheduler}
        onClose={() => setShowSmartScheduler(false)}
      />
    </div>
  );
} 