import { useUserStore, UserProfile, UserSubscription, SubscriptionTier } from '../../stores/userStore';
import { getAvatar } from '../../lib/utils';
import { getEnv } from '../../config/env';
import { useSupabase } from '../../providers/SupabaseProvider';

// Global reference to the Supabase setter for mock mode
// This is a workaround since we can't use hooks in regular functions
let _setMockUserFn: ((userData: { id: string, email: string, fullName?: string }) => void) | null = null;

// Helper function to register the setter
export const registerSupabaseUserSetter = (setterFn: (userData: { id: string, email: string, fullName?: string }) => void) => {
  _setMockUserFn = setterFn;
  console.log('Registered Supabase mock user setter');
};

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  plan?: string; // Optional plan selection
}

// Auth error class for better error handling
export class AuthError extends Error {
  code: string;
  
  constructor(message: string, code: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

// Error codes
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'auth/invalid-credentials',
  EMAIL_IN_USE: 'auth/email-already-in-use',
  WEAK_PASSWORD: 'auth/weak-password',
  INVALID_EMAIL: 'auth/invalid-email',
  USER_NOT_FOUND: 'auth/user-not-found',
  NETWORK_ERROR: 'auth/network-error',
  TOO_MANY_REQUESTS: 'auth/too-many-requests',
  UNAUTHORIZED: 'auth/unauthorized',
  UNKNOWN: 'auth/unknown-error',
};

// Mock user data for demo purposes
const MOCK_USERS = [
  {
    id: '1',
    email: 'demo@genieflowai.com',
    password: 'demo123', // In a real app, passwords would be hashed
    firstName: 'Demo',
    lastName: 'User',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    id: '2',
    email: 'enterprise@genieflowai.com',
    password: 'enterprise123',
    firstName: 'Enterprise',
    lastName: 'User',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    company: 'GenieFlow Inc.',
    jobTitle: 'CEO'
  }
];

// Mock subscription data
const MOCK_SUBSCRIPTIONS: Record<string, Omit<UserSubscription, 'id'>> = {
  '1': {
    plan: 'pro',
    type: 'individual',
    status: 'active',
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
  },
  '2': {
    plan: 'enterprise-business',
    type: 'business',
    status: 'active',
    currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
  }
};

// Generate a mock JWT token
const generateToken = (userId: string): string => {
  // In a real app, this would be a proper JWT token
  return `mock-jwt-token-${userId}-${Date.now()}`;
};

// Simulate a network request with potential failure
const simulateRequest = async <T>(data: T, failureRate = 0.1): Promise<T> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
  
  // Randomly fail to simulate network issues (10% chance by default)
  if (Math.random() < failureRate) {
    throw new AuthError('Network error. Please check your connection and try again.', AUTH_ERROR_CODES.NETWORK_ERROR);
  }
  
  return data;
};

// Convert mock user to UserProfile format
const convertToUserProfile = (user: typeof MOCK_USERS[0]): UserProfile => {
  // Get subscription if available
  const subscription = MOCK_SUBSCRIPTIONS[user.id] || null;
  
  return {
    id: user.id,
    email: user.email,
    fullName: `${user.firstName} ${user.lastName}`,
    avatar: user.avatar,
    company: 'company' in user ? user.company : undefined,
    role: 'jobTitle' in user ? user.jobTitle : undefined,
    subscription: subscription
  };
};

