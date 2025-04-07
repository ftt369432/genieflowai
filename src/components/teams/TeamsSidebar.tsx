import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Hash, Lock, Circle, Settings, User, UserPlus, Users, Star, MessageSquare, Brain, Zap, FileText, BookOpen, Eye, EyeOff, KeyRound, Mail } from 'lucide-react';
import { Button } from '../ui/Button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';
import { Input } from '../ui/Input';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/Dialog';
import { useTeam } from '../../contexts/TeamContext';
import { toast } from 'sonner';

// Mock data for teams
interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: 'admin' | 'member' | 'guest';
  status: 'online' | 'offline' | 'away' | 'busy';
}

interface Thread {
  id: string;
  page_id: string; // ID of the parent page
  title: string;
  lastActivity: string;
  participants: number;
  unread: number;
}

interface Page {
  id: string;
  name: string;
  isPrivate: boolean;
  passcode?: string; // Added passcode for private pages
  unread: number;
  isStarred: boolean;
  description?: string;
  hasAI?: boolean;
  aiAssistant?: string;
  expanded?: boolean; // To track if page threads are expanded
}

interface DirectMessage {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  unread: number;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastMessage?: string;
  lastMessageTime?: string;
}

interface Team {
  id: string;
  name: string;
  avatar: string;
  pages: Page[];
  threads: Thread[];
  members: TeamMember[];
  direct_messages: DirectMessage[];
}

// Mock data
const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Product Team',
    avatar: '/logos/product-team.png',
    description: 'Core product development team',
    pages: [
      { 
        id: 'page-1', 
        name: 'general', 
        description: 'General discussions',
        isPrivate: false, 
        unread: 0, 
        isStarred: false,
        expanded: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      },
      { 
        id: 'page-2', 
        name: 'roadmap', 
        description: 'Product roadmap',
        isPrivate: false, 
        unread: 2, 
        isStarred: true,
        expanded: false,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      },
      { 
        id: 'page-3', 
        name: 'research', 
        description: 'User research findings',
        isPrivate: true, 
        passcode: '1234',
        unread: 0, 
        isStarred: false,
        expanded: false,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }
    ],
    threads: [
      { 
        id: 'thread-1', 
        page_id: 'page-1', 
        title: 'Q2 Objectives Discussion', 
        lastActivity: '2 hours ago', 
        participants: 8, 
        unread: 3,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      },
      { 
        id: 'thread-2', 
        page_id: 'page-1', 
        title: 'New Feature Brainstorming', 
        lastActivity: 'Yesterday', 
        participants: 5, 
        unread: 0,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }
    ],
    members: [
      { 
        id: 'user-1', 
        name: 'Alex Johnson', 
        avatar: '/avatars/user1.png', 
        role: 'admin', 
        status: 'online',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      },
      { 
        id: 'user-2', 
        name: 'Taylor Smith', 
        avatar: '/avatars/user2.png', 
        role: 'member', 
        status: 'offline',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }
    ],
    direct_messages: [
      { 
        id: 'dm-1', 
        userId: 'user-1', 
        name: 'Alex Johnson', 
        avatar: '/avatars/user1.png', 
        unread: 0, 
        status: 'online', 
        lastMessage: 'See you at the meeting', 
        lastMessageTime: '10:30 AM'
      }
    ],
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: 'team-2',
    name: 'Client Project X',
    avatar: '/logos/client-x.png',
    pages: [
      { id: 'page-7', name: 'project-updates', isPrivate: false, unread: 7, isStarred: true, description: 'Updates on Project X progress', hasAI: true, aiAssistant: 'Project Tracker', expanded: false },
      { id: 'page-8', name: 'requirements-doc', isPrivate: false, unread: 0, isStarred: false, description: 'Requirements documentation and discussion', expanded: false },
      { id: 'page-9', name: 'design-showcase', isPrivate: false, unread: 0, isStarred: false, description: 'Design discussions and resources', expanded: false },
      { id: 'page-10', name: 'client-communication', isPrivate: true, passcode: '5678', unread: 3, isStarred: true, description: 'Client communication archives', expanded: false },
    ],
    threads: [
      { id: 'thread-5', page_id: 'page-7', title: 'Design Review Meeting Notes', lastActivity: 'Today', participants: 6, unread: 2 },
      { id: 'thread-6', page_id: 'page-8', title: 'Backend Architecture Discussion', lastActivity: '2 days ago', participants: 3, unread: 0 },
    ],
    members: [
      { id: 'user-1', name: 'Alex Johnson', avatar: '/avatars/user1.png', role: 'admin', status: 'online' },
      { id: 'user-4', name: 'Morgan Brown', avatar: '/avatars/user4.png', role: 'member', status: 'busy' },
      { id: 'user-6', name: 'Jamie Wilson', avatar: '/avatars/user6.png', role: 'member', status: 'online' },
      { id: 'user-7', name: 'Client Rep', avatar: '/avatars/client.png', role: 'guest', status: 'offline' },
    ],
    direct_messages: [
      { id: 'dm-4', userId: 'user-6', name: 'Jamie Wilson', avatar: '/avatars/user6.png', unread: 5, status: 'online', lastMessage: 'Did you finish that feature?', lastMessageTime: '2:45 PM' },
      { id: 'dm-5', userId: 'user-7', name: 'Client Rep', avatar: '/avatars/client.png', unread: 0, status: 'offline', lastMessage: 'Looking forward to the demo', lastMessageTime: 'Monday' },
    ]
  }
];

