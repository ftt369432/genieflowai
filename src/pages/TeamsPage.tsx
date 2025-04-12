import React, { useState, useRef, useEffect } from 'react';
import TeamsSidebar from '../components/teams/TeamsSidebar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Plus, Search, Send, Paperclip, Smile, Users, Bookmark, Pin, Bell, Share2, Brain, Zap, FileText, MessageSquare, Bot, Sparkles, AtSign, ChevronDown, Settings, UserPlus } from 'lucide-react';
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
import { TeamCreationDialog } from '../components/teams/TeamCreationDialog';
import { useAuth } from '../contexts/AuthContext';
import { AIService } from '../services/ai/aiService';
import { 
  PenSquare, 
  MessageCircle, 
  MoreVertical,
  Hash
} from 'lucide-react';
import { Team, DirectMessage, Thread, Page } from '../types/team';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '../components/ui/Card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/DropdownMenu';

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
    name: 'Research Assistant',
    avatar: '/avatars/ai-research.png',
    description: 'Helps with research, citations, and fact-checking',
    capabilities: ['Research', 'Citation', 'Fact-checking'],
    isActive: false,
  },
  {
    id: 'ai-2',
    name: 'Meeting Summarizer',
    avatar: '/avatars/ai-meeting.png',
    description: 'Automatically creates summaries of team discussions',
    capabilities: ['Meeting summarization', 'Team collaboration', 'Information extraction'],
    isActive: false,
  },
  {
    id: 'ai-3',
    name: 'Project Manager',
    avatar: '/avatars/ai-project.png',
    description: 'Helps track tasks, deadlines, and project milestones',
    capabilities: ['Task management', 'Deadline tracking', 'Resource allocation'],
    isActive: false,
  },
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
  const { user } = useAuth();
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
  const [activeAssistants, setActiveAssistants] = useState<AIAssistant[]>(mockAIAssistants);
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
  const [threadTitle, setThreadTitle] = useState('');
  const [threadBody, setThreadBody] = useState('');
  const [showTeamCreation, setShowTeamCreation] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageContent, setNewPageContent] = useState('');
  const [showNewPage, setShowNewPage] = useState(false);
  const [activeTab, setActiveTab] = useState('board');
  const [activePage, setActivePage] = useState<Page | null>(null);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [activeDirectMessage, setActiveDirectMessage] = useState<DirectMessage | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Reset states when active team changes
    setMessages([]);
    setActivePage(null);
    setActiveThread(null);
    setActiveDirectMessage(null);
    setActiveTab('board');
  }, [activeTeam]);

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
      prev.map((assistant) =>
        assistant.id === assistantId
          ? { ...assistant, isActive: !assistant.isActive }
          : assistant
      )
    );
  };

  const handleSendMessage = async () => {
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

  const handleCreatePage = async () => {
    if (!newPageTitle.trim() || !activeTeam) return;

    try {
      const newPage = await createPage(activeTeam.id, {
        title: newPageTitle,
        content: newPageContent,
      });

      setNewPageTitle('');
      setNewPageContent('');
      setShowNewPage(false);
      
      if (newPage) {
        setActivePage(newPage);
        setActiveTab('pages');
      }
      
      toast.success('Page created successfully');
    } catch (error) {
      console.error('Error creating page:', error);
      toast.error('Failed to create page');
    }
  };

  const renderTeamBoard = () => {
    if (!activeTeam) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {/* Team Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Overview
            </CardTitle>
            <CardDescription>
              Key information about {activeTeam.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={activeTeam.avatar} />
                  <AvatarFallback>{activeTeam.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{activeTeam.name}</h3>
                  <p className="text-sm text-muted-foreground">{activeTeam.description || 'No description'}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Members ({activeTeam.members.length})</h4>
                <div className="flex -space-x-2 overflow-hidden">
                  {activeTeam.members.slice(0, 5).map((member) => (
                    <Avatar key={member.id} className="border-2 border-background h-8 w-8">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  ))}
                  {activeTeam.members.length > 5 && (
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-xs border-2 border-background">
                      +{activeTeam.members.length - 5}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full">
              Manage Team
            </Button>
          </CardFooter>
        </Card>

        {/* Recent Activity Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest updates and messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeTeam.threads.slice(0, 3).map((thread) => (
                <div key={thread.id} className="flex items-start gap-3 pb-3 border-b">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={thread.creator.avatar} />
                    <AvatarFallback>{thread.creator.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-sm">{thread.creator.name}</span>
                      <span className="text-xs text-muted-foreground">
                        in #{thread.title}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-2">{thread.lastMessage}</p>
                  </div>
                </div>
              ))}
              
              {activeTeam.threads.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  <p>No recent activity</p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => setActiveTab('threads')}
                  >
                    Start a thread
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => setActiveTab('threads')}
            >
              View All Activity
            </Button>
          </CardFooter>
        </Card>

        {/* Pages Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Team Pages
            </CardTitle>
            <CardDescription>
              Documentation and shared resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeTeam.pages.slice(0, 4).map((page) => (
                <div 
                  key={page.id} 
                  className="flex items-center gap-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                  onClick={() => {
                    setActivePage(page);
                    setActiveTab('pages');
                  }}
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{page.title}</span>
                </div>
              ))}
              
              {activeTeam.pages.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  <p>No pages yet</p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => {
                      setShowNewPage(true);
                      setActiveTab('pages');
                    }}
                  >
                    Create a page
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => {
                setShowNewPage(true);
                setActiveTab('pages');
              }}
            >
              Create New Page
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };

  const renderTeamPages = () => {
    if (!activeTeam) return null;

    if (showNewPage) {
      return (
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Create New Page</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowNewPage(false)}
            >
              Cancel
            </Button>
          </div>
          
          <div className="space-y-4 flex-1">
            <Input
              placeholder="Page Title"
              value={newPageTitle}
              onChange={(e) => setNewPageTitle(e.target.value)}
              className="text-lg font-medium"
            />
            
            <Textarea
              placeholder="Write your content here..."
              value={newPageContent}
              onChange={(e) => setNewPageContent(e.target.value)}
              className="flex-1 min-h-[300px]"
            />
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button onClick={handleCreatePage}>
              Save Page
            </Button>
          </div>
        </div>
      );
    }

    if (activePage) {
      return (
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{activePage.title}</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <PenSquare className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Share</DropdownMenuItem>
                  <DropdownMenuItem>Export</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="prose max-w-none">
              {activePage.content || <p className="text-muted-foreground">No content</p>}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Team Pages</h2>
          <Button 
            onClick={() => setShowNewPage(true)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Create Page
          </Button>
        </div>
        
        {activeTeam.pages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTeam.pages.map((page) => (
              <Card 
                key={page.id} 
                className="cursor-pointer hover:bg-accent/5"
                onClick={() => setActivePage(page)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {page.title}
                  </CardTitle>
                  <CardDescription>
                    Created by {page.creator.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm">
                    {page.content || 'No content'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Pages Yet</h3>
            <p className="text-muted-foreground mb-4 text-center max-w-md">
              Pages help your team share knowledge and document important information.
            </p>
            <Button onClick={() => setShowNewPage(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Create Your First Page
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderTeamThreads = () => {
    if (!activeTeam) return null;

    if (activeThread) {
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-medium">{activeThread.title}</h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setActiveThread(null)}
            >
              Back
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length > 0 ? (
              messages.map((message) => (
                <div key={message.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.sender.avatar} />
                    <AvatarFallback>
                      {message.isAI ? <Bot className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {message.sender.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      {message.isAI && (
                        <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full">
                          AI
                        </span>
                      )}
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL || undefined} />
                <AvatarFallback>
                  <UserIcon className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <Input
                placeholder="Type your message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button onClick={handleSendMessage} size="icon" disabled={!messageInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="mt-3">
              <h4 className="text-xs font-medium mb-2">AI Assistants</h4>
              <div className="flex flex-wrap gap-2">
                {activeAssistants.map((assistant) => (
                  <Button
                    key={assistant.id}
                    variant={assistant.isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleAIAssistant(assistant.id)}
                    className="h-8"
                  >
                    <Bot className="h-3 w-3 mr-1" />
                    {assistant.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Team Threads</h2>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Thread
          </Button>
        </div>
        
        {activeTeam.threads.length > 0 ? (
          <div className="space-y-2">
            {activeTeam.threads.map((thread) => (
              <div 
                key={thread.id} 
                className="flex items-start p-3 hover:bg-accent rounded-md cursor-pointer"
                onClick={() => setActiveThread(thread)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-1">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">{thread.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {thread.lastMessage}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex -space-x-2">
                      {thread.participants.slice(0, 3).map((participant) => (
                        <Avatar key={participant.id} className="border-2 border-background h-6 w-6">
                          <AvatarImage src={participant.avatar} />
                          <AvatarFallback>{participant.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {thread.messageCount} messages
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Threads Yet</h3>
            <p className="text-muted-foreground mb-4 text-center max-w-md">
              Create threads to organize team discussions around specific topics.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Create Your First Thread
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderTeamChat = () => {
    if (!activeTeam) return null;

    if (activeDirectMessage) {
      // Render the direct message chat
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 p-4 border-b">
            <Avatar className="h-8 w-8">
              <AvatarImage src={activeDirectMessage.user.avatar} />
              <AvatarFallback>{activeDirectMessage.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-medium">{activeDirectMessage.user.name}</h2>
              <span className="text-xs text-muted-foreground">
                {activeDirectMessage.user.status === 'online' ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="ml-auto">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setActiveDirectMessage(null)}
              >
                Back
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length > 0 ? (
              messages.map((message) => (
                <div key={message.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.sender.avatar} />
                    <AvatarFallback>
                      {message.isAI ? <Bot className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {message.sender.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL || undefined} />
                <AvatarFallback>
                  <UserIcon className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <Input
                placeholder="Type your message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button onClick={handleSendMessage} size="icon" disabled={!messageInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Direct Messages</h2>
        </div>
        
        {activeTeam.directMessages.length > 0 ? (
          <div className="space-y-2">
            {activeTeam.directMessages.map((dm) => (
              <div 
                key={dm.id} 
                className="flex items-center p-3 hover:bg-accent rounded-md cursor-pointer"
                onClick={() => setActiveDirectMessage(dm)}
              >
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={dm.user.avatar} />
                  <AvatarFallback>{dm.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{dm.user.name}</h3>
                    <span className="text-xs text-muted-foreground">
                      {new Date(dm.lastMessageTime).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {dm.lastMessage}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Direct Messages</h3>
            <p className="text-muted-foreground mb-4 text-center max-w-md">
              Start a private conversation with a team member by selecting them from the sidebar.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderNoTeamSelected = () => (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <Users className="h-16 w-16 text-muted-foreground mb-6" />
      <h2 className="text-2xl font-bold mb-2">Select or Create a Team</h2>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        Teams help you organize your work and collaborate with others. Select an existing team or create a new one to get started.
      </p>
      <Button onClick={() => setShowTeamCreation(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Create New Team
      </Button>
    </div>
  );

  const renderTeamContent = () => {
    if (!activeTeam) {
      return renderNoTeamSelected();
    }

    return (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="threads">Threads</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>
        
        <TabsContent value="board" className="flex-1 overflow-y-auto">
          {renderTeamBoard()}
        </TabsContent>
        
        <TabsContent value="pages" className="flex-1 overflow-hidden">
          {renderTeamPages()}
        </TabsContent>
        
        <TabsContent value="threads" className="flex-1 overflow-hidden">
          {renderTeamThreads()}
        </TabsContent>
        
        <TabsContent value="chat" className="flex-1 overflow-hidden">
          {renderTeamChat()}
        </TabsContent>
      </Tabs>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <TeamsSidebar 
        onCreateTeam={() => setShowTeamCreation(true)}
        onTeamSelect={(team) => setActiveTeam(team)}
        onDirectMessageSelect={(dm) => {
          setActiveDirectMessage(dm);
          setActiveTab('chat');
        }}
      />
      
      <main className="flex-1 overflow-hidden bg-background">
        {renderTeamContent()}
      </main>
      
      <TeamCreationDialog 
        isOpen={showTeamCreation} 
        onClose={() => setShowTeamCreation(false)} 
      />
    </div>
  );
};

export default TeamsPage; 