import type { Team, TeamMember, Page, Thread, DirectMessage, TeamActivity } from '../../types/team';

export class TeamService {

  private static getMockTeam(): Team[] {
    return [{
      id: 'mock-team-1',
      name: 'Demo Team [MOCK]',
      description: 'This is a mock team for development',
      avatar: '/logos/default.png',
      members: [
        {
          id: 'mock-member-1',
          name: 'Demo User',
          avatar: '/images/default-avatar.svg',
          role: 'admin',
          status: 'online',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'mock-member-2',
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
          name: 'Development Notes',
          description: '# Development Notes\n\nThis is a mock page for testing.',
          isPrivate: false,
          unread: 0,
          isStarred: false,
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

  static async getTeams(_userId: string): Promise<Team[]> {
    return TeamService.getMockTeam();
  }

  static async createTeam(teamData: Partial<Team>): Promise<Team> {
    const newMockTeam: Team = {
      id: `mock-team-${Date.now()}`,
      name: teamData.name || 'Newly Created Mock Team',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      members: [],
      pages: [],
      threads: [],
      direct_messages: [],
      description: teamData.description || 'A fresh mock team',
      avatar: teamData.avatar || '/logos/default.png',
      ...teamData,
    };
    return newMockTeam;
  }

  static async updateTeam(teamId: string, teamData: Partial<Team>): Promise<Team> {
    const mockTeams = TeamService.getMockTeam();
    const existingTeam = mockTeams.find(t => t.id === teamId) || mockTeams[0];

    if (existingTeam) {
      const updatedMockTeam: Team = {
        ...existingTeam,
        ...teamData,
        id: teamId,
        updated_at: new Date().toISOString(),
      };
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...teamData,
    };
    return fallbackTeam;
  }

  static async deleteTeam(_teamId: string): Promise<void> {
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
    };
    return newMockMember;
  }

  static async removeTeamMember(_teamId: string, _memberId: string): Promise<void> {
    return Promise.resolve();
  }

  static async createPage(_teamId: string, pageData: Partial<Page>): Promise<Page> {
    const newMockPage: Page = {
      id: `mock-page-${Date.now()}`,
      name: pageData.name || 'New Mock Page',
      description: pageData.description || '',
      isPrivate: pageData.isPrivate || false,
      unread: pageData.unread || 0,
      isStarred: pageData.isStarred || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...pageData,
    };
    return newMockPage;
  }

  static async updatePage(pageId: string, pageData: Partial<Page>): Promise<Page> {
    const mockTeams = TeamService.getMockTeam();
    let existingPage: Page | undefined;

    for (const team of mockTeams) {
      const foundPage = team.pages.find(p => p.id === pageId);
      if (foundPage) {
        existingPage = foundPage;
        break;
      }
    }

    if (!existingPage && mockTeams.length > 0 && mockTeams[0].pages.length > 0) {
      existingPage = mockTeams[0].pages[0];
    }

    if (existingPage) {
      const updatedMockPage: Page = {
        ...existingPage,
        ...pageData,
        id: pageId,
        updated_at: new Date().toISOString(),
      };
      return updatedMockPage;
    }

    const fallbackPage: Page = {
      id: pageId,
      name: pageData.name || 'Updated Mock Page',
      description: pageData.description || '',
      isPrivate: pageData.isPrivate || false,
      unread: pageData.unread || 0,
      isStarred: pageData.isStarred || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...pageData,
    };
    return fallbackPage;
  }

  static async deletePage(_pageId: string): Promise<void> {
    return Promise.resolve();
  }

  static async createThread(pageId: string, threadData: Partial<Thread>): Promise<Thread> {
    const newMockThread: Thread = {
      id: `mock-thread-${Date.now()}`,
      page_id: pageId,
      title: threadData.title || 'New Mock Thread',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      lastActivity: threadData.lastActivity || new Date().toISOString(),
      participants: threadData.participants || 0,
      unread: threadData.unread || 0,
      ...threadData,
    };
    return newMockThread;
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
    };
    return newMockDm;
  }

  static async getTeamActivity(teamId: string): Promise<TeamActivity[]> {
    const mockActivities: TeamActivity[] = [
      {
        id: 'act-1',
        team_id: teamId,
        user_id: 'mock-user-1',
        action: 'page_created',
        details: JSON.stringify({ pageName: 'New Ideas' }),
        created_at: new Date().toISOString()
      },
      {
        id: 'act-2',
        team_id: teamId,
        user_id: 'mock-user-2',
        action: 'member_joined',
        details: JSON.stringify({ memberName: 'Alex' }),
        created_at: new Date().toISOString()
      },
    ];
    return mockActivities;
  }
}