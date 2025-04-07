import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAvatar } from '../lib/utils';
import { googleUserProfileService } from '../services/google/userProfileService';

// User and subscription types
export type SubscriptionTier = 'free' | 'pro' | 'enterprise' | 'free-business' | 'business' | 'enterprise-business';
export type SubscriptionType = 'individual' | 'business';

export interface UserSubscription {
  plan: SubscriptionTier;
  type: SubscriptionType;
  status: 'active' | 'inactive' | 'trialing' | 'canceled' | 'expired';
  currentPeriodEnd?: string; // ISO date string
  cancelAtPeriodEnd?: boolean;
}

// Add integration types
export interface IntegrationAccount {
  provider: 'google' | 'microsoft' | 'apple';
  email: string;
  connected: boolean;
  connectedAt: string; // ISO date string
  profilePictureUrl?: string;
  displayName?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  company?: string;
  role?: string;
  subscription: UserSubscription | null;
  // Add connected accounts
  integrations?: IntegrationAccount[];
}

// State interface
interface UserState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  authToken: string | null;
  subscription: UserSubscription | null;
  isLoading: boolean;
  
  // Actions
  setUser: (user: UserProfile | null) => void;
  setAuthToken: (token: string | null) => void;
  setSubscription: (subscription: UserSubscription | null) => void;
  login: (email: string, password: string) => Promise<UserProfile>;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  checkAuth: () => boolean;
  isSubscribed: () => boolean;
  hasProAccess: () => boolean;
  hasEnterpriseAccess: () => boolean;
  // Add new actions for Google integration
  syncWithGoogleProfile: () => Promise<void>;
  hasGoogleIntegration: () => boolean;
  getGoogleIntegration: () => IntegrationAccount | undefined;
  addIntegration: (integration: IntegrationAccount) => void;
  removeIntegration: (provider: string) => void;
}

// Create the store
export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      authToken: null,
      subscription: null,
      isLoading: false,
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setAuthToken: (token) => set({ authToken: token }),
      
      setSubscription: (subscription) => set({ subscription }),
      
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          // This is a mock implementation - in a real app this would call an API
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Mock a successful login
          const user: UserProfile = {
            id: '1',
            email,
            fullName: email.split('@')[0],
            avatar: getAvatar(email.split('@')[0]),
            subscription: null,
            integrations: []
          };
          
          // Mock JWT token (this would come from the server in a real app)
          const token = `mock_jwt_token_${Date.now()}`;
          
          set({
            user,
            authToken: token,
            isAuthenticated: true,
            isLoading: false,
            subscription: {
              plan: 'free',
              type: 'individual',
              status: 'active'
            }
          });
          
          return user;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      logout: () => {
        set({
          user: null,
          authToken: null,
          isAuthenticated: false,
          subscription: null
        });
      },
      
      updateProfile: (profile) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...profile } });
        }
      },
      
      checkAuth: () => {
        const { authToken } = get();
        return !!authToken;
      },
      
      isSubscribed: () => {
        const { subscription } = get();
        return !!subscription && subscription.status === 'active' && subscription.plan !== 'free' && subscription.plan !== 'free-business';
      },
      
      hasProAccess: () => {
        const { subscription } = get();
        return !!subscription && 
          subscription.status === 'active' && 
          ['pro', 'enterprise', 'business', 'enterprise-business'].includes(subscription.plan);
      },
      
      hasEnterpriseAccess: () => {
        const { subscription } = get();
        return !!subscription && 
          subscription.status === 'active' && 
          ['enterprise', 'enterprise-business'].includes(subscription.plan);
      },

      // New methods for Google integration
      syncWithGoogleProfile: async () => {
        try {
          set({ isLoading: true });
          const { user } = get();
          
          if (!user) {
            throw new Error('User not logged in');
          }

          // Check if Google service is initialized
          if (!googleUserProfileService.isSignedIn()) {
            // If not signed in, just return - we'll handle this in the UI
            set({ isLoading: false });
            return;
          }

          // Fetch Google profile
          const googleProfile = await googleUserProfileService.getUserProfile();
          
          // Check if we already have this integration
          const existingIntegrations = user.integrations || [];
          const googleIntegration = existingIntegrations.find(
            (integration) => integration.provider === 'google' && integration.email === googleProfile.email
          );

          if (googleIntegration) {
            // Update the existing integration
            const updatedIntegrations = existingIntegrations.map((integration) => {
              if (integration.provider === 'google' && integration.email === googleProfile.email) {
                return {
                  ...integration,
                  connected: true,
                  connectedAt: new Date().toISOString(),
                  profilePictureUrl: googleProfile.picture,
                  displayName: googleProfile.name
                };
              }
              return integration;
            });

            // Update the user profile, potentially with the Google avatar if none exists
            const updatedUser = {
              ...user,
              integrations: updatedIntegrations,
              // Only update avatar if not already set
              avatar: user.avatar || googleProfile.picture
            };

            set({ user: updatedUser, isLoading: false });
          } else {
            // Create a new integration
            const newIntegration: IntegrationAccount = {
              provider: 'google',
              email: googleProfile.email,
              connected: true,
              connectedAt: new Date().toISOString(),
              profilePictureUrl: googleProfile.picture,
              displayName: googleProfile.name
            };

            const updatedUser = {
              ...user,
              integrations: [...existingIntegrations, newIntegration],
              // Only update avatar if not already set
              avatar: user.avatar || googleProfile.picture
            };

            set({ user: updatedUser, isLoading: false });
          }
        } catch (error) {
          console.error('Failed to sync with Google profile:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      hasGoogleIntegration: () => {
        const { user } = get();
        if (!user || !user.integrations) return false;
        
        return user.integrations.some(
          (integration) => integration.provider === 'google' && integration.connected
        );
      },

      getGoogleIntegration: () => {
        const { user } = get();
        if (!user || !user.integrations) return undefined;
        
        return user.integrations.find(
          (integration) => integration.provider === 'google' && integration.connected
        );
      },

      addIntegration: (integration) => {
        const { user } = get();
        if (!user) return;

        const existingIntegrations = user.integrations || [];
        const updatedIntegrations = [
          ...existingIntegrations.filter(
            (i) => !(i.provider === integration.provider && i.email === integration.email)
          ),
          integration
        ];

        set({
          user: {
            ...user,
            integrations: updatedIntegrations
          }
        });
      },

      removeIntegration: (provider) => {
        const { user } = get();
        if (!user || !user.integrations) return;

        const updatedIntegrations = user.integrations.filter(
          (integration) => integration.provider !== provider
        );

        set({
          user: {
            ...user,
            integrations: updatedIntegrations
          }
        });
      }
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        user: state.user,
        authToken: state.authToken,
        subscription: state.subscription
      })
    }
  )
);

// Create user profile in store
const createUserProfile = (email: string, fullName?: string): UserProfile => {
  // Basic anonymous user
  let firstName = "";
  let lastName = "";
  
  // If we have a fullName, split it
  if (fullName) {
    const parts = fullName.split(' ');
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ') || '';
  }
  
  return {
    id: `user-${Math.random().toString(36).substring(2, 9)}`,
    email,
    fullName: fullName || email,
    firstName: firstName,
    lastName: lastName,
    avatar: getAvatar(fullName || email),
    subscription: null,
    integrations: []
  };
}; 