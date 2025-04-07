export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: 'admin' | 'member' | 'guest';
  status: 'online' | 'offline' | 'away' | 'busy';
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  passcode?: string;
  unread: number;
  isStarred: boolean;
  hasAI?: boolean;
  aiAssistant?: string;
  expanded?: boolean;
  threads?: Thread[];
  created_at: string;
  updated_at: string;
}

export interface Thread {
  id: string;
  page_id: string;
  title: string;
  lastActivity: string;
  participants: number;
  unread: number;
  created_at: string;
  updated_at: string;
}

export interface DirectMessage {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  unread: number;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastMessage: string;
  lastMessageTime: string;
}

export interface Team {
  id: string;
  name: string;
  avatar?: string;
  description?: string;
  members: TeamMember[];
  pages: Page[];
  threads: Thread[];
  direct_messages: DirectMessage[];
  created_at: string;
  updated_at: string;
}

export interface TeamActivity {
  id: string;
  team_id: string;
  user_id: string;
  action: string;
  details: string;
  created_at: string;
} 