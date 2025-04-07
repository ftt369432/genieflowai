import React, { useState, useRef, useEffect } from 'react';
import { TeamsSidebar } from '../components/teams/TeamsSidebar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Plus, Search, Send, Paperclip, Smile, Users, Bookmark, Pin, Bell, Share2, Brain, Zap, FileText, MessageSquare, Bot, Sparkles, AtSign, ChevronDown, Mail, Settings, UserPlus } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';
import { Separator } from '../components/ui/Separator';
import { Badge } from '../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/Tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/Popover';
import { EmailAccountConnect } from '../components/email/EmailAccountConnect';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/Dialog';
import { toast } from 'sonner';
import { useTeam } from '../contexts/TeamContext';

// Define Message interface
interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar: string;
    role?: 'admin' | 'member' | 'guest' | 'ai';
  };
  timestamp: string;
  reactions?: {
    emoji: string;
    count: number;
    users: string[];
  }[];
  attachments?: {
    type: 'image' | 'file' | 'link';
    name: string;
    url: string;
    thumbnail?: string;
    size?: string;
  }[];
  isAIGenerated?: boolean;
  aiMetadata?: {
    model: string;
    prompt?: string;
    confidence?: number;
  };
}

interface AIAssistant {
  id: string;
  name: string;
  avatar: string;
  description: string;
  capabilities: string[];
  isActive: boolean;
}

// Mock data for messages
const mockMessages: Message[] = [
  {
    id: 'm1',
    content: 'Hey team, I just pushed the latest design updates to the repository. Please take a look and let me know your thoughts!',
    sender: {
      id: 'user-1',
      name: 'Alex Johnson',
      avatar: '/avatars/user1.png',
      role: 'admin'
    },
    timestamp: '10:30 AM',
    reactions: [
      { emoji: '👍', count: 3, users: ['user-2', 'user-3', 'user-4'] },
      { emoji: '🔥', count: 2, users: ['user-2', 'user-5'] }
    ],
    attachments: [
      { type: 'file', name: 'design-update.pdf', url: '/files/design-update.pdf', size: '2.4 MB' }
    ]
  },
  {
    id: 'm2',
    content: 'Looks great! I especially like the new navigation structure. Did you consider adding the dropdown we discussed last week?',
    sender: {
      id: 'user-3',
      name: 'Jordan Lee',
      avatar: '/avatars/user3.png',
      role: 'member'
    },
    timestamp: '10:45 AM',
    reactions: [
      { emoji: '👏', count: 1, users: ['user-1'] }
    ]
  },
  {
    id: 'm3',
    content: 'Based on the team\'s discussion, I\'ve analyzed the design update and here are my observations:\n\n• The new navigation improves user flow by 20%\n• Mobile responsiveness is well implemented\n• Accessibility score is 98/100\n• Recommend adding keyboard shortcuts for power users\n\nI can help prepare documentation for these changes if needed.',
    sender: {
      id: 'ai-1',
      name: 'Design Assistant',
      avatar: '/avatars/ai-assistant.png',
      role: 'ai'
    },
    timestamp: '10:52 AM',
    isAIGenerated: true,
    aiMetadata: {
      model: 'Gemini Pro',
      confidence: 0.92
    }
  },
  {
    id: 'm4',
    content: 'Thanks for the analysis! That\'s really helpful. Could you draft a quick summary of these changes for our client meeting tomorrow?',
    sender: {
      id: 'user-2',
      name: 'Taylor Smith',
      avatar: '/avatars/user2.png',
      role: 'member'
    },
    timestamp: '11:05 AM',
    reactions: [
      { emoji: '✅', count: 1, users: ['user-1'] }
    ]
  }
];

