import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useSupabase } from '../providers/SupabaseProvider';
import { useNavigate } from 'react-router-dom';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { supabase, clearSession } = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        console.log('AuthContext: Auth state changed', event);
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
        } else {
          setSession(newSession);
          setUser(newSession?.user || null);
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
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      clearSession();
      
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
    <AuthContext.Provider value={{ user, session, isLoading, signOut }}>
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