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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(true);
  const [loading, setLoading] = useState(true);

  const { login, register, logout } = useAuthHook();
  const { data: user, isLoading: userLoading, error: userError } = useUser();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          localStorage.removeItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
        } else if (session) {
          localStorage.setItem('sb-cbqwhkjttgkckhrdwhnx-auth-token', JSON.stringify(session));
          setSession(session);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        localStorage.removeItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Set up Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      
      if (session) {
        // Store session in localStorage when we have a valid session
        localStorage.setItem('sb-cbqwhkjttgkckhrdwhnx-auth-token', JSON.stringify(session));
        setSession(session);
      } else {
        // Clear localStorage when session is null
        localStorage.removeItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
        setSession(null);
        setIsAdmin(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (userError?.response?.status === 401) {
      // Clear session if user data fetch fails with 401
      setSession(null);
      localStorage.removeItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
    }
  }, [userError]);

  useEffect(() => {
    if (user) {
      setIsAdmin(user.role === 'admin' && user.is_active === true);
    }
  }, [user]);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await login.mutateAsync({ email, password });
      // The onAuthStateChange will handle session updates
      return result;
    } catch (error) {
      // Clear any stale session data on login failure
      localStorage.removeItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
      setSession(null);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const result = await register.mutateAsync({ email, password, fullName });
      // The onAuthStateChange will handle session updates
      return result;
    } catch (error) {
      // Clear any stale session data on signup failure
      localStorage.removeItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
      setSession(null);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await logout.mutateAsync();
      // The onAuthStateChange will handle session clearing
    } catch (error) {
      // Even if logout fails, clear local session
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

  if (loading || userLoading) {
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