// Mock data for AI assistants
const mockAIAssistants: AIAssistant[] = [
  {
    id: 'ai-1',
    name: 'Design Assistant',
    avatar: '/avatars/ai-design.png',
    description: 'Specialized in UI/UX design feedback and suggestions',
    capabilities: ['Design analysis', 'Accessibility checks', 'User flow optimization'],
    isActive: true
  },
  {
    id: 'ai-2',
    name: 'Code Helper',
    avatar: '/avatars/ai-code.png',
    description: 'Helps with code review, bug identification, and best practices',
    capabilities: ['Code review', 'Bug detection', 'Performance suggestions'],
    isActive: false
  },
  {
    id: 'ai-3',
    name: 'Project Manager',
    avatar: '/avatars/ai-pm.png',
    description: 'Assists with task management, deadlines, and resource allocation',
    capabilities: ['Timeline planning', 'Resource allocation', 'Risk assessment'],
    isActive: false
  }
];

// Add expert responses for different topics
const expertResponses = {
  stocks: {
    'AAPL': 'Apple Inc. (AAPL) is currently trading at $182.52, up 1.2% today. The company recently announced record Q2 earnings with revenue of $94.8 billion. Analysts have a consensus "Buy" rating with a price target of $198.',
    'MSFT': 'Microsoft Corp. (MSFT) is currently trading at $417.88, up 0.5% today. Their cloud division Azure reported 27% growth in the latest quarter. The company has shown strong performance in AI integration across their product suite.',
    'GOOGL': 'Alphabet Inc. (GOOGL) is trading at $172.23, down 0.3% today. Google\'s advertising revenue continues to be strong, while their cloud business is growing at 28% year-over-year. Recent AI innovations like Gemini are positioning them well against competitors.',
    'AMZN': 'Amazon.com Inc. (AMZN) is currently at $182.15, up 1.8% today. AWS remains their most profitable division, though retail showed strong recovery in the latest quarter. Their advertising business is becoming a significant revenue source.',
    'TSLA': 'Tesla Inc. (TSLA) is trading at $175.22, down 2.1% today. Vehicle deliveries grew 6% year-over-year in the latest quarter. The company continues to face challenges with production ramp-up of new models and increasing competition in the EV market.',
  } as Record<string, string>,
  project: {
    'timeline': 'Based on the current progress and resource allocation, I estimate the project will be completed in approximately 12 weeks. Critical path items include the API integration (4 weeks), UI development (6 weeks, can overlap with API work), and testing/QA (3 weeks). I recommend adding a 15% buffer for unexpected issues.',
    'budget': 'The current project budget allocation stands at $245,000, with 35% already utilized. Major upcoming expenses include developer resources ($120,000), cloud infrastructure ($35,000), and third-party services ($28,000). Based on current burn rate, we\'re tracking within 5% of planned expenditure.',
    'resources': 'The project currently has 8 team members allocated: 3 full-stack developers, 2 frontend specialists, 1 DevOps engineer, 1 product manager, and 1 QA specialist. Based on the current timeline, we may need an additional frontend resource for weeks 6-10 to meet the UI development deadline.',
    'risks': 'Key project risks include: 1) Dependency on third-party API with historically variable uptime (mitigation: implement cached responses), 2) New technology stack for team (mitigation: additional training and external consultant), 3) Tight deadline with limited buffer (mitigation: prioritize MVP features and define clear scope boundaries).',
  },
  marketing: {
    'campaign': 'Based on historical data, the current campaign is performing 22% better than our Q1 efforts. Key metrics: CTR of 4.2% (up from 3.1%), conversion rate of 2.8% (up from 2.2%), and CAC of $38 (down from $45). Top performing channels are Instagram (42% of conversions) and Google Search (35%).',
    'competitors': 'Main competitor analysis shows they\'ve increased ad spend by approximately 30% this quarter. Their messaging is focusing more on sustainability and premium features, while price promotion frequency has decreased by 15%. Their social engagement metrics are up 25%, primarily on TikTok and YouTube.',
    'audience': 'Customer segmentation analysis reveals our fastest growing demographic is now 25-34 year old urban professionals, representing 38% of new customers (up from 29% last year). Product feature preferences within this segment prioritize mobile integration, premium design, and subscription options over one-time purchases.',
  },
  default: 'I\'m Genie Expert, your AI team member. I can help with questions about stocks, project management, marketing, and many other topics. Just mention me with @Genie Expert followed by your question, and I\'ll provide insights based on the latest available information.'
};

