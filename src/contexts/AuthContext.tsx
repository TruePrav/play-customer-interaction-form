"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  sessionReady: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminRole = async (user: User | null) => {
    if (!user || !user.email) {
      setIsAdmin(false);
      return;
    }

    try {
      // Normalize email for comparison
      const userEmail = user.email.toLowerCase().trim();
      
      // First, ensure we have a valid session
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      if (!currentSession) {
        console.error('❌ No active session when checking admin role');
        console.error('Session error:', sessionError);
        console.error('User object:', user ? { email: user.email, id: user.id } : 'null');
        setIsAdmin(false);
        return;
      }
      
      // Log session info in production for debugging
      if (process.env.NODE_ENV === 'production') {
        console.log('🔐 Session check:', {
          hasSession: !!currentSession,
          userEmail: currentSession.user?.email,
          expiresAt: currentSession.expires_at,
        });
      }

      // Query all admin users (RLS policy allows authenticated users to read)
      // Then do case-insensitive comparison on the client side
      const { data, error, count } = await supabase
        .from('admin_users')
        .select('email', { count: 'exact' });

      if (error) {
        console.error('Admin check error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          status: (error as { status?: number }).status
        });
        
        // If RLS error, log helpful message
        if (error.code === 'PGRST116' || error.message?.includes('RLS') || error.message?.includes('policy')) {
          console.error('⚠️ RLS policy issue - make sure "Allow authenticated users to read admin_users" policy exists');
        }
        
        setIsAdmin(false);
        return;
      }

      // Check if data was returned
      if (!data) {
        console.error('Admin check: No data returned from query (null)');
        setIsAdmin(false);
        return;
      }

      // Log what we got for debugging
      console.log(`Admin check: Found ${data.length} admin users in database (query returned ${count ?? 'unknown'} total)`);
      
      // Check if user's email (case-insensitive) exists in admin list
      let isAdminUser = false;
      const emailComparisons: Array<{ adminEmail: string; matches: boolean }> = [];
      
      isAdminUser = data.some(
        admin => {
          const adminEmail = admin.email?.toLowerCase().trim() || '';
          const matches = adminEmail === userEmail;
          emailComparisons.push({ adminEmail, matches });
          return matches;
        }
      );
      
      // Log comparisons in production for debugging, or always in development
      if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development') {
        emailComparisons.forEach(({ adminEmail, matches }) => {
          console.log(`  Comparing: "${adminEmail}" === "${userEmail}" ? ${matches}`);
        });
      }

      setIsAdmin(isAdminUser);
      
      if (isAdminUser) {
        console.log('✅ Admin check successful for:', userEmail);
      } else {
        console.error('❌ Admin check failed - email not found in admin_users:', userEmail);
        console.error('Available admin emails:', data.map(a => a.email));
        console.error('Environment:', process.env.NODE_ENV);
        console.error('Supabase URL configured:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.error('User email from session:', user.email);
      }
    } catch (err) {
      console.error('Admin check exception:', err);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session - wait a bit for localStorage to be ready
    const initializeAuth = async () => {
      try {
        // Small delay to ensure localStorage is accessible
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
          // Don't block on error - still mark as ready and set loading to false
          setSessionReady(true);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setSessionReady(true); // Mark session as ready
        
        if (session?.user) {
          await checkAdminRole(session.user);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setSessionReady(true); // Still mark as ready even on error
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Add a safety timeout - if auth initialization takes too long, stop loading
    let timeoutFired = false;
    const timeoutId = setTimeout(() => {
      if (mounted && !timeoutFired) {
        timeoutFired = true;
        console.warn('Auth initialization timeout - forcing loading to false');
        setLoading(false);
        setSessionReady(true);
      }
    }, 10000); // 10 second timeout

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      setSessionReady(true); // Session state has changed, mark as ready
      
      // Handle password recovery - don't check admin role during password reset
      if (event === 'PASSWORD_RECOVERY') {
        // User is in password recovery mode, allow them to reset password
        setIsAdmin(false);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        // After password update or sign in, check admin role
        if (session?.user) {
          await checkAdminRole(session.user);
        } else {
          setIsAdmin(false);
        }
        setLoading(false);
      } else {
        // For other events, check admin role
        if (session?.user) {
          await checkAdminRole(session.user);
        } else {
          setIsAdmin(false);
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPasswordForEmail = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error, data } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    // After password update, check admin role again
    if (!error && data.user) {
      await checkAdminRole(data.user);
    }
    
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    sessionReady,
    signIn,
    signOut,
    resetPasswordForEmail,
    updatePassword,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
