import React, { useState, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  Plus, Search, Clock, Calendar, Users, CheckCircle, 
  AlertCircle, Activity, Settings, MoreHorizontal, 
  ChevronDown, Zap, Brain, FileText, MessageSquare, 
  BarChart2, Trash2, Edit2, KanbanSquare, Maximize, Minimize, StickyNote
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Separator } from '../components/ui/Separator';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../components/ui/DropdownMenu';

// Types for our project management system
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignees: TeamMember[];
  dueDate?: string;
  tags: string[];
  attachments?: number;
  comments?: number;
  createdAt: string;
  hasAIRecommendations?: boolean;
}

// Type for sticky notes
interface StickyNote {
  id: string;
  content: string;
  timestamp: number; // Unix timestamp
  color: string;
}

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: 'admin' | 'member' | 'viewer';
  status: 'online' | 'away' | 'offline';
}

interface Project {
  id: string;
  name: string;
  description: string;
  progress: number;
  teamMembers: TeamMember[];
  dueDate?: string;
  tasks: Task[];
  tags: string[];
  status: 'active' | 'completed' | 'on-hold' | 'archived';
  lastModified: string;
}

// Mock data for projects
const mockTeamMembers: TeamMember[] = [
  { id: 'tm1', name: 'Alex Johnson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', role: 'admin', status: 'online' },
  { id: 'tm2', name: 'Taylor Smith', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor', role: 'member', status: 'offline' },
  { id: 'tm3', name: 'Jordan Lee', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan', role: 'member', status: 'away' },
  { id: 'tm4', name: 'Morgan Brown', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Morgan', role: 'member', status: 'online' },
  { id: 'tm5', name: 'Casey Davis', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Casey', role: 'viewer', status: 'online' },
];

const mockProjects: Project[] = [
  {
    id: 'proj1',
    name: 'Website Redesign',
    description: 'Redesign the company website with improved UX and modern aesthetics',
    progress: 68,
    teamMembers: mockTeamMembers.slice(0, 4),
    dueDate: '2023-07-15',
    tasks: [
      {
        id: 'task1',
        title: 'Create wireframes for homepage',
        description: 'Design initial wireframes for the new homepage layout',
        status: 'done',
        priority: 'high',
        assignees: [mockTeamMembers[1]],
        tags: ['design', 'ux'],
        attachments: 3,
        comments: 5,
        createdAt: '2023-06-10',
      },
      {
        id: 'task2',
        title: 'Develop responsive navigation component',
        description: 'Create a responsive navigation menu that works well on all devices',
        status: 'in-progress',
        priority: 'medium',
        assignees: [mockTeamMembers[0], mockTeamMembers[2]],
        dueDate: '2023-06-25',
        tags: ['frontend', 'responsive'],
        attachments: 1,
        comments: 2,
        createdAt: '2023-06-12',
        hasAIRecommendations: true,
      },
      {
        id: 'task3',
        title: 'Optimize image loading performance',
        description: 'Implement lazy loading and optimize image assets to improve page speed',
        status: 'todo',
        priority: 'medium',
        assignees: [mockTeamMembers[2]],
        dueDate: '2023-06-30',
        tags: ['performance', 'frontend'],
        createdAt: '2023-06-14',
      },
      {
        id: 'task4',
        title: 'Integrate analytics tracking',
        description: 'Set up Google Analytics and custom event tracking',
        status: 'backlog',
        priority: 'low',
        assignees: [],
        tags: ['analytics'],
        createdAt: '2023-06-15',
      },
      {
        id: 'task5',
        title: 'Conduct user testing sessions',
        description: 'Organize and conduct user testing with 5-7 participants',
        status: 'todo',
        priority: 'high',
        assignees: [mockTeamMembers[4], mockTeamMembers[1]],
        dueDate: '2023-07-05',
        tags: ['research', 'testing'],
        comments: 1,
        createdAt: '2023-06-16',
      },
    ],
    tags: ['website', 'design', 'frontend'],
    status: 'active',
    lastModified: '2023-06-18',
  },
  {
    id: 'proj2',
    name: 'Mobile App Development',
    description: 'Develop a native mobile application for iOS and Android platforms',
    progress: 42,
    teamMembers: mockTeamMembers.slice(1, 5),
    dueDate: '2023-09-30',
    tasks: [
      {
        id: 'task6',
        title: 'Design app icon and splash screen',
        status: 'review',
        priority: 'medium',
        assignees: [mockTeamMembers[1]],
        tags: ['design', 'branding'],
        attachments: 5,
        comments: 3,
        createdAt: '2023-06-05',
      },
      {
        id: 'task7',
        title: 'Implement user authentication',
        description: 'Create secure authentication flow with social login options',
        status: 'in-progress',
        priority: 'high',
        assignees: [mockTeamMembers[2], mockTeamMembers[3]],
        dueDate: '2023-07-10',
        tags: ['security', 'backend'],
        comments: 4,
        createdAt: '2023-06-08',
      },
      {
        id: 'task8',
        title: 'Develop offline mode functionality',
        status: 'backlog',
        priority: 'medium',
        assignees: [],
        tags: ['feature'],
        createdAt: '2023-06-10',
        hasAIRecommendations: true,
      },
    ],
    tags: ['mobile', 'app', 'development'],
    status: 'active',
    lastModified: '2023-06-15',
  },
  {
    id: 'proj3',
    name: 'Marketing Campaign',
    description: 'Q3 Marketing Campaign for Product Launch',
    progress: 95,
    teamMembers: [mockTeamMembers[0], mockTeamMembers[4]],
    dueDate: '2023-06-30',
    tasks: [
      {
        id: 'task9',
        title: 'Create social media content calendar',
        status: 'done',
        priority: 'high',
        assignees: [mockTeamMembers[4]],
        tags: ['marketing', 'social'],
        attachments: 1,
        createdAt: '2023-05-20',
      },
      {
        id: 'task10',
        title: 'Design promotional banners',
        status: 'done',
        priority: 'medium',
        assignees: [mockTeamMembers[1]],
        tags: ['design', 'marketing'],
        attachments: 7,
        comments: 2,
        createdAt: '2023-05-25',
      },
      {
        id: 'task11',
        title: 'Prepare press release',
        status: 'review',
        priority: 'high',
        assignees: [mockTeamMembers[0]],
        dueDate: '2023-06-25',
        tags: ['marketing', 'pr'],
        comments: 3,
        createdAt: '2023-06-01',
      },
    ],
    tags: ['marketing', 'campaign', 'launch'],
    status: 'active',
    lastModified: '2023-06-10',
  },
];

// Status columns for the Kanban board
const statusColumns = [
  { id: 'backlog', title: 'Backlog', color: 'bg-gray-300', textColor: 'text-gray-700' },
  { id: 'todo', title: 'To Do', color: 'bg-blue-300', textColor: 'text-blue-700' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-yellow-300', textColor: 'text-yellow-700' },
  { id: 'review', title: 'Review', color: 'bg-purple-300', textColor: 'text-purple-700' },
  { id: 'done', title: 'Done', color: 'bg-green-300', textColor: 'text-green-700' },
];

// Priority badges
const priorityBadges = {
  low: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  medium: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  high: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  urgent: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
};

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [selectedProject, setSelectedProject] = useState<Project>(mockProjects[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('board');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteColor, setNoteColor] = useState('#FFFDD0'); // Default light yellow
  
  // Available note colors
  const noteColors = [
    '#FFFDD0', // Light Yellow
    '#FFCCCC', // Light Red
    '#CCFFCC', // Light Green
    '#CCE0FF', // Light Blue
    '#E6CCFF', // Light Purple
    '#FFE5CC', // Light Orange
  ];
  
  // Load notes from localStorage on initial render
  useEffect(() => {
    const savedNotes = localStorage.getItem('stickyNotes');
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error('Failed to parse saved notes', e);
      }
    }
  }, []);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('stickyNotes', JSON.stringify(notes));
  }, [notes]);

  // Function to toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch(err => {
          console.error(`Error attempting to exit fullscreen: ${err.message}`);
        });
      }
    }
  };

  // Check fullscreen status changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Add a note
  const addNote = () => {
    if (currentNote.trim()) {
      if (editingId !== null) {
        // Update existing note
        const updatedNotes = notes.map(note => 
          note.id === editingId ? { ...note, content: currentNote, color: noteColor } : note
        );
        setNotes(updatedNotes);
        setEditingId(null);
      } else {
        // Add new note
        const newNote: StickyNote = {
          id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          content: currentNote,
          timestamp: Date.now(),
          color: noteColor
        };
        setNotes([...notes, newNote]);
      }
      setCurrentNote('');
      setNoteColor('#FFFDD0'); // Reset to default color
    }
  };

  // Edit a note
  const editNote = (note: StickyNote) => {
    setCurrentNote(note.content);
    setEditingId(note.id);
    setNoteColor(note.color);
  };

  // Delete a note
  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
  };
  
  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }
    
    // Find the task that was dragged
    const task = selectedProject.tasks.find(t => t.id === draggableId);
    if (!task) return;
    
    // Create a new task with updated status
    const updatedTask = { ...task, status: destination.droppableId as Task['status'] };
    
    // Create a new array of tasks with the updated task
    const updatedTasks = selectedProject.tasks.map(t => 
      t.id === draggableId ? updatedTask : t
    );
    
    // Update the selected project with the new tasks array
    const updatedProject = { ...selectedProject, tasks: updatedTasks };
    setSelectedProject(updatedProject);
    
    // Update the projects array with the updated project
    const updatedProjects = projects.map(p => 
      p.id === selectedProject.id ? updatedProject : p
    );
    setProjects(updatedProjects);
  };
  
  const filterTasks = (tasks: Task[]) => {
    if (!searchQuery) return tasks;
    
    return tasks.filter(task => 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };
  
  const getTasksByStatus = (status: Task['status']) => {
    return filterTasks(selectedProject.tasks).filter(task => task.status === status);
  };
  
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Projects</h1>
            <div className="flex items-center">
              <Badge variant="outline" className="text-xs font-normal">
                {projects.length} Projects
              </Badge>
              <Separator orientation="vertical" className="h-4 mx-2" />
              <Badge variant="outline" className="text-xs font-normal bg-green-50 text-green-700">
                {projects.filter(p => p.status === 'active').length} Active
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search projects or tasks..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Project
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowNotes(!showNotes)} title="Sticky Notes">
              <StickyNote className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Sticky Notes Panel */}
      {showNotes && (
        <div className="fixed right-0 top-16 w-80 h-[calc(100vh-64px)] bg-white border-l shadow-lg z-50 overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-medium">Sticky Notes</h3>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowNotes(false)}>
              <Minimize className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-4 border-b">
            <textarea
              className="w-full p-2 border rounded-md text-sm min-h-24"
              placeholder="Type your note here..."
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              style={{ backgroundColor: noteColor }}
            />
            
            <div className="flex items-center gap-2 my-3">
              <span className="text-xs text-gray-500">Color:</span>
              {noteColors.map(color => (
                <button
                  key={color}
                  className={`w-6 h-6 rounded-full ${noteColor === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setNoteColor(color)}
                  aria-label={`Select ${color} color`}
                />
              ))}
            </div>
            
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={addNote}>
                {editingId !== null ? 'Update Note' : 'Add Note'}
              </Button>
              {editingId !== null && (
                <Button size="sm" variant="outline" onClick={() => {
                  setCurrentNote('');
                  setEditingId(null);
                  setNoteColor('#FFFDD0');
                }}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notes.length === 0 ? (
              <div className="text-center text-gray-500 text-sm p-4">
                No notes yet. Add your first note above.
              </div>
            ) : (
              notes.map(note => (
                <div 
                  key={note.id} 
                  className="p-3 rounded-md shadow-sm relative group border"
                  style={{ backgroundColor: note.color }}
                >
                  <p className="text-sm whitespace-pre-wrap mb-2">{note.content}</p>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDate(note.timestamp)}
                  </div>
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex bg-white bg-opacity-70 rounded">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={() => editNote(note)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={() => deleteNote(note.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Project sidebar */}
        <div className="w-72 border-r overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium">My Projects</h2>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {projects.map(project => (
              <div 
                key={project.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedProject.id === project.id 
                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent'
                }`}
                onClick={() => setSelectedProject(project)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">{project.name}</h3>
                  <Badge 
                    variant="outline" 
                    className={`px-2 py-0 text-[10px] ${
                      project.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                      project.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      project.status === 'on-hold' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    {project.status}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {project.description}
                </p>
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex -space-x-2">
                    {project.teamMembers.slice(0, 3).map(member => (
                      <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    ))}
                    {project.teamMembers.length > 3 && (
                      <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs border-2 border-background">
                        +{project.teamMembers.length - 3}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{project.dueDate ? new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No deadline'}</span>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 h-1.5 rounded-full mt-3 dark:bg-gray-700">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full" 
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">{project.progress}% completed</span>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <FileText className="h-3 w-3 mr-1" />
                    <span>{project.tasks.length} tasks</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Project content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Project header */}
          <div className="border-b p-4 bg-white dark:bg-gray-950">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">{selectedProject.name}</h2>
                  <Badge 
                    variant="outline" 
                    className={`px-2 text-xs ${
                      selectedProject.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                      selectedProject.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      selectedProject.status === 'on-hold' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    {selectedProject.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedProject.description}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {selectedProject.teamMembers.map(member => (
                    <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  ))}
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 ml-1">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <Separator orientation="vertical" className="h-8" />
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Brain className="h-4 w-4 mr-1 text-purple-500" />
                    AI Insights
                  </Button>
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    Timeline
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />
                        Project Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Users className="h-4 w-4 mr-2" />
                        Manage Team
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Activity className="h-4 w-4 mr-2" />
                        Activity Log
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <BarChart2 className="h-4 w-4 mr-2" />
                        Analytics
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-500">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Archive Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="flex items-center mt-4">
              <div className="w-full bg-gray-200 h-2 rounded-full dark:bg-gray-700 mr-3 flex-1">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${selectedProject.progress}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium">{selectedProject.progress}%</span>
            </div>
          </div>
          
          {/* View selector tabs */}
          <div className="border-b px-4 bg-white dark:bg-gray-950">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-auto">
                <TabsTrigger value="board" className="text-sm">
                  <KanbanSquare className="h-4 w-4 mr-1" />
                  Board
                </TabsTrigger>
                <TabsTrigger value="list" className="text-sm">
                  <FileText className="h-4 w-4 mr-1" />
                  List
                </TabsTrigger>
                <TabsTrigger value="calendar" className="text-sm">
                  <Calendar className="h-4 w-4 mr-1" />
                  Calendar
                </TabsTrigger>
                <TabsTrigger value="analytics" className="text-sm">
                  <BarChart2 className="h-4 w-4 mr-1" />
                  Analytics
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Main content area */}
          <div className="flex-1 overflow-hidden p-4 bg-gray-50 dark:bg-gray-900">
            <Tabs value={activeTab}>
              <TabsContent value="board" className="h-full m-0">
                <DragDropContext onDragEnd={handleDragEnd}>
                  <div className="flex h-full gap-4 overflow-x-auto pb-4">
                    {statusColumns.map(column => (
                      <div key={column.id} className="flex-shrink-0 w-72">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`h-3 w-3 rounded-full ${column.color} mr-2`}></div>
                            <h3 className={`font-medium text-sm ${column.textColor}`}>
                              {column.title}
                            </h3>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {getTasksByStatus(column.id as any).length}
                            </span>
                          </div>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <Droppable droppableId={column.id}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="space-y-3 min-h-[50px]"
                            >
                              {getTasksByStatus(column.id as any).map((task, index) => (
                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className="bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                                    >
                                      <div className="flex items-center justify-between">
                                        <Badge 
                                          variant="outline" 
                                          className={`px-2 py-0 text-[10px] ${
                                            priorityBadges[task.priority].bg
                                          } ${
                                            priorityBadges[task.priority].text
                                          } ${
                                            priorityBadges[task.priority].border
                                          }`}
                                        >
                                          {task.priority}
                                        </Badge>
                                        
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                              <MoreHorizontal className="h-3 w-3" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem>
                                              <Edit2 className="h-4 w-4 mr-2" />
                                              Edit Task
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                              <MessageSquare className="h-4 w-4 mr-2" />
                                              Add Comment
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-red-500">
                                              <Trash2 className="h-4 w-4 mr-2" />
                                              Delete Task
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                      
                                      <h4 className="font-medium text-sm mt-2">{task.title}</h4>
                                      
                                      {task.description && (
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                          {task.description}
                                        </p>
                                      )}
                                      
                                      {/* Tags */}
                                      {task.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {task.tags.map(tag => (
                                            <Badge 
                                              key={tag} 
                                              variant="secondary" 
                                              className="px-1.5 py-0 text-[10px] bg-gray-100 text-gray-700"
                                            >
                                              {tag}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                      
                                      {/* AI indicator */}
                                      {task.hasAIRecommendations && (
                                        <div className="mt-2 flex items-center text-xs text-purple-600">
                                          <Brain className="h-3 w-3 mr-1" />
                                          <span>AI recommendations available</span>
                                        </div>
                                      )}
                                      
                                      {/* Footer */}
                                      <div className="flex items-center justify-between mt-3">
                                        <div className="flex -space-x-2">
                                          {task.assignees.slice(0, 2).map(assignee => (
                                            <Avatar key={assignee.id} className="h-5 w-5 border border-white">
                                              <AvatarImage src={assignee.avatar} alt={assignee.name} />
                                              <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                          ))}
                                          {task.assignees.length > 2 && (
                                            <div className="h-5 w-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] border border-white">
                                              +{task.assignees.length - 2}
                                            </div>
                                          )}
                                          {task.assignees.length === 0 && (
                                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 rounded-full border border-dashed">
                                              <Plus className="h-3 w-3" />
                                            </Button>
                                          )}
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                          {task.attachments && (
                                            <div className="flex items-center text-xs text-muted-foreground">
                                              <FileText className="h-3 w-3 mr-1" />
                                              <span>{task.attachments}</span>
                                            </div>
                                          )}
                                          
                                          {task.comments && (
                                            <div className="flex items-center text-xs text-muted-foreground">
                                              <MessageSquare className="h-3 w-3 mr-1" />
                                              <span>{task.comments}</span>
                                            </div>
                                          )}
                                          
                                          {task.dueDate && (
                                            <div className="flex items-center text-xs text-muted-foreground">
                                              <Clock className="h-3 w-3 mr-1" />
                                              <span>
                                                {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    ))}
                  </div>
                </DragDropContext>
              </TabsContent>
              
              <TabsContent value="list" className="h-full m-0">
                <div className="h-full bg-white dark:bg-gray-800 rounded-md border overflow-hidden">
                  <div className="p-4">
                    <h3 className="text-lg font-medium">Task List View</h3>
                    <p className="text-sm text-muted-foreground">Coming soon...</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="calendar" className="h-full m-0">
                <div className="h-full bg-white dark:bg-gray-800 rounded-md border overflow-hidden">
                  <div className="p-4">
                    <h3 className="text-lg font-medium">Calendar View</h3>
                    <p className="text-sm text-muted-foreground">Coming soon...</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="analytics" className="h-full m-0">
                <div className="h-full bg-white dark:bg-gray-800 rounded-md border overflow-hidden">
                  <div className="p-4">
                    <h3 className="text-lg font-medium">Analytics View</h3>
                    <p className="text-sm text-muted-foreground">Coming soon...</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}; 