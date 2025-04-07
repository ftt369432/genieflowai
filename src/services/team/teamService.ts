import { supabase } from '../supabase/supabaseClient';
import type { Team, TeamMember, Page, Thread, DirectMessage } from '../../types/team';

export class TeamService {
  static async getTeams(userId: string): Promise<Team[]> {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        members:team_members(*),
        pages:team_pages(*),
        threads:team_threads(*),
        direct_messages:direct_messages(*)
      `)
      .eq('members.user_id', userId);

    if (error) throw error;
    return data || [];
  }

  static async createTeam(teamData: Partial<Team>): Promise<Team> {
    const { data, error } = await supabase
      .from('teams')
      .insert(teamData)
      .select()
      .single();

    if (error) throw error;
    return data;
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