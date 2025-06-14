import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth as useAuthHook } from '../hooks/api/useAuth';
import { useUser } from '../hooks/api/useUser';

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
    // Get initial session from localStorage
    try {
      const token = localStorage.getItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
      if (token) {
        const parsedToken = JSON.parse(token);
        setSession(parsedToken);
      }
    } catch (error) {
      // If token is invalid JSON, remove it
      localStorage.removeItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
    }
    setLoading(false);
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
      localStorage.setItem('sb-cbqwhkjttgkckhrdwhnx-auth-token', JSON.stringify(result.session));
      setSession(result.session);
    } catch (error) {
      localStorage.removeItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const result = await register.mutateAsync({ email, password, fullName });
      localStorage.setItem('sb-cbqwhkjttgkckhrdwhnx-auth-token', JSON.stringify(result.session));
      setSession(result.session);
    } catch (error) {
      localStorage.removeItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await logout.mutateAsync();
    } finally {
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
    window.localStorage.clear();
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