const getStatusColor = (status: 'online' | 'offline' | 'away' | 'busy') => {
  switch (status) {
    case 'online': return 'bg-green-500';
    case 'offline': return 'bg-gray-400';
    case 'away': return 'bg-yellow-500';
    case 'busy': return 'bg-red-500';
    default: return 'bg-gray-400';
  }
};

export const TeamsSidebar: React.FC = () => {
  const { 
    teams, 
    activeTeam, 
    setActiveTeam,
    createPage,
    updatePage,
    deletePage,
    createThread,
    sendDirectMessage
  } = useTeam();

  const [expandedSections, setExpandedSections] = useState({
    pages: true,
    directMessages: true,
    members: false,
  });
  const [passcodeDialogOpen, setPasscodeDialogOpen] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [currentPrivatePage, setCurrentPrivatePage] = useState<Page | null>(null);
  const [createPageDialogOpen, setCreatePageDialogOpen] = useState(false);
  const [newPageData, setNewPageData] = useState({
    name: '',
    isPrivate: false,
    passcode: '',
    description: ''
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  const handleTeamChange = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (team) {
      setActiveTeam(team);
    }
  };

  const togglePageThreads = (pageId: string) => {
    if (!activeTeam) return;
    setActiveTeam({
      ...activeTeam,
      pages: activeTeam.pages.map(page => 
        page.id === pageId 
          ? { ...page, expanded: !page.expanded } 
          : page
      )
    });
  };

  const handlePageClick = async (page: Page) => {
    if (page.isPrivate) {
      setCurrentPrivatePage(page);
      setPasscodeDialogOpen(true);
      setPasscodeInput('');
    } else {
      // Navigate to the page (in a real app)
      console.log('Navigating to page:', page.name);
    }
  };

  const handlePasscodeSubmit = () => {
    if (currentPrivatePage && passcodeInput === currentPrivatePage.passcode) {
      // Successful access - navigate to the page
      console.log('Access granted to private page:', currentPrivatePage.name);
      setPasscodeDialogOpen(false);
    } else {
      // Failed access
      toast.error('Incorrect passcode');
    }
  };

  const handleCreatePage = async () => {
    if (!activeTeam) return;
    try {
      const newPage = await createPage(activeTeam.id, {
        name: newPageData.name.toLowerCase().replace(/\s+/g, '-'),
        isPrivate: newPageData.isPrivate,
        passcode: newPageData.isPrivate ? newPageData.passcode : undefined,
        description: newPageData.description,
        unread: 0,
        isStarred: false
      });

      setCreatePageDialogOpen(false);
      setNewPageData({
        name: '',
        isPrivate: false,
        passcode: '',
        description: ''
      });
      toast.success('Page created successfully!');
    } catch (error) {
      toast.error('Failed to create page');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 border-r dark:bg-gray-900 dark:border-gray-800 w-56">
      {/* Team Selector */}
      <div className="p-1.5 border-b dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Avatar className="h-5 w-5">
              <AvatarImage src={activeTeam?.avatar || '/logos/logo-icon.png'} alt={activeTeam?.name || 'Team'} />
              <AvatarFallback>{activeTeam?.name?.substring(0, 2) || 'T'}</AvatarFallback>
            </Avatar>
            <span className="font-semibold text-xs">{activeTeam?.name || 'Select Team'}</span>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <ChevronDown size={14} />
          </Button>
        </div>
      </div>
      
      {/* Search */}
      <div className="px-1.5 py-1.5">
        <Input 
          placeholder="Search" 
          className="h-6 text-xs"
        />
      </div>

      {/* Main sidebar content with scrolling */}
      <div className="flex-1 overflow-y-auto space-y-2 p-1.5">
        {/* Pages section */}
        <div>
          <div 
            className="flex items-center px-1 py-0.5 text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
            onClick={() => toggleSection('pages')}
          >
            {expandedSections.pages ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <span className="ml-1">Pages</span>
            <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-auto" onClick={() => setCreatePageDialogOpen(true)}>
              <Plus size={12} />
            </Button>
          </div>
          
          {expandedSections.pages && activeTeam && (
            <div className="space-y-0.5">
              {activeTeam.pages.map(page => (
                <div key={page.id}>
                  <div 
                    className="flex items-center px-2 py-0.5 rounded-md cursor-pointer text-xs hover:bg-gray-200 dark:hover:bg-gray-800"
                    onClick={() => handlePageClick(page)}
                  >
                    {page.isPrivate ? (
                      <Lock className="h-3 w-3 mr-1 text-gray-400" />
                    ) : (
                      <Hash className="h-3 w-3 mr-1 text-gray-400" />
                    )}
                    <span className="truncate">{page.name}</span>
                    {page.unread > 0 && (
                      <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700 text-[8px] px-1 py-0">
                        {page.unread}
                      </Badge>
                    )}
                    {page.isStarred && (
                      <Star className="h-3 w-3 ml-1 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  
                  {page.expanded && page.threads && (
                    <div className="ml-4 space-y-0.5">
                      {activeTeam.threads
                        .filter(thread => thread.page_id === page.id)
                        .map(thread => (
                          <div 
                            key={thread.id}
                            className="flex items-center px-2 py-0.5 rounded-md cursor-pointer text-xs hover:bg-gray-200 dark:hover:bg-gray-800"
                          >
                            <MessageSquare className="h-3 w-3 mr-1 text-gray-400" />
                            <span className="truncate">{thread.title}</span>
                            {thread.unread > 0 && (
                              <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700 text-[8px] px-1 py-0">
                                {thread.unread}
                              </Badge>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Direct Messages section */}
        <div>
          <div 
            className="flex items-center px-1 py-0.5 text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
            onClick={() => toggleSection('directMessages')}
          >
            {expandedSections.directMessages ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <span className="ml-1">Direct Messages</span>
          </div>
          
          {expandedSections.directMessages && activeTeam && (
            <div className="space-y-0.5">
              {activeTeam.direct_messages.map((dm: DirectMessage) => (
                <div 
                  key={dm.id}
                  className="flex items-center px-2 py-0.5 rounded-md cursor-pointer text-xs hover:bg-gray-200 dark:hover:bg-gray-800"
                >
                  <div className="relative mr-1 flex-shrink-0">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={dm.avatar} alt={dm.name} />
                      <AvatarFallback>{dm.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className={`absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full ${getStatusColor(dm.status)} ring-[0.5px] ring-white`}></span>
                  </div>
                  <span className="truncate">{dm.name}</span>
                  {dm.unread > 0 && (
                    <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700 text-[8px] px-1 py-0">
                      {dm.unread}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team Members section */}
        <div>
          <div 
            className="flex items-center px-1 py-0.5 text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
            onClick={() => toggleSection('members')}
          >
            {expandedSections.members ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <span className="ml-1">Team Members</span>
            <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-auto">
              <UserPlus size={12} />
            </Button>
          </div>
          
          {expandedSections.members && activeTeam && (
            <div className="space-y-0">
              {activeTeam.members.map(member => (
                <div 
                  key={member.id}
                  className="flex items-center px-2 py-0.5 rounded-md cursor-pointer text-xs hover:bg-gray-200 dark:hover:bg-gray-800"
                >
                  <div className="relative mr-1 flex-shrink-0">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className={`absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full ${getStatusColor(member.status)} ring-[0.5px] ring-white`}></span>
                  </div>
                  <span className="truncate">{member.name}</span>
                  {member.role === 'admin' && (
                    <Badge variant="outline" className="ml-1 py-0 h-3 text-[8px] border-[0.5px] flex-shrink-0">
                      Admin
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom actions */}
      <div className="p-1.5 border-t dark:border-gray-800 space-y-1">
        <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
          <Settings className="h-3 w-3 mr-1" />
          Settings
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
          <Mail className="h-3 w-3 mr-1" />
          Connect Email
        </Button>
      </div>

      {/* Create Page Dialog */}
      <Dialog open={createPageDialogOpen} onOpenChange={setCreatePageDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Page</DialogTitle>
            <DialogDescription>
              Add a new page to this team workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-medium">Page Name</label>
              <Input 
                placeholder="Enter page name" 
                value={newPageData.name} 
                onChange={(e) => setNewPageData({...newPageData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Description</label>
              <Input 
                placeholder="Enter page description" 
                value={newPageData.description} 
                onChange={(e) => setNewPageData({...newPageData, description: e.target.value})}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="isPrivate" 
                checked={newPageData.isPrivate}
                onChange={(e) => setNewPageData({...newPageData, isPrivate: e.target.checked})}
                className="rounded border-gray-300"
              />
              <label htmlFor="isPrivate" className="text-sm flex items-center">
                <Lock className="h-3 w-3 mr-1" />
                Private Page
              </label>
            </div>
            {newPageData.isPrivate && (
              <div className="space-y-2">
                <label className="text-xs font-medium">Passcode</label>
                <Input 
                  type="password"
                  placeholder="Enter passcode" 
                  value={newPageData.passcode} 
                  onChange={(e) => setNewPageData({...newPageData, passcode: e.target.value})}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatePageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePage}>
              Create Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Passcode Dialog */}
      <Dialog open={passcodeDialogOpen} onOpenChange={setPasscodeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enter Passcode</DialogTitle>
            <DialogDescription>
              This page is private. Please enter the passcode to access it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input 
              type="password"
              placeholder="Enter passcode" 
              value={passcodeInput} 
              onChange={(e) => setPasscodeInput(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasscodeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasscodeSubmit}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 