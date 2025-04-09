import React, { useState, useEffect } from 'react';
import { useUserStore } from '../../stores/userStore';
import { Search, Bell, Settings, Menu, ChevronDown, Maximize, Minimize, StickyNote, Plus, Trash2, Edit2 } from 'lucide-react';
import { getAvatar } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { UserMenu } from './UserMenu';

// Type for sticky notes
interface StickyNote {
  id: string;
  content: string;
  timestamp: number; // Unix timestamp
  color: string;
}

interface HeaderProps {
  className?: string;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export function Header({ className, onToggleSidebar, isSidebarCollapsed }: HeaderProps) {
  const { user } = useUserStore();
  const navigate = useNavigate();
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
  
  return (
    <header className={cn(
      "h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center pl-4 pr-6",
      "sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="flex items-center w-full max-w-full justify-between overflow-hidden">
        <div className="flex items-center">
          {/* Mobile menu button - visible on mobile */}
          {onToggleSidebar && (
            <button 
              onClick={onToggleSidebar}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 mr-2 md:mr-4 md:hidden"
              aria-label="Toggle sidebar"
            >
              <Menu size={20} />
            </button>
          )}
          
          {/* Desktop menu button - hidden on mobile */}
          {onToggleSidebar && (
            <button 
              onClick={onToggleSidebar}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 mr-4 hidden md:flex"
              aria-label="Toggle sidebar"
            >
              <Menu size={20} />
            </button>
          )}
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="search"
              placeholder="Search..."
              className="py-2 pl-10 pr-4 w-40 md:w-64 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-4">
          <button 
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setShowNotes(!showNotes)}
            title="Sticky Notes"
          >
            <StickyNote size={20} />
          </button>
          
          <button 
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>

          <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 relative">
            <Bell size={20} />
            <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
          </button>
          
          {/* Add debugging info */}
          <div className="ml-2">
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Sticky Notes Panel */}
      {showNotes && (
        <div className="fixed right-0 top-16 w-80 h-[calc(100vh-64px)] bg-white border-l shadow-lg z-50 overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-medium">Sticky Notes</h3>
            <button 
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
              onClick={() => setShowNotes(false)}
            >
              <Minimize className="h-4 w-4" />
            </button>
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
              <button 
                className="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors"
                onClick={addNote}
              >
                {editingId !== null ? 'Update Note' : 'Add Note'}
              </button>
              {editingId !== null && (
                <button
                  className="py-2 px-4 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setCurrentNote('');
                    setEditingId(null);
                    setNoteColor('#FFFDD0');
                  }}
                >
                  Cancel
                </button>
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
                    <button 
                      className="p-1 text-gray-500 hover:text-blue-500"
                      onClick={() => editNote(note)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button 
                      className="p-1 text-gray-500 hover:text-red-500"
                      onClick={() => deleteNote(note.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </header>
  );
}