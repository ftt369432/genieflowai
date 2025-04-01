import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, CreditCard, LogOut, Shield, Calendar, Mail, Settings } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useUserStore } from '../stores/userStore';
import { logoutUser, isAuthenticated } from '../services/auth/authService';
import { PageContainer } from '../components/ui/ResponsiveContainer';
import { ResponsiveGrid, ResponsiveGridItem } from '../components/ui/ResponsiveGrid';
import { Spinner } from '../components/ui/Spinner';
import { getAvatar } from '../lib/utils';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, subscription, isAuthenticated: isAuth } = useUserStore();

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

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size={40} text="Loading your profile..." />
      </div>
    );
  }

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold mb-8">My Profile</h1>

      <ResponsiveGrid
        sm={1}
        md={1}
        lg={3}
        gap="gap-6"
      >
        {/* Left column - Profile info */}
        <ResponsiveGridItem span={1} lgSpan={1}>
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-4">
                <img
                  className="h-24 w-24 rounded-full border-4 border-white shadow-lg"
                  src={user.avatar || getAvatar(user.fullName)}
                  alt={user.fullName}
                />
              </div>
              <h2 className="text-xl font-semibold">{user.fullName}</h2>
              <p className="text-gray-500">{user.email}</p>
              {user.company && (
                <p className="text-gray-500 mt-1">{user.role || 'Employee'}, {user.company}</p>
              )}
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center text-gray-600">
                <Mail className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>Email Verified</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Shield className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>2FA Disabled</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Calendar className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>Member since {formatDate(new Date().toISOString())}</span>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <Button 
                variant="default" 
                className="w-full justify-start"
                onClick={() => navigate('/dashboard')}
              >
                <User className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleNavigateToSettings}
              >
                <Settings className="w-4 h-4 mr-2" />
                Account Settings
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </ResponsiveGridItem>

        {/* Right column - Subscription and usage info */}
        <ResponsiveGridItem span={1} lgSpan={2}>
          {/* Subscription info */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 flex-shrink-0" />
              Subscription Details
            </h2>

            {subscription ? (
              <div className="space-y-4">
                <ResponsiveGrid sm={1} md={2} gap="gap-4">
                  <div className="border border-gray-200 rounded-md p-4">
                    <div className="text-sm text-gray-500">Current Plan</div>
                    <div className="text-lg font-medium">{getPlanName()}</div>
                  </div>
                  <div className="border border-gray-200 rounded-md p-4">
                    <div className="text-sm text-gray-500">Billing Period</div>
                    <div className="text-lg font-medium">{getBillingPeriod()}</div>
                  </div>
                </ResponsiveGrid>

                <div className="border border-gray-200 rounded-md p-4">
                  <div className="text-sm text-gray-500">Subscription Status</div>
                  <div className="flex items-center">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      subscription.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></span>
                    <span className="text-lg font-medium capitalize">{subscription.status}</span>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-md p-4">
                  <div className="text-sm text-gray-500">Current Period End</div>
                  <div className="text-lg font-medium">
                    {subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : 'N/A'}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                  {subscription.plan !== 'enterprise' && subscription.plan !== 'enterprise-business' && (
                    <Button onClick={handleNavigateToSubscription}>
                      Upgrade Plan
                    </Button>
                  )}
                  {subscription.plan !== 'free' && (
                    <Button variant="outline">Cancel Subscription</Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center p-6">
                <p className="text-gray-500 mb-4">You don't have an active subscription yet.</p>
                <Button onClick={handleNavigateToSubscription}>
                  View Plans
                </Button>
              </div>
            )}
          </div>

          {/* Account usage */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 flex-shrink-0" />
              Account Usage
            </h2>

            <ResponsiveGrid sm={1} md={2} lg={3} gap="gap-4">
              <div className="border border-gray-200 rounded-md p-4">
                <div className="text-sm text-gray-500">Email Processing</div>
                <div className="mt-1 text-2xl font-semibold">243</div>
                <div className="text-xs text-gray-500">emails processed this month</div>
              </div>

              <div className="border border-gray-200 rounded-md p-4">
                <div className="text-sm text-gray-500">AI Assistance</div>
                <div className="mt-1 text-2xl font-semibold">128</div>
                <div className="text-xs text-gray-500">AI requests this month</div>
              </div>

              <div className="border border-gray-200 rounded-md p-4">
                <div className="text-sm text-gray-500">Document Analysis</div>
                <div className="mt-1 text-2xl font-semibold">35</div>
                <div className="text-xs text-gray-500">documents processed this month</div>
              </div>
            </ResponsiveGrid>
          </div>
        </ResponsiveGridItem>
      </ResponsiveGrid>
    </PageContainer>
  );
} 