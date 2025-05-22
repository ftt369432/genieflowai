import { supabase } from '../supabase/supabaseClient'; // Corrected path
import type { Team, TeamMember, Page, Thread, DirectMessage, TeamActivity } from '../../types/team';

export class TeamService {

  // private static getMockTeam(): Team[] { ... } // Mock function will be removed or commented out

  static async getTeams(userId: string): Promise<Team[]> {
    if (!userId) {
      console.warn('getTeams called without a userId.');
      return [];
    }

    try {
      const { data: teamMembershipData, error: teamMembershipError } = await supabase
        .from('team_members')
        .select(`
          role,
          teams (
            id,
            name,
            description,
            avatar: avatar_url,
            created_at,
            updated_at,
            owner_id,
            settings,
            pages (
              id,
              name,
              description,
              is_private,
              created_by,
              created_at,
              updated_at
            ),
            team_members (
              user_id,
              role,
              profiles (
                id,
                full_name,
                avatar_url
              )
            )
          )
        `)
        .eq('user_id', userId);

      if (teamMembershipError) {
        console.error('Error fetching team memberships:', teamMembershipError);
        throw teamMembershipError;
      }

      if (!teamMembershipData) {
        return [];
      }

      // Transform the data to match the Team[] structure
      const teams: Team[] = teamMembershipData.map((membership: any) => {
        const teamData = membership.teams;
        if (!teamData) return null; // Should not happen if query is correct

        const members: TeamMember[] = (teamData.team_members || []).map((tm: any) => ({
          id: tm.profiles?.id || tm.user_id, // Use profile id if available
          name: tm.profiles?.full_name || 'Unknown User',
          avatar: tm.profiles?.avatar_url || '/images/default-avatar.svg', // Default avatar
          role: tm.role as TeamMember['role'],
          // TODO: Fetch real status - for now, placeholder
          status: 'online' as TeamMember['status'], 
          created_at: tm.created_at || new Date().toISOString(), // team_members created_at
          updated_at: tm.profiles?.updated_at || new Date().toISOString(), // profile updated_at
        })).filter((m: TeamMember | null) => m !== null);

        const pages: Page[] = (teamData.pages || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          isPrivate: p.is_private,
          // TODO: Implement unread counts and starring
          unread: 0,
          isStarred: false,
          hasAI: false, // Placeholder
          created_at: p.created_at,
          updated_at: p.updated_at,
          // threads: [], // Threads will be fetched on demand when a page is active
        })).filter((p: Page | null) => p !== null);
        
        return {
          id: teamData.id,
          name: teamData.name,
          description: teamData.description,
          avatar: teamData.avatar || '/logos/default.png', // Default team avatar
          members,
          pages,
          threads: [], // Threads fetched on demand
          direct_messages: [], // DMs handled separately
          created_at: teamData.created_at,
          updated_at: teamData.updated_at,
        };
      }).filter((t: Team | null) => t !== null) as Team[];
      
