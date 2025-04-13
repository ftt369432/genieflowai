import React, { useState } from 'react';
import { useTeam } from '../../contexts/TeamContext';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  Search, 
  Plus, 
  Users, 
  User as UserIcon,
  MessageCircle,
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/Collapsible';
import { Team, DirectMessage } from '../../types/team';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/Tooltip';
import { cn } from '../../lib/utils';

interface TeamsSidebarProps {
  onCreateTeam: () => void;
  onTeamSelect: (team: Team) => void;
  onDirectMessageSelect: (directMessage: DirectMessage) => void;
}

const TeamsSidebar: React.FC<TeamsSidebarProps> = ({
  onCreateTeam,
  onTeamSelect,
  onDirectMessageSelect,
}) => {
  const { user } = useAuth();
  const { teams, activeTeam } = useTeam();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    teams: true,
    directMessages: true,
  });

  const toggleSection = (section: 'teams' | 'directMessages') => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDirectMessages = activeTeam
    ? activeTeam.directMessages.filter((dm) =>
        dm.user.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <aside className="w-64 border-r bg-background flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.photoURL || undefined} />
            <AvatarFallback>
              {user?.displayName?.substring(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <h3 className="font-medium text-sm truncate">
              {user?.displayName || user?.email || 'User'}
            </h3>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <Collapsible
          open={expandedSections.teams}
          onOpenChange={() => toggleSection('teams')}
          className="mb-4"
        >
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between py-2 px-2 cursor-pointer hover:bg-accent/50 rounded-md">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium">Teams</span>
              </div>
              {expandedSections.teams ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-1 space-y-1">
              {filteredTeams.length > 0 ? (
                filteredTeams.map((team) => (
                  <div
                    key={team.id}
                    className={cn(
                      "flex items-center gap-2 py-2 px-2 rounded-md cursor-pointer",
                      activeTeam?.id === team.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-accent/50"
                    )}
                    onClick={() => onTeamSelect(team)}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={team.avatar} />
                      <AvatarFallback>
                        {team.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate">{team.name}</span>
                  </div>
                ))
              ) : (
                <div className="py-2 px-2 text-sm text-muted-foreground">
                  {searchQuery ? 'No teams found' : 'No teams yet'}
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start mt-1"
                onClick={onCreateTeam}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible
          open={expandedSections.directMessages}
          onOpenChange={() => toggleSection('directMessages')}
          className="mb-4"
          disabled={!activeTeam}
        >
          <CollapsibleTrigger asChild>
            <div 
              className={cn(
                "flex items-center justify-between py-2 px-2 rounded-md",
                activeTeam 
                  ? "cursor-pointer hover:bg-accent/50" 
                  : "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center">
                <MessageCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium">Direct Messages</span>
              </div>
              {activeTeam && (
                expandedSections.directMessages ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )
              )}
            </div>
          </CollapsibleTrigger>
          {activeTeam && (
            <CollapsibleContent>
              <div className="mt-1 space-y-1">
                {filteredDirectMessages.length > 0 ? (
                  filteredDirectMessages.map((dm) => (
                    <div
                      key={dm.id}
                      className="flex items-center gap-2 py-2 px-2 rounded-md cursor-pointer hover:bg-accent/50"
                      onClick={() => onDirectMessageSelect(dm)}
                    >
                      <div className="relative">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={dm.user.avatar} />
                          <AvatarFallback>
                            {dm.user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {dm.user.status === 'online' && (
                          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border-2 border-background"></span>
                        )}
                      </div>
                      <span className="text-sm truncate flex-1">
                        {dm.user.name}
                      </span>
                      {dm.unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                          {dm.unreadCount}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-2 px-2 text-sm text-muted-foreground">
                    {searchQuery ? 'No messages found' : 'No direct messages yet'}
                  </div>
                )}

                {activeTeam && activeTeam.members.length > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start mt-1"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          New Message
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Start a new direct message</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </CollapsibleContent>
          )}
        </Collapsible>

        {activeTeam && (
          <div className="mb-4">
            <div className="flex items-center justify-between py-2 px-2">
              <div className="flex items-center">
                <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium">Team Members</span>
              </div>
            </div>
            <div className="mt-1 space-y-1">
              {activeTeam.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 py-2 px-2 rounded-md"
                >
                  <div className="relative">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>
                        {member.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {member.status === 'online' && (
                      <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border-2 border-background"></span>
                    )}
                  </div>
                  <span className="text-sm truncate flex-1">
                    {member.name}
                  </span>
                  {member.role === 'admin' && (
                    <span className="text-xs text-muted-foreground">
                      Admin
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default TeamsSidebar; 