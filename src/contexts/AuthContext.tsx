"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
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
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminRole = async (user: User | null) => {
    if (!user || !user.email) {
      setIsAdmin(false);
      return;
    }

    try {
      // Normalize email for comparison
      const userEmail = user.email.toLowerCase().trim();
      
      // Query all admin users and check if email matches (case-insensitive)
      const { data, error } = await supabase
        .from('admin_users')
        .select('email');

      if (error) {
        console.error('Admin check error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setIsAdmin(false);
        return;
      }

      // Check if user's email (case-insensitive) exists in admin list
      const isAdminUser = data?.some(
        admin => admin.email?.toLowerCase().trim() === userEmail
      ) ?? false;

      setIsAdmin(isAdminUser);
      
      if (isAdminUser) {
        console.log('Admin check successful for:', userEmail);
      } else {
        console.log('Admin check failed - email not found:', userEmail);
        console.log('Available admin emails:', data?.map(a => a.email));
      }
    } catch (err) {
      console.error('Admin check exception:', err);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      checkAdminRole(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Handle password recovery - don't check admin role during password reset
      if (event === 'PASSWORD_RECOVERY') {
        // User is in password recovery mode, allow them to reset password
        setIsAdmin(false);
      } else if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        // After password update or sign in, check admin role
        if (session?.user) {
          await checkAdminRole(session.user);
        }
      } else {
        checkAdminRole(session?.user ?? null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