// Login user
export const loginUser = async ({ email, password }: LoginCredentials): Promise<{ token: string; user: UserProfile }> => {
  try {
    // Get environment configuration
    const { useMock } = getEnv();
    
    // Basic validation
    if (!email) {
      throw new AuthError('Email is required', AUTH_ERROR_CODES.INVALID_EMAIL);
    }
    
    if (!password) {
      throw new AuthError('Password is required', AUTH_ERROR_CODES.INVALID_CREDENTIALS);
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AuthError('Invalid email format', AUTH_ERROR_CODES.INVALID_EMAIL);
    }
    
    let user;
    
    // In mock mode, create a mock user based on the provided email
    if (useMock) {
      console.log('Using mock authentication for login:', email);
      
      // Always succeed in mock mode using the provided email
      user = {
        id: `mock-${Math.random().toString(36).substring(2, 9)}`,
        email: email,
        password: password, // Not used for validation in mock mode
        firstName: 'Mock',
        lastName: 'User',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=random`
      };
      
      // Set the mock user in Supabase context if the setter is available
      if (_setMockUserFn) {
        _setMockUserFn({
          id: user.id,
          email: user.email,
          fullName: `${user.firstName} ${user.lastName}`
        });
        console.log('Updated Supabase context with mock user');
      } else {
        console.warn('Unable to update Supabase context: setter not registered');
      }
    } else {
      // Real authentication - find user with matching credentials
      user = MOCK_USERS.find(u => u.email === email && u.password === password);
      
      if (!user) {
        // Check if it's an email issue or password issue (better UX with specific errors)
        const userExists = MOCK_USERS.some(u => u.email === email);
        if (userExists) {
          throw new AuthError('Invalid password', AUTH_ERROR_CODES.INVALID_CREDENTIALS);
        } else {
          throw new AuthError('No account found with this email', AUTH_ERROR_CODES.USER_NOT_FOUND);
        }
      }
    }
    
    // Simulate network request that might fail (skip in mock mode or reduce failure rate)
    await simulateRequest(null, useMock ? 0 : 0.1);
    
    // Convert to UserProfile format
    const userProfile = convertToUserProfile(user);
    
    // In mock mode, ensure we have a subscription
    if (useMock && !userProfile.subscription) {
      userProfile.subscription = {
        plan: 'pro',
        type: 'individual',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
    }
    
    // Generate token
    const token = generateToken(user.id);
    
    // Update user store
    useUserStore.getState().setUser(userProfile);
    useUserStore.getState().setAuthToken(token);
    
    if (userProfile.subscription) {
      useUserStore.getState().setSubscription(userProfile.subscription);
    }
    
    console.log('Login successful for user:', userProfile.email);
    return { token, user: userProfile };
  } catch (error) {
    // If it's already an AuthError, rethrow it
    if (error instanceof AuthError) {
      throw error;
    }
    
    // Otherwise wrap it in an AuthError
    console.error('Login error:', error);
    throw new AuthError(
      error instanceof Error ? error.message : 'An unexpected error occurred during login',
      AUTH_ERROR_CODES.UNKNOWN
    );
  }
};

// Register new user
export const registerUser = async (data: RegisterData): Promise<{ token: string; user: UserProfile }> => {
  try {
    // Get environment configuration
    const { useMock } = getEnv();
    
    // Basic validation
    if (!data.email || !data.password || !data.firstName || !data.lastName) {
      throw new AuthError('All fields are required', AUTH_ERROR_CODES.INVALID_CREDENTIALS);
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new AuthError('Invalid email format', AUTH_ERROR_CODES.INVALID_EMAIL);
    }
    
    // Password strength validation
    if (data.password.length < 6) {
      throw new AuthError('Password should be at least 6 characters', AUTH_ERROR_CODES.WEAK_PASSWORD);
    }
    
    // In non-mock mode, check if email exists
    if (!useMock && MOCK_USERS.some(u => u.email === data.email)) {
      throw new AuthError('Email already in use', AUTH_ERROR_CODES.EMAIL_IN_USE);
    }
    
    // Simulate network request with reduced failure rate in mock mode
    await simulateRequest(null, useMock ? 0 : 0.1);
    
    // Create new user
    const newUser = {
      id: `user-${Math.random().toString(36).substring(2, 9)}`,
      email: data.email,
      fullName: `${data.firstName} ${data.lastName}`,
      avatar: getAvatar(`${data.firstName} ${data.lastName}`),
      company: 'company' in MOCK_USERS[0] ? MOCK_USERS[0].company : undefined,
      role: 'jobTitle' in MOCK_USERS[0] ? MOCK_USERS[0].jobTitle : undefined,
      subscription: null
    };
    
    // Create subscription for new user based on selected plan
    const planType = data.plan || 'free';
    // Ensure the plan is a valid SubscriptionTier
    const subscriptionPlan: SubscriptionTier = 
      ['free', 'pro', 'enterprise', 'free-business', 'business', 'enterprise-business'].includes(planType) 
        ? planType as SubscriptionTier 
        : 'free';
        
    const newSubscription: UserSubscription = {
      plan: subscriptionPlan,
      type: subscriptionPlan.includes('business') ? 'business' : 'individual',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
    };
    
    // Generate token
    const token = generateToken(newUser.id);
    
    // Convert to UserProfile format
    const userProfile: UserProfile = {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      avatar: newUser.avatar,
      company: newUser.company,
      role: newUser.role,
      subscription: newUser.subscription
    };
    
    // Update user store
    useUserStore.getState().setUser(userProfile);
    useUserStore.getState().setAuthToken(token);
    useUserStore.getState().setSubscription(newSubscription);
    
    console.log('Registration successful for user:', userProfile.email);
    return { token, user: userProfile };
  } catch (error) {
    // If it's already an AuthError, rethrow it
    if (error instanceof AuthError) {
      throw error;
    }
    
    // Otherwise wrap it in an AuthError
    console.error('Registration error:', error);
    throw new AuthError(
      error instanceof Error ? error.message : 'An unexpected error occurred during registration',
      AUTH_ERROR_CODES.UNKNOWN
    );
  }
};

// Logout user
export const logoutUser = (): void => {
  useUserStore.getState().logout();
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const { authToken } = useUserStore.getState();
  return !!authToken;
};

// Get current user
export const getCurrentUser = (): UserProfile | null => {
  return useUserStore.getState().user;
};

// Get JWT token
export const getAuthToken = (): string | undefined => {
  const token = useUserStore.getState().authToken;
  return token || undefined;
}; 