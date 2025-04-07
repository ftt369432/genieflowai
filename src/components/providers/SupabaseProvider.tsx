import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../../config/env';
import { useEffect, useState } from 'react';
import { SupabaseContext } from '../../contexts/SupabaseContext';
import { User, Session } from '@supabase/supabase-js';

export const SupabaseProvider = ({ children }: { children: React.ReactNode }) => {
  const { supabaseUrl, supabaseAnonKey } = getEnv();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Create a single instance of the Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <SupabaseContext.Provider value={{ supabase, user, session, loading }}>
      {children}
    </SupabaseContext.Provider>
  );
}; 