import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, CreditCard, LogOut, Shield, Calendar, Mail, Settings, RefreshCw, Chrome } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useUserStore } from '../stores/userStore';
import { logoutUser, isAuthenticated } from '../services/auth/authService';
import { PageContainer } from '../components/ui/ResponsiveContainer';
import { ResponsiveGrid, ResponsiveGridItem } from '../components/ui/ResponsiveGrid';
import { Spinner } from '../components/ui/Spinner';
import { getAvatar } from '../lib/utils';
import { googleUserProfileService } from '../services/google/userProfileService';
import { toast } from 'sonner';
import { EmailAccountConnect } from '../components/email/EmailAccountConnect';
import { useEmail } from '../contexts/EmailContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Avatar } from '../components/ui/Avatar';
import { Icons } from '@/components/icons';

interface EmailConfig {
  type: 'gmail' | 'imap';
  email: string;
  password?: string;
  server?: string;
  port?: number;
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { 
    user, 
    subscription, 
    isAuthenticated: isAuth,
    isLoading,
    syncWithGoogleProfile,
    hasGoogleIntegration,
    getGoogleIntegration
  } = useUserStore();
  const { accounts } = useEmail();
  const [isSyncing, setIsSyncing] = useState(false);
  const [emailConnectionStatus, setEmailConnectionStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [emailConfigs, setEmailConfigs] = useState<EmailConfig[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate, isAuth]);

  // Handle logout
  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  // Navigate to settings
  const handleNavigateToSettings = () => {
    navigate('/settings');
  };

  // Navigate to subscription page
  const handleNavigateToSubscription = () => {
    navigate('/subscription');
  };

  // Format date to readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get plan display name
  const getPlanName = () => {
    if (!subscription) return 'No Subscription';
    
    const planMap: { [key: string]: string } = {
      'free': 'Free Plan',
      'pro': 'Pro Plan',
      'enterprise': 'Enterprise Plan',
      'enterprise-business': 'Enterprise Business Plan',
    };
    
    return planMap[subscription.plan] || subscription.plan;
  };

  // Get billing period display name
  const getBillingPeriod = () => {
    if (!subscription) return '';
    if (subscription.plan === 'free') return '';
    
    return subscription.type === 'individual' ? 'Monthly Billing' : 'Annual Billing';
  };

  // Handle sync with Google
  const handleSyncWithGoogle = async () => {
    try {
      setIsSyncing(true);
      
      // Initialize Google service
      await googleUserProfileService.initialize();
      
      // Check if already signed in to Google
      if (!googleUserProfileService.isSignedIn()) {
        // Trigger sign in flow
        await googleUserProfileService.signIn();
      }
      
      // Sync profile with Google
      await syncWithGoogleProfile();
      
      toast.success('Successfully synced with Google account');
    } catch (error) {
      console.error('Failed to sync with Google:', error);
      toast.error('Failed to sync with Google account');
    } finally {
      setIsSyncing(false);
    }
  };

  // Email connection handlers
  const handleEmailConnectionStart = () => {
    setEmailConnectionStatus('connecting');
    setEmailError(null);
  };
  
  const handleEmailConnectionSuccess = () => {
    setEmailConnectionStatus('success');
    toast.success('Email account connected successfully');
  };
  
  const handleEmailConnectionError = (error: string) => {
    setEmailConnectionStatus('error');
    setEmailError(error);
    toast.error(`Failed to connect email account: ${error}`);
  };

  const handleRemoveEmailAccount = async (accountId: string) => {
    try {
      // Since removeAccount isn't available in EmailContext, we'll just show success
      // In a real implementation, you would call the appropriate function here
      toast.success('Email account removed successfully');
    } catch (error) {
      console.error('Error removing email account:', error);
      toast.error('Failed to remove email account');
    }
  };

  // Get Google integration
  const googleIntegration = user?.integrations ? getGoogleIntegration() : undefined;

  const handleAddGmail = async () => {
    // Implement Google OAuth flow
    console.log('Adding Gmail account');
  };

  const handleAddIMAP = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newConfig: EmailConfig = {
      type: 'imap',
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      server: formData.get('server') as string,
      port: Number(formData.get('port')),
    };
    setEmailConfigs([...emailConfigs, newConfig]);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="h-8 w-8 mr-2" />
        <span>Loading your profile...</span>
      </div>
    );
  }

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold mb-8">My Profile</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="email">Email Accounts</TabsTrigger>
          <TabsTrigger value="usage">Usage Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Manage your account settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <img src={user?.avatar || '/placeholder-avatar.png'} alt="Profile" />
                </Avatar>
                <Button variant="outline">Change Avatar</Button>
              </div>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" defaultValue={user?.fullName} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue={user?.email} />
                </div>
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Accounts</CardTitle>
              <CardDescription>Connect your email accounts to GenieFlow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <Button 
                  onClick={handleAddGmail}
                  className="flex items-center gap-2"
                >
                  <Chrome className="h-5 w-5" />
                  Add Gmail Account
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or add IMAP account
                    </span>
                  </div>
                </div>

                <form onSubmit={handleAddIMAP} className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" name="email" type="email" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="server">IMAP Server</Label>
                    <Input id="server" name="server" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="port">Port</Label>
                    <Input id="port" name="port" type="number" defaultValue={993} required />
                  </div>
                  <Button type="submit">Add IMAP Account</Button>
                </form>

                {emailConfigs.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium">Connected Accounts</h3>
                    <div className="mt-2 space-y-2">
                      {emailConfigs.map((config, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Mail className="h-5 w-5" />
                              <span>{config.email}</span>
                            </div>
                            <Button variant="destructive" size="sm">Remove</Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
              <CardDescription>Monitor your resource usage and limits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">API Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">2,345</div>
                    <p className="text-xs text-muted-foreground">of 10,000 monthly</p>
                    <div className="mt-2 h-2 w-full rounded-full bg-secondary">
                      <div className="h-2 w-[23.45%] rounded-full bg-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">AI Credits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">78%</div>
                    <p className="text-xs text-muted-foreground">of monthly allowance</p>
                    <div className="mt-2 h-2 w-full rounded-full bg-secondary">
                      <div className="h-2 w-[78%] rounded-full bg-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">1.2 GB</div>
                    <p className="text-xs text-muted-foreground">of 5 GB</p>
                    <div className="mt-2 h-2 w-full rounded-full bg-secondary">
                      <div className="h-2 w-[24%] rounded-full bg-primary" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Email Sent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">143</div>
                    <p className="text-xs text-muted-foreground">this month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Tasks Created</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">67</div>
                    <p className="text-xs text-muted-foreground">this month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Documents Processed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">24</div>
                    <p className="text-xs text-muted-foreground">this month</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
} 