import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { TeamService } from '../services/team/teamService';
import type { Team, TeamMember, Page, Thread, DirectMessage } from '../types/team';
import { useAuth } from './AuthContext';

interface TeamContextType {
  teams: Team[];
  activeTeam: Team | null;
  activePage: Page | null; // Added
  loading: boolean;
  error: Error | null;
  setActiveTeam: (team: Team | null) => void;
  setActivePage: (page: Page | null) => void; // Added
  createTeam: (teamData: Partial<Team>) => Promise<Team>;
  updateTeam: (teamId: string, teamData: Partial<Team>) => Promise<Team>;
  deleteTeam: (teamId: string) => Promise<void>;
  addTeamMember: (teamId: string, memberData: Partial<TeamMember>) => Promise<TeamMember>;
  removeTeamMember: (teamId: string, memberId: string) => Promise<void>;
  createPage: (teamId: string, pageData: Partial<Page>) => Promise<Page>;
  updatePage: (pageId: string, pageData: Partial<Page>) => Promise<Page>;
  deletePage: (pageId: string) => Promise<void>;
  createThread: (pageId: string, threadData: Partial<Thread>) => Promise<Thread>;
  sendDirectMessage: (teamId: string, messageData: Partial<DirectMessage>) => Promise<DirectMessage>;
  refreshTeams: () => Promise<void>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TeamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();

