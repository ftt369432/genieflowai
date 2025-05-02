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
      
      // Detect policy recursion errors which require fix_supabase_policy.sql to be applied
      if (checkError && checkError.code === '42P17' && checkError.message.includes('infinite recursion detected in policy')) {
        console.error('Supabase policy recursion error detected. Please apply fix_supabase_policy.sql to your database.');
        console.error('You can run: node scripts/fix-supabase-policy.js');
        console.warn('Using mock data until policy is fixed.');
        return this.getMockTeam();
      }

      // First, fetch teams the user belongs to
      // We'll try this, but we'll catch and handle any "table doesn't exist" errors
      try {
        const { data: teamMemberships, error: membershipError } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', userId);

        // Handle policy recursion errors which require fix_supabase_policy.sql to be applied
        if (membershipError && membershipError.code === '42P17' && membershipError.message.includes('infinite recursion detected in policy')) {
          console.error('Supabase policy recursion error detected in team_members. Please apply fix_supabase_policy.sql');
          console.error('You can run: node scripts/fix-supabase-policy.js');
          console.warn('Using mock data until policy is fixed.');
          return this.getMockTeam();
        }

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
    console.info('🧪 MOCK MODE: Using mock team data for development');
    
    return [{
      id: 'mock-team-1',
      name: 'Demo Team [MOCK]',
      description: 'This is a mock team for development (Supabase tables not available or policy issue)',
      avatar: '/logos/default.png',
      members: [
        {
          id: 'mock-member-1',
          user_id: 'mock-user-id',
          team_id: 'mock-team-1',
          name: 'Demo User',
          avatar: '/avatars/default.png',
          role: 'admin',
          status: 'online',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'mock-member-2',
          user_id: 'mock-user-2',
          team_id: 'mock-team-1',
          name: 'Development Tester',
          avatar: '/images/avatar-female-1.svg',
          role: 'member',
          status: 'away',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      pages: [
        {
          id: 'mock-page-1',
          team_id: 'mock-team-1',
          title: 'Development Notes',
          content: '# Development Notes\n\nThis is a mock page for testing.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
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