      return teams;

    } catch (error) {
      console.error('Unexpected error in getTeams:', error);
      // Depending on error handling strategy, you might re-throw, or return empty/error indicator
      return []; 
    }
  }

  static async createTeam(teamData: { name: string; description?: string; avatar_url?: string }, userId: string): Promise<Team> {
    if (!userId) {
      throw new Error('User ID is required to create a team.');
    }
    if (!teamData.name) {
      throw new Error('Team name is required.');
  }

    const { data: newTeam, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: teamData.name,
        description: teamData.description,
        avatar_url: teamData.avatar_url,
        owner_id: userId,
      })
      .select()
      .single();

    if (teamError) {
      console.error('Error creating team:', JSON.stringify(teamError));
      throw teamError;
    }

    if (!newTeam) {
      throw new Error('Failed to create team, no data returned.');
    }

    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: newTeam.id,
        user_id: userId,
        role: 'admin', // Or 'owner'
      });

    if (memberError) {
      console.error('Error adding creator to team members:', memberError);
      // Non-critical error for the team creation itself, but should be logged.
      // Depending on requirements, you might want to roll back team creation.
    }

    // Return a structure that matches the Team type.
    // This might require fetching the newly created team with its members and pages,
    // or constructing a simplified version. For now, returning a basic Team object.
    return {
      id: newTeam.id,
      name: newTeam.name,
      description: newTeam.description || '',
      avatar: newTeam.avatar_url || '/logos/default.png',
      created_at: newTeam.created_at,
      updated_at: newTeam.updated_at, // Assuming supabase returns this, or use created_at
      members: [], // Members list would ideally be populated, perhaps by a subsequent fetch
      pages: [],   // Pages list would ideally be populated
      threads: [],
      direct_messages: [],
    };
  }

  static async updateTeam(teamId: string, teamData: Partial<Team>): Promise<Team> {
    const mockTeams: Team[] = [/* some mock data or fetch logic if one team is needed */]; 
    const existingTeam = mockTeams.find(t => t.id === teamId) || (mockTeams.length > 0 ? mockTeams[0] : null);

    if (existingTeam) {
      const updatedMockTeam: Team = {
        ...existingTeam,
        ...teamData,
        id: teamId, // Ensure id is not overwritten if present in teamData
        updated_at: new Date().toISOString(),
      } as Team;
      return updatedMockTeam;
    }
    const fallbackTeam: Team = {
      id: teamId,
      name: teamData.name || 'Updated Mock Team',
      description: teamData.description || 'Description for updated mock team',
      avatar: teamData.avatar || '/logos/default.png',
      members: teamData.members || [],
      pages: teamData.pages || [],
      threads: teamData.threads || [],
      direct_messages: teamData.direct_messages || [],
      created_at: teamData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...(teamData as Partial<Omit<Team, 'id' | 'created_at' | 'updated_at'>>),
    } as Team;
    return fallbackTeam;
  }

  static async deleteTeam(_teamId: string): Promise<void> {
    console.log('deleteTeam mock called for', _teamId);
    return Promise.resolve();
  }

  static async addTeamMember(_teamId: string, memberData: Partial<TeamMember>): Promise<TeamMember> {
    const newMockMember: TeamMember = {
      id: `mock-member-${Date.now()}`,
      name: memberData.name || 'Mock Member',
      role: memberData.role || 'member',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      avatar: memberData.avatar || '/images/default-avatar.svg',
      status: memberData.status || 'online',
      ...memberData,
    } as TeamMember;
    return newMockMember;
  }

  static async removeTeamMember(_teamId: string, _memberId: string): Promise<void> {
    console.log('removeTeamMember mock called for', _teamId, _memberId);
    return Promise.resolve();
  }

  static async createPage(teamId: string, pageData: Partial<Omit<Page, 'id' | 'created_at' | 'updated_at' | 'threads' | 'unread' | 'isStarred' | 'hasAI' >> & { name: string } ): Promise<Page> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User is not authenticated.');
    }

    const pageToInsert = {
      team_id: teamId,
      name: pageData.name,
      description: pageData.description || null,
      is_private: pageData.isPrivate || false,
      created_by: user.id,
    };

    const { data: newPageData, error: insertPageError } = await supabase
      .from('pages')
      .insert(pageToInsert)
      .select()
      .single();

    if (insertPageError) {
      console.error('Error creating page:', insertPageError);
      throw insertPageError;
    }

    if (!newPageData) {
      throw new Error('Failed to create page, no data returned.');
    }

    if (newPageData.is_private) {
      const { error: insertMemberError } = await supabase
        .from('page_members')
        .insert({
          page_id: newPageData.id,
          user_id: user.id,
          role: 'admin_of_page',
        });

      if (insertMemberError) {
        console.error('Error adding creator to private page members:', insertMemberError);
      }
    }
    
    return {
      id: newPageData.id,
      name: newPageData.name,
      description: newPageData.description || '',
      isPrivate: newPageData.is_private,
      unread: 0, 
      isStarred: false, 
      hasAI: false, 
      threads: [], 
      created_at: newPageData.created_at,
      updated_at: newPageData.updated_at,
      aiAssistant: pageData.aiAssistant, 
      expanded: pageData.expanded,
    } as Page; 
  }

  static async getMessages(pageId: string): Promise<Thread[]> {
    if (!pageId) {
      console.warn('getMessages called without a pageId.');
      return [];
    }

    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select(
        `
        id,
        page_id,
        user_id,
        content,
        created_at,
        updated_at,
        parent_message_id,
        user_profile:profiles (
          id,
          full_name,
          avatar_url,
          display_name
        )
      `
      )
      .eq('page_id', pageId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      throw messagesError;
    }

    return (messagesData || []).map((msg: any) => ({
      id: msg.id,
      page_id: msg.page_id,
      user_id: msg.user_id,
      content: msg.content,
      created_at: msg.created_at,
      updated_at: msg.updated_at,
      parent_message_id: msg.parent_message_id,
      user_profile: msg.user_profile ? {
        id: msg.user_profile.id,
        full_name: msg.user_profile.full_name,
        avatar_url: msg.user_profile.avatar_url,
        display_name: msg.user_profile.display_name,
      } : undefined,
    })) as Thread[];
  }

  static async updatePage(pageId: string, pageData: Partial<Page>): Promise<Page> {
    const mockTeams: Team[] = [/* some mock data */];
    let existingPage: Page | undefined;

    for (const team of mockTeams) {
      const foundPage = team.pages.find(p => p.id === pageId);
      if (foundPage) {
        existingPage = foundPage;
        break;
      }
    }
    if (!existingPage && mockTeams.length > 0 && mockTeams[0].pages.length > 0) {
        existingPage = mockTeams[0].pages[0]; // Fallback logic
    }

    if (existingPage) {
      const updatedMockPage: Page = {
        ...existingPage,
        ...pageData,
        id: pageId,
        updated_at: new Date().toISOString(),
      } as Page;
      return updatedMockPage;
    }

    const fallbackPage: Page = {
      id: pageId,
      name: pageData.name || 'Updated Mock Page',
      description: pageData.description || '',
      isPrivate: pageData.isPrivate || false,
      unread: pageData.unread || 0,
      isStarred: pageData.isStarred || false,
      created_at: pageData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...pageData,
    } as Page;
    return fallbackPage;
  }

  static async deletePage(_pageId: string): Promise<void> {
    console.log('deletePage mock called for', _pageId);
    return Promise.resolve();
  }

  static async createThread(pageId: string, threadData: Partial<Omit<Thread, 'id' | 'created_at' | 'updated_at' | 'page_id' | 'user_id'>> & { content: string; user_id: string }): Promise<Thread> {
    // This is a mock implementation
    const mockThread: Thread = {
      id: `mock-thread-${Date.now()}`,
      page_id: pageId,
      user_id: threadData.user_id,
      content: threadData.content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      parent_message_id: threadData.parent_message_id,
      user_profile: threadData.user_profile,
    };
    console.log('createThread mock called for page:', pageId, 'with data:', threadData);
    return mockThread;
  }

  static async sendDirectMessage(_teamId: string, messageData: Partial<DirectMessage>): Promise<DirectMessage> {
    const newMockDm: DirectMessage = {
      id: `mock-dm-${Date.now()}`,
      userId: messageData.userId || 'mock-user-id',
      name: messageData.name || 'Mock User',
      lastMessage: messageData.lastMessage || 'Mock DM content',
      lastMessageTime: messageData.lastMessageTime || new Date().toISOString(),
      unread: messageData.unread || 0,
      status: messageData.status || 'online',
      avatar: messageData.avatar,
      ...messageData,
    } as DirectMessage;
    return newMockDm;
  }

  static async getTeamActivity(teamId: string): Promise<TeamActivity[]> {
    // Mock implementation
    const mockActivity: TeamActivity[] = [
      { id: 'act1', team_id: teamId, user_id: 'user1', action: 'joined_team', details: 'User One joined the team', created_at: new Date().toISOString() },
      { id: 'act2', team_id: teamId, user_id: 'user2', action: 'created_page', details: 'User Two created #general', created_at: new Date().toISOString() },
    ];
    console.log('getTeamActivity mock called for teamId:', teamId);
    return mockActivity;
  }

  static async sendMessage(
    pageId: string,
    content: string,
    userId: string, // Added userId
    parentMessageId?: string | null
  ): Promise<Thread> {
    if (!userId) {
      throw new Error('User ID is required to send a message.');
    }
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        page_id: pageId,
        content,
        user_id: userId, // Ensure this is passed and used
        parent_message_id: parentMessageId,
      })
      .select(
        `
        id,
        page_id,
        user_id,
        content,
        created_at,
        updated_at,
        parent_message_id,
        user_profile:profiles (
          id,
          full_name,
          avatar_url,
          display_name
        )
      `
      )
      .single();

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }
    if (!message) {
      throw new Error('Failed to send message, no data returned.');
    }

    const profileData = Array.isArray(message.user_profile) && message.user_profile.length > 0 
                          ? message.user_profile[0] 
                          : (!Array.isArray(message.user_profile) ? message.user_profile : undefined);

    return {
      id: message.id,
      page_id: message.page_id,
      user_id: message.user_id,
      content: message.content,
      created_at: message.created_at,
      updated_at: message.updated_at,
      parent_message_id: message.parent_message_id,
      user_profile: profileData ? {
        id: profileData.id,
        full_name: profileData.full_name,
        avatar_url: profileData.avatar_url,
        display_name: profileData.display_name,
      } : undefined,
    } as Thread;
  }
}