  console.log(
    `%cTeamContext: PROVIDER BODY --- User from useAuth(): ${JSON.stringify(user)}, AuthLoading: ${authLoading}`,
    'color: blue; font-weight: bold;'
  );

  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeam, _setActiveTeam] = useState<Team | null>(null);
  const [activePage, _setActivePage] = useState<Page | null>(null); // Added state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Refs to hold current activeTeam and activePage for use in refreshTeams
  const activeTeamRef = useRef(activeTeam);
  const activePageRef = useRef(activePage);

  // Update refs when activeTeam or activePage change
  useEffect(() => {
    activeTeamRef.current = activeTeam;
  }, [activeTeam]);

  useEffect(() => {
    activePageRef.current = activePage;
  }, [activePage]);

  const setActivePage = useCallback((page: Page | null) => {
    console.log('TeamContext: Public setActivePage called with page:', JSON.stringify(page));
    _setActivePage(page);
  }, []);

  const setActiveTeam = useCallback((team: Team | null) => {
    console.log('TeamContext: Public setActiveTeam called with team:', JSON.stringify(team));
    _setActiveTeam(team);
    if (team && team.pages && team.pages.length > 0) {
      console.log('TeamContext: setActiveTeam - setting active page to first page of new team:', JSON.stringify(team.pages[0]));
      _setActivePage(team.pages[0]);
    } else {
      console.log('TeamContext: setActiveTeam - no pages in new team or team is null, setting active page to null.');
      _setActivePage(null);
    }
  }, []);

  const refreshTeams = useCallback(async () => {
    console.log('TeamContext: refreshTeams called. User:', JSON.stringify(user));
    if (!user || !user.id) {
      console.log('TeamContext: refreshTeams - no user, clearing data.');
      setLoading(false);
      setTeams([]);
      _setActiveTeam(null);
      _setActivePage(null);
      return;
    }
    try {
      setLoading(true);
      const userTeams = await TeamService.getTeams(user.id);
      console.log('TeamContext: refreshTeams - fetched teams:', JSON.stringify(userTeams));
      setTeams(userTeams);

      let newActiveTeam: Team | null = null;
      let newActivePage: Page | null = null;

      // Use refs to get current values
      const currentPersistedActiveTeam = activeTeamRef.current;
      const currentPersistedActivePage = activePageRef.current;

      if (userTeams.length > 0) {
        const currentActiveTeamStillExists = currentPersistedActiveTeam && userTeams.some(t => t.id === currentPersistedActiveTeam.id);
        if (currentActiveTeamStillExists) {
          newActiveTeam = userTeams.find(t => t.id === currentPersistedActiveTeam!.id) || userTeams[0];
        } else {
          newActiveTeam = userTeams[0];
        }

        if (newActiveTeam) {
          const currentActivePageStillExistsInNewActiveTeam = currentPersistedActivePage && newActiveTeam.pages.some(p => p.id === currentPersistedActivePage.id);
          if (currentActivePageStillExistsInNewActiveTeam) {
            newActivePage = newActiveTeam.pages.find(p => p.id === currentPersistedActivePage!.id) || (newActiveTeam.pages.length > 0 ? newActiveTeam.pages[0] : null) ;
          } else if (newActiveTeam.pages.length > 0) {
            newActivePage = newActiveTeam.pages[0];
          }
        }
      }
      
      console.log(`TeamContext: refreshTeams - Setting activeTeam: ${newActiveTeam?.id}, activePage: ${newActivePage?.id}`);
      _setActiveTeam(newActiveTeam);
      _setActivePage(newActivePage);
      setError(null);
    } catch (err) {
      console.error('TeamContext: refreshTeams - error:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch teams'));
    } finally {
      setLoading(false);
    }
  }, [user, _setActiveTeam, _setActivePage, setLoading, setTeams, setError]); // Changed dependencies

  useEffect(() => {
    console.log(`TeamContext: EFFECT [user, authLoading] --- User: ${JSON.stringify(user)}, AuthLoading: ${authLoading}`);
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (user && user.id) {
      refreshTeams();
    } else {
      setTeams([]);
      _setActiveTeam(null);
      _setActivePage(null);
      setLoading(false);
    }
  }, [user, authLoading, refreshTeams]);

  const createTeam = useCallback(async (teamData: Partial<Team>) => {
    if (!user || !user.id) throw new Error('User must be logged in to create a team.');
    try {
      const newTeam = await TeamService.createTeam(teamData);
      setTeams(prev => [...prev, newTeam]);
      // Does not automatically set as active, user can select it.
      return newTeam;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create team'));
      throw err;
    }
  }, [user]);

  const updateTeam = useCallback(async (teamId: string, teamData: Partial<Team>) => {
    if (!user || !user.id) throw new Error('User must be logged in to update a team.');
    try {
      const updatedTeam = await TeamService.updateTeam(teamId, teamData);
      setTeams(prev => prev.map(team => team.id === teamId ? updatedTeam : team));
      if (activeTeam?.id === teamId) {
        _setActiveTeam(updatedTeam);
        // Re-evaluate activePage
        const pageStillExists = activePage && updatedTeam.pages.some(p => p.id === activePage.id);
        if (pageStillExists) {
          _setActivePage(updatedTeam.pages.find(p => p.id === activePage!.id) || updatedTeam.pages[0] || null);
        } else {
          _setActivePage(updatedTeam.pages[0] || null);
        }
      }
      return updatedTeam;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update team'));
      throw err;
    }
  }, [user, activeTeam, activePage]);

  const deleteTeam = useCallback(async (teamId: string) => {
    if (!user || !user.id) throw new Error('User must be logged in to delete a team.');
    try {
      await TeamService.deleteTeam(teamId);
      let newActiveTeam: Team | null = null;
      let newActivePage: Page | null = null;
      setTeams(prev => {
        const remainingTeams = prev.filter(team => team.id !== teamId);
        if (activeTeam?.id === teamId) {
          newActiveTeam = remainingTeams.length > 0 ? remainingTeams[0] : null;
          if (newActiveTeam && newActiveTeam.pages.length > 0) {
            newActivePage = newActiveTeam.pages[0];
          }
        }
        return remainingTeams;
      });
      if (activeTeam?.id === teamId) { // If the deleted team was active
        _setActiveTeam(newActiveTeam);
        _setActivePage(newActivePage);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete team'));
      throw err;
    }
  }, [user, activeTeam, teams]); // teams is needed for setting new active team

  const addTeamMember = useCallback(async (teamId: string, memberData: Partial<TeamMember>) => {
    if (!user || !user.id) throw new Error('User must be logged in to add a member.');
    try {
      const newMember = await TeamService.addTeamMember(teamId, memberData);
      let updatedActiveTeam: Team | null = null;
      setTeams(prev => prev.map(team => {
        if (team.id === teamId) {
          const newTeam = { ...team, members: [...team.members, newMember] };
          if (activeTeam?.id === teamId) {
            updatedActiveTeam = newTeam;
          }
          return newTeam;
        }
        return team;
      }));
      if (updatedActiveTeam) {
        _setActiveTeam(updatedActiveTeam);
      }
      return newMember;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add member'));
      throw err;
    }
  }, [user, activeTeam]);

  const removeTeamMember = useCallback(async (teamId: string, memberId: string) => {
    if (!user || !user.id) throw new Error('User must be logged in to remove a member.');
    try {
      await TeamService.removeTeamMember(teamId, memberId);
      let updatedActiveTeam: Team | null = null;
      setTeams(prev => prev.map(team => {
        if (team.id === teamId) {
          const newTeam = { ...team, members: team.members.filter(m => m.id !== memberId) };
          if (activeTeam?.id === teamId) {
            updatedActiveTeam = newTeam;
          }
          return newTeam;
        }
        return team;
      }));
      if (updatedActiveTeam) {
        _setActiveTeam(updatedActiveTeam);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to remove member'));
      throw err;
    }
  }, [user, activeTeam]);

  const createPage = useCallback(async (teamId: string, pageData: Partial<Page>) => {
    if (!user || !user.id) throw new Error('User must be logged in to create a page.');
    try {
      const newPage = await TeamService.createPage(teamId, pageData);
      let updatedActiveTeam: Team | null = null;
      setTeams(prev => prev.map(team => {
        if (team.id === teamId) {
          const newTeam = { ...team, pages: [...team.pages, newPage] };
          if (activeTeam?.id === teamId) {
            updatedActiveTeam = newTeam;
          }
          return newTeam;
        }
        return team;
      }));
      if (updatedActiveTeam) {
        _setActiveTeam(updatedActiveTeam);
        // Optionally, set the new page as activePage, for now, user clicks to activate
        // _setActivePage(newPage);
      }
      return newPage;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create page'));
      throw err;
    }
  }, [user, activeTeam]);

  const updatePage = useCallback(async (pageId: string, pageData: Partial<Page>) => {
    if (!user || !user.id) throw new Error('User must be logged in to update a page.');
    try {
      const updatedPage = await TeamService.updatePage(pageId, pageData);
      let owningTeamId: string | null = null;
      setTeams(prev => prev.map(team => {
        const pageIndex = team.pages.findIndex(p => p.id === pageId);
        if (pageIndex !== -1) {
          owningTeamId = team.id;
          const newPages = [...team.pages];
          newPages[pageIndex] = updatedPage;
          return { ...team, pages: newPages };
        }
        return team;
      }));

      if (owningTeamId && activeTeam?.id === owningTeamId) {
        // Refresh activeTeam from the state to get the updated pages array
        const currentTeamState = teams.find(t => t.id === owningTeamId);
        if (currentTeamState) _setActiveTeam(currentTeamState);
        
        if (activePage?.id === pageId) {
          _setActivePage(updatedPage);
        }
      }
      return updatedPage;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update page'));
      throw err;
    }
  }, [user, activeTeam, activePage, teams]); // Added teams to deps for finding currentTeamState

  const deletePage = useCallback(async (pageId: string) => {
    if (!user || !user.id) throw new Error('User must be logged in to delete a page.');
    try {
      await TeamService.deletePage(pageId);
      let owningTeamId: string | null = null;
      let newActivePageCandidate: Page | null = null;

      setTeams(prev => prev.map(team => {
        const pageIndex = team.pages.findIndex(p => p.id === pageId);
        if (pageIndex !== -1) {
          owningTeamId = team.id;
          const updatedPages = team.pages.filter(p => p.id !== pageId);
          if (activeTeam?.id === team.id && activePage?.id === pageId) {
            newActivePageCandidate = updatedPages.length > 0 ? updatedPages[0] : null;
          }
          return { ...team, pages: updatedPages };
        }
        return team;
      }));

      if (owningTeamId && activeTeam?.id === owningTeamId) {
        // Refresh activeTeam from the state
        const currentTeamState = teams.find(t => t.id === owningTeamId);
        if (currentTeamState) _setActiveTeam(currentTeamState);

        if (activePage?.id === pageId) {
          _setActivePage(newActivePageCandidate);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete page'));
      throw err;
    }
  }, [user, activeTeam, activePage, teams]); // Added teams to deps

  const createThread = useCallback(async (pageId: string, threadData: Partial<Thread>) => {
    if (!user || !user.id) throw new Error('User must be logged in to create a thread.');
    // TODO: Implement thread creation logic, update relevant team/page state
    console.log('TeamContext: createThread called', pageId, threadData);
    const newThread = await TeamService.createThread(pageId, threadData);
    // Potentially update activeTeam.pages.find(p=>p.id === pageId).threads or similar
    return newThread;
  }, [user]);

  const sendDirectMessage = useCallback(async (teamId: string, messageData: Partial<DirectMessage>) => {
    if (!user || !user.id) throw new Error('User must be logged in to send a DM.');
    // TODO: Implement DM logic, update relevant team state
    console.log('TeamContext: sendDirectMessage called', teamId, messageData);
    const newDM = await TeamService.sendDirectMessage(teamId, messageData);
    // Potentially update activeTeam.direct_messages or similar
    return newDM;
  }, [user]);

  return (
    <TeamContext.Provider value={{
      teams,
      activeTeam,
      activePage, // Provide
      loading,
      error,
      setActiveTeam, // Use public setter
      setActivePage, // Use public setter
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