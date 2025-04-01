import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAvatar } from '../lib/utils';

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
            subscription: null
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
    subscription: null
  };
}; 