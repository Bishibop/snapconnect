import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';
import { cache } from '../utils/cache';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      
      setSession(currentSession => {
        // Clear cache when user logs out for security
        if (currentSession && !newSession) {
          // User logged out - clear all cached data
          cache.clearAll();
        } else if (!currentSession && newSession) {
          // User logged in - clear any stale cache from previous session
          cache.clearAll();
        } else if (currentSession?.user?.id !== newSession?.user?.id) {
          // Different user - clear previous user's cache
          if (currentSession?.user?.id) {
            cache.clearUser(currentSession.user.id);
          }
        }
        
        return newSession;
      });
    });

    return () => subscription.unsubscribe();
  }, []); // Remove session dependency - we don't need it

  const signUp = async (email: string, password: string, username: string) => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });

      if (error) throw error;

      Alert.alert('Success', 'Check your email for verification!');
    } catch (error: unknown) {
      Alert.alert('Error', error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: unknown) {
      Alert.alert('Error', error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);

      // Clear cache before signing out for security
      if (session?.user?.id) {
        cache.clearUser(session.user.id);
      } else {
        cache.clearAll();
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: unknown) {
      Alert.alert('Error', error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  const value = React.useMemo(() => ({
    session,
    user: session?.user ?? null,
    loading,
    signUp,
    signIn,
    signOut,
  }), [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
