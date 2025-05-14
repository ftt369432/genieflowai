import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useSupabase } from '../providers/SupabaseProvider';

// Define a type for the mock authentication details
export type MockAuthDetails = {
  user: User;
  session: Session;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  setMockAuth: (details: MockAuthDetails) => void; // New function to set mock auth
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { supabase, clearSession: clearSupabaseSession } = useSupabase(); // Renamed to avoid conflict
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to set mock authentication details directly
  const setMockAuth = (details: MockAuthDetails) => {
    console.log('AuthContext: Setting mock auth details:', details);
    setUser(details.user);
    setSession(details.session);
    setIsLoading(false);
  };

  useEffect(() => {
    const getSession = async () => {
      setIsLoading(true);
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user || null);
      setIsLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('AuthContext: Auth state changed', event, 'New session:', newSession);
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          console.log('AuthContext: User set to null after SIGNED_OUT');
        } else if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          // Explicitly handle events that should result in a user object
          setSession(newSession);
          setUser(newSession?.user ?? null); // Use nullish coalescing for clarity
          console.log('AuthContext: User set to:', newSession?.user ?? null, 'after event:', event);
        } else {
          // For any other events, log them but maintain current user/session state unless explicitly cleared
          console.log('AuthContext: Unhandled auth event type:', event, 'Session:', newSession);
          // Potentially set user/session based on newSession if appropriate for unhandled events
          // For now, only update if it's a known user-setting event or sign out
        }
        setIsLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    try {
      console.log('AuthContext: Signing out');
      // Check if supabase.auth is available before calling signOut on it
      if (supabase && supabase.auth) {
        await supabase.auth.signOut();
      }
      setUser(null);
      setSession(null);
      clearSupabaseSession(); // Use the renamed function
      
      // Clear localStorage
      try {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('sb-bpczmzsozjlqxercmnyu-auth-token');
        sessionStorage.removeItem('supabase.auth.token');
      } catch (e) {
        console.error('Error clearing local storage:', e);
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut, setMockAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}