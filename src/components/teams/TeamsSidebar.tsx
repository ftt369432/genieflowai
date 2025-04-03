import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Hash, Lock, Circle, Settings, User, UserPlus, Users, Star, MessageSquare, Brain, Zap, FileText, BookOpen } from 'lucide-react';
import { Button } from '../ui/Button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';
import { Input } from '../ui/Input';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { Badge } from '../ui/Badge';

// Mock data for teams
interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: 'admin' | 'member' | 'guest';
  status: 'online' | 'offline' | 'away' | 'busy';
}

interface Page {
  id: string;
  name: string;
  isPrivate: boolean;
  unread: number;
  isStarred: boolean;
  description?: string;
  hasAI?: boolean;
  aiAssistant?: string;
}

interface Thread {
  id: string;
  title: string;
  lastActivity: string;
  participants: number;
  unread: number;
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
  directMessages: DirectMessage[];
}

// Mock data
const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: 'GenieFlow HQ',
    avatar: '/logos/logo-icon.png',
    pages: [
      { id: 'page-1', name: 'general-discussion', isPrivate: false, unread: 0, isStarred: true, description: 'Company-wide discussions and announcements', hasAI: true, aiAssistant: 'Genie Helper' },
      { id: 'page-2', name: 'random-thoughts', isPrivate: false, unread: 3, isStarred: false, description: 'Non-work banter and water cooler conversation' },
      { id: 'page-3', name: 'product-roadmap', isPrivate: false, unread: 0, isStarred: true, description: 'Product development updates and roadmap', hasAI: true, aiAssistant: 'Product Manager AI' },
      { id: 'page-4', name: 'engineering-hub', isPrivate: false, unread: 12, isStarred: false, description: 'Engineering team discussions and tech updates', hasAI: true, aiAssistant: 'Code Assistant' },
      { id: 'page-5', name: 'marketing-campaigns', isPrivate: false, unread: 0, isStarred: false, description: 'Marketing team discussions and campaign planning' },
      { id: 'page-6', name: 'release-planning', isPrivate: true, unread: 5, isStarred: false, description: 'Product release planning and coordination' },
    ],
    threads: [
      { id: 'thread-1', title: 'Q2 Objectives Discussion', lastActivity: '2 hours ago', participants: 8, unread: 3 },
      { id: 'thread-2', title: 'New Feature Brainstorming', lastActivity: 'Yesterday', participants: 5, unread: 0 },
      { id: 'thread-3', title: 'Customer Feedback Review', lastActivity: '3 days ago', participants: 4, unread: 0 },
    ],
    members: [
      { id: 'user-1', name: 'Alex Johnson', avatar: '/avatars/user1.png', role: 'admin', status: 'online' },
      { id: 'user-2', name: 'Taylor Smith', avatar: '/avatars/user2.png', role: 'member', status: 'offline' },
      { id: 'user-3', name: 'Jordan Lee', avatar: '/avatars/user3.png', role: 'member', status: 'away' },
      { id: 'user-4', name: 'Morgan Brown', avatar: '/avatars/user4.png', role: 'member', status: 'busy' },
      { id: 'user-5', name: 'Casey Davis', avatar: '/avatars/user5.png', role: 'guest', status: 'online' },
      { id: 'ai-expert', name: 'Genie Expert', avatar: '/avatars/ai-expert.png', role: 'guest', status: 'online' },
    ],
    directMessages: [
      { id: 'dm-1', userId: 'user-1', name: 'Alex Johnson', avatar: '/avatars/user1.png', unread: 0, status: 'online', lastMessage: 'See you at the meeting', lastMessageTime: '10:30 AM' },
      { id: 'dm-2', userId: 'user-2', name: 'Taylor Smith', avatar: '/avatars/user2.png', unread: 2, status: 'offline', lastMessage: 'Could you review the doc?', lastMessageTime: 'Yesterday' },
      { id: 'dm-3', userId: 'user-3', name: 'Jordan Lee', avatar: '/avatars/user3.png', unread: 0, status: 'away', lastMessage: 'Thanks for your help!', lastMessageTime: 'Yesterday' },
      { id: 'dm-ai', userId: 'ai-expert', name: 'Genie Expert', avatar: '/avatars/ai-expert.png', unread: 0, status: 'online', lastMessage: 'I\'m here to help with any questions!', lastMessageTime: 'Just now' },
    ]
  },
  {
    id: 'team-2',
    name: 'Client Project X',
    avatar: '/logos/client-x.png',
    pages: [
      { id: 'page-7', name: 'project-updates', isPrivate: false, unread: 7, isStarred: true, description: 'Updates on Project X progress', hasAI: true, aiAssistant: 'Project Tracker' },
      { id: 'page-8', name: 'requirements-doc', isPrivate: false, unread: 0, isStarred: false, description: 'Requirements documentation and discussion' },
      { id: 'page-9', name: 'design-showcase', isPrivate: false, unread: 0, isStarred: false, description: 'Design discussions and resources' },
      { id: 'page-10', name: 'client-communication', isPrivate: true, unread: 3, isStarred: true, description: 'Client communication archives' },
    ],
    threads: [
      { id: 'thread-4', title: 'Design Review Meeting Notes', lastActivity: 'Today', participants: 6, unread: 2 },
      { id: 'thread-5', title: 'Backend Architecture Discussion', lastActivity: '2 days ago', participants: 3, unread: 0 },
    ],
    members: [
      { id: 'user-1', name: 'Alex Johnson', avatar: '/avatars/user1.png', role: 'admin', status: 'online' },
      { id: 'user-4', name: 'Morgan Brown', avatar: '/avatars/user4.png', role: 'member', status: 'busy' },
      { id: 'user-6', name: 'Jamie Wilson', avatar: '/avatars/user6.png', role: 'member', status: 'online' },
      { id: 'user-7', name: 'Client Rep', avatar: '/avatars/client.png', role: 'guest', status: 'offline' },
    ],
    directMessages: [
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
  const [activeTeam, setActiveTeam] = useState<Team>(mockTeams[0]);
  const [expandedSections, setExpandedSections] = useState({
    pages: true,
    threads: true,
    directMessages: true,
    members: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  const handleTeamChange = (teamId: string) => {
    const team = mockTeams.find(t => t.id === teamId);
    if (team) {
      setActiveTeam(team);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 border-r dark:bg-gray-900 dark:border-gray-800">
      {/* Team Selector */}
      <div className="p-2 border-b dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={activeTeam.avatar || '/logos/logo-icon.png'} alt={activeTeam.name} />
              <AvatarFallback>{activeTeam.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <span className="font-semibold text-sm">{activeTeam.name}</span>
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <ChevronDown size={16} />
          </Button>
        </div>
        
        {/* Team dropdown would go here */}
      </div>
      
      {/* Search */}
      <div className="px-2 py-2">
        <Input 
          placeholder="Search workspaces and people" 
          className="h-8 text-xs"
        />
      </div>

      {/* Pages */}
      <div className="flex-1 overflow-y-auto p-1">
        <div className="mb-3">
          <div 
            className="flex items-center px-2 py-1 text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
            onClick={() => toggleSection('pages')}
          >
            {expandedSections.pages ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span className="ml-1">Pages</span>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 ml-auto">
              <Plus size={14} />
            </Button>
          </div>
          
          {expandedSections.pages && (
            <div className="mt-1 space-y-0.5">
              {activeTeam.pages.map(page => (
                <div 
                  key={page.id}
                  className={`flex items-center px-3 py-1 rounded-md cursor-pointer text-xs ${
                    page.unread > 0 ? 'font-semibold' : ''
                  } hover:bg-gray-200 dark:hover:bg-gray-800`}
                >
                  {page.isPrivate ? <Lock size={12} className="mr-1 text-gray-400" /> : <FileText size={12} className="mr-1 text-gray-400" />}
                  <span>{page.name}</span>
                  {page.hasAI && <Brain size={12} className="ml-1 text-purple-400" />}
                  {page.isStarred && <Star size={12} className="ml-1 text-yellow-400 fill-yellow-400" />}
                  {page.unread > 0 && (
                    <Badge variant="default" className="ml-auto py-0 h-4 min-w-4 text-[10px]">
                      {page.unread}
                    </Badge>
                  )}
                </div>
              ))}
              
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mt-1">
                <Plus size={12} className="mr-1" />
                Add page
              </Button>
            </div>
          )}
        </div>

        {/* Threads */}
        <div className="mb-3">
          <div 
            className="flex items-center px-2 py-1 text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
            onClick={() => toggleSection('threads')}
          >
            {expandedSections.threads ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span className="ml-1">Threads</span>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 ml-auto">
              <Plus size={14} />
            </Button>
          </div>
          
          {expandedSections.threads && (
            <div className="mt-1 space-y-0.5">
              {activeTeam.threads.map(thread => (
                <div 
                  key={thread.id}
                  className={`flex items-center px-3 py-1 rounded-md cursor-pointer text-xs ${
                    thread.unread > 0 ? 'font-semibold' : ''
                  } hover:bg-gray-200 dark:hover:bg-gray-800`}
                >
                  <MessageSquare size={12} className="mr-1 text-gray-400" />
                  <div className="flex-1 overflow-hidden">
                    <div className="truncate">{thread.title}</div>
                    <div className="flex text-[10px] text-gray-500">
                      <span>{thread.lastActivity}</span>
                      <span className="mx-1">•</span>
                      <span>{thread.participants} participants</span>
                    </div>
                  </div>
                  {thread.unread > 0 && (
                    <Badge variant="default" className="ml-2 py-0 h-4 min-w-4 text-[10px]">
                      {thread.unread}
                    </Badge>
                  )}
                </div>
              ))}
              
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mt-1">
                <Plus size={12} className="mr-1" />
                New thread
              </Button>
            </div>
          )}
        </div>

        {/* Direct Messages */}
        <div className="mb-3">
          <div 
            className="flex items-center px-2 py-1 text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
            onClick={() => toggleSection('directMessages')}
          >
            {expandedSections.directMessages ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span className="ml-1">Direct Messages</span>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 ml-auto">
              <Plus size={14} />
            </Button>
          </div>
          
          {expandedSections.directMessages && (
            <div className="mt-1 space-y-0.5">
              {activeTeam.directMessages.map(dm => (
                <div 
                  key={dm.id}
                  className={`flex items-center px-3 py-1 rounded-md cursor-pointer text-xs ${
                    dm.unread > 0 ? 'font-semibold' : ''
                  } hover:bg-gray-200 dark:hover:bg-gray-800`}
                >
                  <div className="relative mr-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={dm.avatar} alt={dm.name} />
                      <AvatarFallback>{dm.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ${getStatusColor(dm.status)} ring-1 ring-white`}></span>
                  </div>
                  <span>{dm.name}</span>
                  {dm.unread > 0 && (
                    <Badge variant="default" className="ml-auto py-0 h-4 min-w-4 text-[10px]">
                      {dm.unread}
                    </Badge>
                  )}
                </div>
              ))}
              
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mt-1">
                <Plus size={12} className="mr-1" />
                Add conversation
              </Button>
            </div>
          )}
        </div>

        {/* Team Members */}
        <div className="mb-3">
          <div 
            className="flex items-center px-2 py-1 text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
            onClick={() => toggleSection('members')}
          >
            {expandedSections.members ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span className="ml-1">Team Members</span>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 ml-auto">
              <UserPlus size={14} />
            </Button>
          </div>
          
          {expandedSections.members && (
            <div className="mt-1 space-y-0.5">
              {activeTeam.members.map(member => (
                <div 
                  key={member.id}
                  className="flex items-center px-3 py-1 rounded-md cursor-pointer text-xs hover:bg-gray-200 dark:hover:bg-gray-800"
                >
                  <div className="relative mr-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ${getStatusColor(member.status)} ring-1 ring-white`}></span>
                  </div>
                  <span>{member.name}</span>
                  {member.role === 'admin' && (
                    <Badge variant="outline" className="ml-2 py-0 h-4 text-[10px]">
                      Admin
                    </Badge>
                  )}
                  {member.id === 'ai-expert' && (
                    <Badge variant="outline" className="ml-2 py-0 h-4 text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                      <Brain className="h-2 w-2 mr-1" /> AI
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom actions */}
      <div className="p-2 border-t dark:border-gray-800">
        <div className="flex justify-between">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Settings size={16} />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <User size={16} />
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Zap size={16} className="text-purple-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>AI Assist</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}; 