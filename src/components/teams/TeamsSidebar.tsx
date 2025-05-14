import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Hash, Lock, UserPlus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';
import { Input } from '../ui/Input';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/Dialog';
import { useTeam } from '../../contexts/TeamContext';
import { toast } from 'sonner';
import type { Page, TeamMember, DirectMessage } from '../../types/team';

const getStatusColor = (status: TeamMember['status']) => {
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
    activePage,
    setActivePage,
    createPage,
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

  const handlePageClick = async (page: Page) => {
    console.log('TeamsSidebar: handlePageClick for page:', JSON.stringify(page));
    if (page.isPrivate && page.passcode) {
      if (activePage?.id === page.id) {
        console.log('TeamsSidebar: Page already active/unlocked:', page.name);
        setActivePage(page);
        return;
      }
      setCurrentPrivatePage(page);
      setPasscodeDialogOpen(true);
      setPasscodeInput('');
    } else {
      console.log('TeamsSidebar: Navigating to public page:', page.name);
      setActivePage(page);
    }
  };

  const handlePasscodeSubmit = () => {
    if (currentPrivatePage && passcodeInput === currentPrivatePage.passcode) {
      console.log('TeamsSidebar: Access granted to private page:', currentPrivatePage.name);
      setPasscodeDialogOpen(false);
      setActivePage(currentPrivatePage);
      setCurrentPrivatePage(null);
    } else {
      toast.error('Incorrect passcode');
    }
  };

  const handleCreatePage = async () => {
    if (!activeTeam) return;
    try {
      const newPageDetails = {
        name: newPageData.name.toLowerCase().replace(/\s+/g, '-'),
        isPrivate: newPageData.isPrivate,
        passcode: newPageData.isPrivate ? newPageData.passcode : undefined,
        description: newPageData.description,
      };
      
      await createPage(activeTeam.id, newPageDetails);

      setCreatePageDialogOpen(false);
      setNewPageData({
        name: '',
        isPrivate: false,
        passcode: '',
        description: ''
      });
      toast.success('Page created successfully!');
    } catch (error) {
      toast.error(`Failed to create page: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  if (!activeTeam) {
    return (
      <div className="p-4 text-sm text-gray-500">
        Select a team to see its pages and members, or create a new one.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-800 text-white w-64">
      {/* Team Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">{activeTeam.name}</h2>
        <p className="text-xs text-gray-400">{activeTeam.description}</p>
        <select 
          value={activeTeam.id} 
          onChange={(e) => handleTeamChange(e.target.value)} 
          className="w-full mt-2 p-1 bg-gray-700 rounded text-sm"
        >
          {teams.map(team => (
            <option key={team.id} value={team.id}>{team.name}</option>
          ))}
        </select>
      </div>

      {/* Pages Section */}
      <div className="p-2">
        <div className="flex justify-between items-center mb-1">
          <Button variant="ghost" size="sm" onClick={() => toggleSection('pages')} className="text-xs text-gray-400 hover:text-white">
            {expandedSections.pages ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span className="ml-1">Pages</span>
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setCreatePageDialogOpen(true)} className="text-gray-400 hover:text-white">
                  <Plus size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Create Page</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {expandedSections.pages && activeTeam.pages && (
          <ul className="space-y-1">
            {activeTeam.pages.map(page => (
              <li key={page.id}>
                <Button
                  variant={activePage?.id === page.id ? 'secondary' : 'ghost'}
                  size="sm"
                  className={`w-full justify-start text-sm ${activePage?.id === page.id ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700/50'}`}
                  onClick={() => handlePageClick(page)}
                >
                  {page.isPrivate ? <Lock size={14} className="mr-2" /> : <Hash size={14} className="mr-2" />}
                  {page.name}
                  {page.unread > 0 && <Badge variant="destructive" className="ml-auto">{page.unread}</Badge>}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Direct Messages Section */}
      <div className="p-2 mt-2">
        <div className="flex justify-between items-center mb-1">
          <Button variant="ghost" size="sm" onClick={() => toggleSection('directMessages')} className="text-xs text-gray-400 hover:text-white">
            {expandedSections.directMessages ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span className="ml-1">Direct Messages</span>
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" disabled>
                  <Plus size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Start new DM (Not implemented)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {expandedSections.directMessages && activeTeam.direct_messages && (
           <ul className="space-y-1">
            {activeTeam.direct_messages.map((dm: DirectMessage) => (
              <li key={dm.id}>
                <Button 
                  variant='ghost' 
                  size="sm" 
                  className="w-full justify-start text-sm text-gray-300 hover:bg-gray-700/50"
                  disabled
                >
                  <Avatar className="w-5 h-5 mr-2">
                    <AvatarImage src={dm.avatar} alt={dm.name} />
                    <AvatarFallback>{dm.name.substring(0,1)}</AvatarFallback>
                  </Avatar>
                  {dm.name}
                  {dm.unread > 0 && <Badge variant="destructive" className="ml-auto">{dm.unread}</Badge>}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Members Section */}
      <div className="p-2 mt-auto border-t border-gray-700">
        <div className="flex justify-between items-center mb-1">
          <Button variant="ghost" size="sm" onClick={() => toggleSection('members')} className="text-xs text-gray-400 hover:text-white">
            {expandedSections.members ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span className="ml-1">Members ({activeTeam.members?.length || 0})</span>
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" disabled>
                  <UserPlus size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Member (Not implemented)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {expandedSections.members && activeTeam.members && (
          <ul className="space-y-1 text-sm">
            {activeTeam.members.map((member: TeamMember) => (
              <li key={member.id} className="flex items-center p-1 rounded hover:bg-gray-700/50 cursor-pointer">
                <Avatar className="w-5 h-5 mr-2">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback>{member.name.substring(0,1)}</AvatarFallback>
                </Avatar>
                <span className="truncate">{member.name}</span>
                <span className={`ml-auto w-2 h-2 rounded-full ${getStatusColor(member.status)}`}></span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Create Page Dialog */}
      <Dialog open={createPageDialogOpen} onOpenChange={setCreatePageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Page</DialogTitle>
            <DialogDescription>Enter the details for your new page.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 pb-4">
            <Input 
              placeholder="Page Name (e.g. project-alpha)" 
              value={newPageData.name} 
              onChange={(e) => setNewPageData({...newPageData, name: e.target.value})} 
            />
            <Input 
              placeholder="Description (optional)" 
              value={newPageData.description} 
              onChange={(e) => setNewPageData({...newPageData, description: e.target.value})} 
            />
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="isPrivatePage" 
                checked={newPageData.isPrivate} 
                onChange={(e) => setNewPageData({...newPageData, isPrivate: e.target.checked})} 
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isPrivatePage" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Private Page
              </label>
            </div>
            {newPageData.isPrivate && (
              <Input 
                placeholder="Passcode (optional)" 
                value={newPageData.passcode} 
                onChange={(e) => setNewPageData({...newPageData, passcode: e.target.value})} 
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatePageDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePage}>Create Page</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Passcode Dialog */}
      <Dialog open={passcodeDialogOpen} onOpenChange={setPasscodeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Passcode for {currentPrivatePage?.name}</DialogTitle>
            <DialogDescription>This page is private. Please enter the passcode to access it.</DialogDescription>
          </DialogHeader>
          <Input 
            type="password" 
            placeholder="Passcode" 
            value={passcodeInput} 
            onChange={(e) => setPasscodeInput(e.target.value)} 
            className="my-4"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPasscodeDialogOpen(false); setCurrentPrivatePage(null); }}>Cancel</Button>
            <Button onClick={handlePasscodeSubmit}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};