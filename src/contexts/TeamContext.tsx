import React, { createContext, useContext, useState, useEffect } from 'react';
import { TeamService } from '../services/team/teamService';
import type { Team, TeamMember, Page, Thread, DirectMessage } from '../types/team';
import { useAuth } from './AuthContext';

interface TeamContextType {
  teams: Team[];
  activeTeam: Team | null;
  loading: boolean;
  error: Error | null;
  setActiveTeam: (team: Team | null) => void;
  createTeam: (teamData: Partial<Team>) => Promise<Team>;
  updateTeam: (teamId: string, teamData: Partial<Team>) => Promise<Team>;
  deleteTeam: (teamId: string) => Promise<void>;
  addTeamMember: (teamId: string, memberData: Partial<TeamMember>) => Promise<TeamMember>;
  removeTeamMember: (teamId: string, userId: string) => Promise<void>;
  createPage: (teamId: string, pageData: Partial<Page>) => Promise<Page>;
  updatePage: (pageId: string, pageData: Partial<Page>) => Promise<Page>;
  deletePage: (pageId: string) => Promise<void>;
  createThread: (pageId: string, threadData: Partial<Thread>) => Promise<Thread>;
  sendDirectMessage: (teamId: string, messageData: Partial<DirectMessage>) => Promise<DirectMessage>;
  refreshTeams: () => Promise<void>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TeamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const refreshTeams = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const userTeams = await TeamService.getTeams(user.id);
      setTeams(userTeams);
      if (!activeTeam && userTeams.length > 0) {
        setActiveTeam(userTeams[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch teams'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshTeams();
  }, [user]);

  const createTeam = async (teamData: Partial<Team>) => {
    try {
      const newTeam = await TeamService.createTeam(teamData);
      setTeams(prev => [...prev, newTeam]);
      return newTeam;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create team'));
      throw err;
    }
  };

  const updateTeam = async (teamId: string, teamData: Partial<Team>) => {
    try {
      const updatedTeam = await TeamService.updateTeam(teamId, teamData);
      setTeams(prev => prev.map(team => team.id === teamId ? updatedTeam : team));
      if (activeTeam?.id === teamId) {
        setActiveTeam(updatedTeam);
      }
      return updatedTeam;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update team'));
      throw err;
    }
  };

  const deleteTeam = async (teamId: string) => {
    try {
      await TeamService.deleteTeam(teamId);
      setTeams(prev => prev.filter(team => team.id !== teamId));
      if (activeTeam?.id === teamId) {
        setActiveTeam(teams.length > 1 ? teams[0] : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete team'));
      throw err;
    }
  };

  const addTeamMember = async (teamId: string, memberData: Partial<TeamMember>) => {
    try {
      const newMember = await TeamService.addTeamMember(teamId, memberData);
      setTeams(prev => prev.map(team => {
        if (team.id === teamId) {
          return {
            ...team,
            members: [...team.members, newMember]
          };
        }
        return team;
      }));
      return newMember;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add team member'));
      throw err;
    }
  };

  const removeTeamMember = async (teamId: string, userId: string) => {
    try {
      await TeamService.removeTeamMember(teamId, userId);
      setTeams(prev => prev.map(team => {
        if (team.id === teamId) {
          return {
            ...team,
            members: team.members.filter(member => member.user_id !== userId)
          };
        }
        return team;
      }));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to remove team member'));
      throw err;
    }
  };

  const createPage = async (teamId: string, pageData: Partial<Page>) => {
    try {
      const newPage = await TeamService.createPage(teamId, pageData);
      setTeams(prev => prev.map(team => {
        if (team.id === teamId) {
          return {
            ...team,
            pages: [...team.pages, newPage]
          };
        }
        return team;
      }));
      return newPage;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create page'));
      throw err;
    }
  };

  const updatePage = async (pageId: string, pageData: Partial<Page>) => {
    try {
      const updatedPage = await TeamService.updatePage(pageId, pageData);
      setTeams(prev => prev.map(team => {
        if (team.pages.some(page => page.id === pageId)) {
          return {
            ...team,
            pages: team.pages.map(page => page.id === pageId ? updatedPage : page)
          };
        }
        return team;
      }));
      return updatedPage;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update page'));
      throw err;
    }
  };

  const deletePage = async (pageId: string) => {
    try {
      await TeamService.deletePage(pageId);
      setTeams(prev => prev.map(team => {
        if (team.pages.some(page => page.id === pageId)) {
          return {
            ...team,
            pages: team.pages.filter(page => page.id !== pageId)
          };
        }
        return team;
      }));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete page'));
      throw err;
    }
  };

  const createThread = async (pageId: string, threadData: Partial<Thread>) => {
    try {
      const newThread = await TeamService.createThread(pageId, threadData);
      setTeams(prev => prev.map(team => {
        if (team.threads.some(thread => thread.page_id === pageId)) {
          return {
            ...team,
            threads: [...team.threads, newThread]
          };
        }
        return team;
      }));
      return newThread;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create thread'));
      throw err;
    }
  };

  const sendDirectMessage = async (teamId: string, messageData: Partial<DirectMessage>) => {
    try {
      const newMessage = await TeamService.sendDirectMessage(teamId, messageData);
      setTeams(prev => prev.map(team => {
        if (team.id === teamId) {
          return {
            ...team,
            direct_messages: [...team.direct_messages, newMessage]
          };
        }
        return team;
      }));
      return newMessage;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to send direct message'));
      throw err;
    }
  };

  return (
    <TeamContext.Provider value={{
      teams,
      activeTeam,
      loading,
      error,
      setActiveTeam,
      createTeam,
      updateTeam,
      deleteTeam,
      addTeamMember,
      removeTeamMember,
      createPage,
      updatePage,
      deletePage,
      createThread,
      sendDirectMessage,
      refreshTeams
    }}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
}; 