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
  const [initialized, setInitialized] = useState(false);

  const { login, register, logout } = useAuthHook();
  const { data: user, isLoading: userLoading, error: userError, refetch: refetchUser } = useUser();

  // Function to check if we have a valid token
  const hasValidToken = () => {
    try {
      const token = localStorage.getItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
      if (!token) return false;
      
      const parsedToken = JSON.parse(token);
      return !!(parsedToken?.access_token);
    } catch {
      return false;
    }
  };

  // Initialize session from localStorage on app start
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('AuthContext: Initializing auth...');
      
      try {
        // First check localStorage for existing token
        const storedToken = localStorage.getItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
        console.log('AuthContext: Stored token found:', !!storedToken);
        
        if (storedToken) {
          try {
            const parsedToken = JSON.parse(storedToken);
            console.log('AuthContext: Parsed token valid:', !!parsedToken?.access_token);
            
            if (parsedToken?.access_token) {
              // Set session immediately from stored token
              setSession(parsedToken);
              console.log('AuthContext: Session set from stored token');
              
              // Try to fetch user data to validate the token
              try {
                console.log('AuthContext: Validating token by fetching user...');
                await refetchUser();
                console.log('AuthContext: Token validation successful');
              } catch (error) {
                console.error('AuthContext: Token validation failed:', error);
                // If token is invalid, clear it
                localStorage.removeItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
                setSession(null);
              }
            }
          } catch (parseError) {
            console.error('AuthContext: Error parsing stored token:', parseError);
            localStorage.removeItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
          }
        }

        // Also check Supabase session
        const { data: { session: supabaseSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('AuthContext: Error getting Supabase session:', error);
        } else if (supabaseSession && !session) {
          console.log('AuthContext: Got session from Supabase:', !!supabaseSession);
          localStorage.setItem('sb-cbqwhkjttgkckhrdwhnx-auth-token', JSON.stringify(supabaseSession));
          setSession(supabaseSession);
        }
      } catch (error) {
        console.error('AuthContext: Error in initializeAuth:', error);
      } finally {
        setInitialized(true);
        setLoading(false);
        console.log('AuthContext: Auth initialization completed');
      }
    };

    initializeAuth();
  }, [refetchUser]);

  // Set up Supabase auth state listener after initialization
  useEffect(() => {
    if (!initialized) return;

    console.log('AuthContext: Setting up auth state listener...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, supabaseSession) => {
      console.log('AuthContext: Auth state changed:', event, !!supabaseSession);
      
      if (supabaseSession) {
        // Store session in localStorage when we have a valid session
        localStorage.setItem('sb-cbqwhkjttgkckhrdwhnx-auth-token', JSON.stringify(supabaseSession));
        setSession(supabaseSession);
        console.log('AuthContext: Session updated from auth state change');
        
        // Refetch user data when session changes
        try {
          console.log('AuthContext: Refetching user data...');
          await refetchUser();
        } catch (error) {
          console.error('AuthContext: Error refetching user data:', error);
        }
      } else {
        // Clear localStorage when session is null
        localStorage.removeItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
        setSession(null);
        setIsAdmin(false);
        console.log('AuthContext: Session cleared');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialized, refetchUser]);

  useEffect(() => {
    if (userError?.response?.status === 401) {
      console.log('AuthContext: User fetch failed with 401, clearing session');
      // Clear session if user data fetch fails with 401
      setSession(null);
      localStorage.removeItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
    }
  }, [userError]);

  useEffect(() => {
    if (user) {
      console.log('AuthContext: User data loaded:', { id: user.id, role: user.role, isActive: user.is_active });
      setIsAdmin(user.role === 'admin' && user.is_active === true);
    } else {
      console.log('AuthContext: No user data');
      setIsAdmin(false);
    }
  }, [user]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('AuthContext: Starting sign in process...');
      
      const result = await login.mutateAsync({ email, password });
      console.log('AuthContext: Login mutation completed');
      
      // The login mutation should have stored the token, now set the session
      const storedToken = localStorage.getItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
      if (storedToken) {
        try {
          const parsedToken = JSON.parse(storedToken);
          if (parsedToken?.access_token) {
            setSession(parsedToken);
            console.log('AuthContext: Session set after login');
          }
        } catch (error) {
          console.error('AuthContext: Error parsing token after login:', error);
        }
      }
      
      // Wait for the auth state to update and user data to be fetched
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Check if we have both session and user data
        if (hasValidToken()) {
          console.log('AuthContext: Token found, refetching user...');
          try {
            const userResult = await refetchUser();
            if (userResult.data) {
              console.log('AuthContext: User data fetched successfully');
              break;
            }
          } catch (error) {
            console.error('AuthContext: Error refetching user:', error);
          }
        }
        
        attempts++;
        console.log(`AuthContext: Waiting for auth state... attempt ${attempts}/${maxAttempts}`);
      }
      
      return result;
    } catch (error) {
      console.error('AuthContext: Sign in error:', error);
      // Clear any stale session data on login failure
      localStorage.removeItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
      setSession(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      const result = await register.mutateAsync({ email, password, fullName });
      
      // Wait a bit for the auth state to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return result;
    } catch (error) {
      // Clear any stale session data on signup failure
      localStorage.removeItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
      setSession(null);
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await logout.mutateAsync();
      // The onAuthStateChange will handle session clearing
    } catch (error) {
      // Even if logout fails, clear local session
      localStorage.removeItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
      setSession(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
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

  // Only show loading if we haven't initialized yet or if we're actively loading user data
  const contextLoading = !initialized || (session && userLoading);

  console.log('AuthContext: Current state:', {
    session: !!session,
    user: !!user,
    loading: contextLoading,
    isAdmin,
    userLoading,
    authLoading: loading,
    hasValidToken: hasValidToken(),
    initialized
  });

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
        loading: contextLoading,
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