import { supabase } from '../supabase/supabaseClient';
import type { Team, TeamMember, Page, Thread, DirectMessage } from '../../types/team';

export class TeamService {
  // Flag to track if we've already logged the missing table error
  private static hasLoggedMissingTableError = false;

  static async getTeams(userId: string): Promise<Team[]> {
    try {
      // Check if tables exist in Supabase - if not, return mock data
      const { error: checkError } = await supabase
        .from('teams')
        .select('id')
        .limit(1);
      
      // If there's an error about the relation not existing, return mock data
      if (checkError && (checkError.code === '42P01' || checkError.message.includes('does not exist'))) {
        if (!this.hasLoggedMissingTableError) {
          console.warn('Team tables do not exist in the database yet. Using mock data instead.', checkError);
          this.hasLoggedMissingTableError = true;
        }
        return this.getMockTeam();
      }

      // First, fetch teams the user belongs to
      // We'll try this, but we'll catch and handle any "table doesn't exist" errors
      try {
        const { data: teamMemberships, error: membershipError } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', userId);

        if (membershipError) {
          // If the error is specifically about the table not existing, return mock data
          if (membershipError.code === '42P01' || membershipError.message.includes('does not exist')) {
            if (!this.hasLoggedMissingTableError) {
              console.warn('Team members table does not exist yet. Using mock data instead.');
              this.hasLoggedMissingTableError = true;
            }
            return this.getMockTeam();
          }
          // Otherwise rethrow the error
          throw membershipError;
        }

        // If no teams, return mock data
        if (!teamMemberships || teamMemberships.length === 0) {
          return this.getMockTeam();
        }

        // Get all team IDs the user belongs to
        const teamIds = teamMemberships.map(tm => tm.team_id);

        // Fetch the teams
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .in('id', teamIds);

        if (teamsError) throw teamsError;

        if (!teams || teams.length === 0) {
          return this.getMockTeam();
        }

        // For each team, fetch the members separately
        const teamsWithMembers = await Promise.all(
          teams.map(async (team) => {
            const { data: members, error: membersError } = await supabase
              .from('team_members')
              .select('*')
              .eq('team_id', team.id);

            if (membersError) {
              console.warn(`Error fetching members for team ${team.id}:`, membersError);
              return {
                ...team,
                members: [],
                pages: [],
                threads: [],
                direct_messages: []
              };
            }

            return {
              ...team,
              members: members || [],
              pages: [],
              threads: [],
              direct_messages: []
            };
          })
        );

        return teamsWithMembers;
      } catch (innerErr) {
        // Catch any errors from the inner try/catch and return mock data
        console.error('Error processing teams:', innerErr);
        return this.getMockTeam();
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
      return this.getMockTeam();
    }
  }

  // Generate consistent mock data for demo/development
  private static getMockTeam(): Team[] {
    return [{
      id: 'mock-team-1',
      name: 'Demo Team',
      description: 'This is a demo team (tables not yet created in database)',
      avatar: '/logos/default.png',
      members: [
        {
          id: 'mock-member-1',
          name: 'Demo User',
          avatar: '/avatars/default.png',
          role: 'admin',
          status: 'online',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      pages: [],
      threads: [],
      direct_messages: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }];
  }

  static async createTeam(teamData: Partial<Team>): Promise<Team> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert(teamData)
        .select()
        .single();

      if (error) {
        // If the error is specifically about the table not existing, return mock data
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.warn('Teams table does not exist yet. Returning mock data.');
          return this.getMockTeam()[0];
        }
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Error creating team:', err);
      return this.getMockTeam()[0];
    }
  }

  static async updateTeam(teamId: string, teamData: Partial<Team>): Promise<Team> {
    const { data, error } = await supabase
      .from('teams')
      .update(teamData)
      .eq('id', teamId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteTeam(teamId: string): Promise<void> {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (error) throw error;
  }

  static async addTeamMember(teamId: string, memberData: Partial<TeamMember>): Promise<TeamMember> {
    const { data, error } = await supabase
      .from('team_members')
      .insert({
        ...memberData,
        team_id: teamId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async removeTeamMember(teamId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  static async createPage(teamId: string, pageData: Partial<Page>): Promise<Page> {
    const { data, error } = await supabase
      .from('team_pages')
      .insert({
        ...pageData,
        team_id: teamId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updatePage(pageId: string, pageData: Partial<Page>): Promise<Page> {
    const { data, error } = await supabase
      .from('team_pages')
      .update(pageData)
      .eq('id', pageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deletePage(pageId: string): Promise<void> {
    const { error } = await supabase
      .from('team_pages')
      .delete()
      .eq('id', pageId);

    if (error) throw error;
  }

  static async createThread(pageId: string, threadData: Partial<Thread>): Promise<Thread> {
    const { data, error } = await supabase
      .from('team_threads')
      .insert({
        ...threadData,
        page_id: pageId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async sendDirectMessage(teamId: string, messageData: Partial<DirectMessage>): Promise<DirectMessage> {
    const { data, error } = await supabase
      .from('direct_messages')
      .insert({
        ...messageData,
        team_id: teamId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getTeamActivity(teamId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('team_activity')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  }
} 