export const TeamsPage: React.FC = () => {
  const { 
    teams, 
    activeTeam, 
    loading, 
    error,
    createTeam,
    updateTeam,
    deleteTeam,
    addTeamMember,
    removeTeamMember,
    createPage,
    updatePage,
    deletePage,
    createThread,
    sendDirectMessage
  } = useTeam();

  const [currentPage, setCurrentPage] = useState({
    name: 'design-showcase',
    description: 'Design discussions and resources'
  });
  
  const [messageInput, setMessageInput] = useState('');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [activeAssistants, setActiveAssistants] = useState<string[]>(['ai-1']);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const mentionsRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showCreateTeamDialog, setShowCreateTeamDialog] = useState(false);
  const [newTeamData, setNewTeamData] = useState({
    name: '',
    description: ''
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCreateTeam = async () => {
    try {
      await createTeam({
        ...newTeamData,
        avatar: '/logos/logo-icon.png' // Default avatar
      });
      setShowCreateTeamDialog(false);
      setNewTeamData({ name: '', description: '' });
      toast.success('Team created successfully!');
    } catch (error) {
      toast.error('Failed to create team');
    }
  };

  const toggleAIAssistant = (assistantId: string) => {
    setActiveAssistants(prev => 
      prev.includes(assistantId)
        ? prev.filter(id => id !== assistantId)
        : [...prev, assistantId]
    );
  };

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      const newMessage: Message = {
        id: `m${messages.length + 1}`,
        content: messageInput,
        sender: {
          id: 'user-1',
          name: 'Alex Johnson',
          avatar: '/avatars/user1.png',
          role: 'admin'
        },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages([...messages, newMessage]);
      setMessageInput('');
      
      // Check if the message mentions the AI expert
      if (messageInput.includes('@Genie Expert')) {
        setTimeout(() => {
          const query = messageInput.split('@Genie Expert')[1].trim().toLowerCase();
          
          // Generate AI expert response based on the query
          let expertResponse = expertResponses.default;
          
          // Check for stock symbols (uppercase 1-5 letter words)
          const stockMatch = query.match(/\b[A-Z]{1,5}\b/g);
          if (stockMatch) {
            for (const symbol of stockMatch) {
              if (expertResponses.stocks[symbol]) {
                expertResponse = expertResponses.stocks[symbol];
                break;
              }
            }
          } 
          // Check for project management topics
          else if (query.includes('timeline') || query.includes('when') || query.includes('deadline')) {
            expertResponse = expertResponses.project.timeline;
          } else if (query.includes('budget') || query.includes('cost') || query.includes('money')) {
            expertResponse = expertResponses.project.budget;
          } else if (query.includes('resources') || query.includes('team') || query.includes('people')) {
            expertResponse = expertResponses.project.resources;
          } else if (query.includes('risk') || query.includes('issues') || query.includes('problems')) {
            expertResponse = expertResponses.project.risks;
          }
          // Check for marketing topics
          else if (query.includes('campaign') || query.includes('marketing')) {
            expertResponse = expertResponses.marketing.campaign;
          } else if (query.includes('competitor') || query.includes('competition')) {
            expertResponse = expertResponses.marketing.competitors;
          } else if (query.includes('audience') || query.includes('demographic') || query.includes('customers')) {
            expertResponse = expertResponses.marketing.audience;
          }
          
          const aiResponse: Message = {
            id: `m${messages.length + 2}`,
            content: expertResponse,
            sender: {
              id: 'ai-expert',
              name: 'Genie Expert',
              avatar: '/avatars/ai-expert.png',
              role: 'ai'
            },
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isAIGenerated: true,
            aiMetadata: {
              model: 'Gemini Pro',
              confidence: 0.95
            }
          };
          
          setMessages(currentMessages => [...currentMessages, aiResponse]);
        }, 1000);
      }
    }
  };
  
  const handleAIAssist = () => {
    if (messageInput.trim()) {
      // This would trigger AI to process the current message
      console.log('AI processing message:', messageInput);
      // In a real implementation, we'd wait for the AI response before clearing
      setMessageInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // If the user types '@', show the mentions dropdown
    if (e.key === '@') {
      setShowMentions(true);
      setMentionFilter('');
    }
    // If user presses Enter without shift, send the message
    else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } 
    // Hide mentions dropdown on escape
    else if (e.key === 'Escape') {
      setShowMentions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
    
    // If we're showing mentions and there's an @ symbol, update the filter
    if (showMentions) {
      const lastAtPos = e.target.value.lastIndexOf('@');
      if (lastAtPos !== -1) {
        setMentionFilter(e.target.value.slice(lastAtPos + 1));
      } else {
        setShowMentions(false);
      }
    }
  };

  const insertMention = (name: string) => {
    const lastAtPos = messageInput.lastIndexOf('@');
    if (lastAtPos !== -1) {
      const newInput = messageInput.slice(0, lastAtPos) + `@${name} ` + messageInput.slice(lastAtPos + 1 + mentionFilter.length);
      setMessageInput(newInput);
    }
    setShowMentions(false);
    messageInputRef.current?.focus();
  };

  // Filter mentions based on input
  const mentions = [
    { id: 'ai-expert', name: 'Genie Expert', avatar: '/avatars/ai-expert.png', role: 'ai' },
    { id: 'user-1', name: 'Alex Johnson', avatar: '/avatars/user1.png', role: 'admin' },
    { id: 'user-2', name: 'Taylor Smith', avatar: '/avatars/user2.png', role: 'member' },
    { id: 'user-3', name: 'Jordan Lee', avatar: '/avatars/user3.png', role: 'member' },
  ].filter(mention => 
    mention.name.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <TeamsSidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Main content area */}
        <div className="flex-1 p-4 overflow-y-auto">
          {activeTeam ? (
            <div className="space-y-4">
              {/* Team header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={activeTeam.avatar} alt={activeTeam.name} />
                    <AvatarFallback>{activeTeam.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-xl font-semibold">{activeTeam.name}</h1>
                    <p className="text-sm text-gray-500">{activeTeam.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setShowEmailDialog(true)}>
                    <Mail className="h-4 w-4 mr-1" />
                    Connect Email
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-1" />
                    Settings
                  </Button>
                </div>
              </div>

              {/* Team content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Main content area */}
                <div className="md:col-span-2 space-y-4">
                  {/* Team activity feed */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                    <h2 className="text-lg font-semibold mb-4">Team Activity</h2>
                    {/* Activity feed content */}
                  </div>

                  {/* Team pages */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold">Pages</h2>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        New Page
                      </Button>
                    </div>
                    {/* Pages content */}
                  </div>
                </div>

                {/* Right sidebar */}
                <div className="space-y-4">
                  {/* AI Assistants */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold">AI Assistants</h2>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    {/* AI Assistants content */}
                  </div>

                  {/* Team members */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold">Team Members</h2>
                      <Button variant="outline" size="sm">
                        <UserPlus className="h-4 w-4 mr-1" />
                        Invite
                      </Button>
                    </div>
                    {/* Team members content */}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <h2 className="text-2xl font-semibold mb-4">No Team Selected</h2>
              <p className="text-gray-500 mb-4">Select a team from the sidebar or create a new one</p>
              <Button onClick={() => setShowCreateTeamDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Team
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Create Team Dialog */}
      <Dialog open={showCreateTeamDialog} onOpenChange={setShowCreateTeamDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Create a new team workspace for collaboration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Team Name</label>
              <Input
                placeholder="Enter team name"
                value={newTeamData.name}
                onChange={(e) => setNewTeamData({...newTeamData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Enter team description"
                value={newTeamData.description}
                onChange={(e) => setNewTeamData({...newTeamData, description: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTeamDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTeam}>
              Create Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Connect Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Connect Email Account</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[80vh] p-4 pt-2">
            <EmailAccountConnect 
              isDialog={true}
              onConnectionSuccess={() => {
                setShowEmailDialog(false);
                toast.success('Email account connected successfully!');
              }}
              onConnectionError={(error) => {
                toast.error(error);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 