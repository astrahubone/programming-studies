import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth as useAuthHook } from '../hooks/api/useAuth';
import { useUser } from '../hooks/api/useUser';
import { supabase } from '../lib/supabase';

interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role?: 'admin' | 'user';
  is_active?: boolean;
}

interface AuthContextType {
  session: any | null;
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: { full_name?: string; avatar_url?: string }) => Promise<void>;
  disconnect: () => Promise<void>;
  isAdmin: boolean;
  hasActiveSubscription: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(true);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  const { login, register, logout } = useAuthHook();
  const { data: user, isLoading: userLoading, error: userError, refetch: refetchUser } = useUser();

  useEffect(() => {
    // Get initial session from Supabase
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        console.log('Initial session:', initialSession);
        
        if (initialSession) {
          setSession(initialSession);
          localStorage.setItem('sb-cbqwhkjttgkckhrdwhnx-auth-token', JSON.stringify(initialSession));
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        localStorage.removeItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
      } finally {
        setAuthInitialized(true);
        setLoading(false);
      }
    };

    getInitialSession();

    // Set up Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      
      if (session) {
        // Store session in localStorage when we have a valid session
        localStorage.setItem('sb-cbqwhkjttgkckhrdwhnx-auth-token', JSON.stringify(session));
        setSession(session);
        // Refetch user data when session changes
        setTimeout(() => {
          refetchUser();
        }, 100);
      } else {
        // Clear localStorage when session is null
        localStorage.removeItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
        setSession(null);
        setIsAdmin(false);
      }
      
      // Set loading to false after initial session is determined
      if (event === 'INITIAL_SESSION' || authInitialized) {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refetchUser, authInitialized]);

  useEffect(() => {
    if (userError?.response?.status === 401) {
      // Clear session if user data fetch fails with 401
      console.log('User fetch failed with 401, clearing session');
      setSession(null);
      localStorage.removeItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
      supabase.auth.signOut();
    }
  }, [userError]);

  useEffect(() => {
    if (user) {
      console.log('User data loaded:', user);
      setIsAdmin(user.role === 'admin' && user.is_active === true);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      // Use Supabase directly for authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      console.log('Sign in successful:', data);
      // Session will be set by onAuthStateChange
      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      // Use Supabase directly for registration
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        throw error;
      }

      console.log('Sign up successful:', data);
      // Session will be set by onAuthStateChange
      return data;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // Session will be cleared by onAuthStateChange
    } catch (error) {
      console.error('Sign out error:', error);
      // Clear session anyway
      localStorage.removeItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
      setSession(null);
      setIsAdmin(false);
    }
  };

  const updateProfile = async (data: { full_name?: string; avatar_url?: string }) => {
    // This will be handled by the API hook
    throw new Error('Not implemented');
  };

  const disconnect = async () => {
    await signOut();
    window.location.reload();
  };

  // Show loading while auth is initializing or user is loading
  const isLoading = loading || (session && userLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: user || null,
        signIn,
        signUp,
        signOut,
        updateProfile,
        disconnect,
        isAdmin,
        hasActiveSubscription,
        loading: isLoading,
      }}
    >
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