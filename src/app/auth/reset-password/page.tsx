"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const { updatePassword, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if we have a valid session for password reset
    // Supabase sets a session when the reset link is clicked
    const checkSession = async () => {
      // Check URL params for error first
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      
      if (errorParam) {
        setError(errorDescription?.replace(/\+/g, ' ') || 'Invalid or expired reset link');
        setIsValidSession(false);
        return;
      }

      // Wait a bit for auth state to initialize, then check for user
      const timeout = setTimeout(() => {
        if (user) {
          setIsValidSession(true);
        } else {
          // Check hash params (Supabase sometimes uses hash instead of query params)
          const hash = window.location.hash;
          if (hash.includes('error')) {
            const hashParams = new URLSearchParams(hash.substring(1));
            const hashError = hashParams.get('error_description');
            setError(hashError?.replace(/\+/g, ' ') || 'Invalid or expired reset link');
          } else {
            setError('Invalid or expired reset link. Please request a new password reset.');
          }
          setIsValidSession(false);
        }
      }, 1000);

      return () => clearTimeout(timeout);
    };

    checkSession();
  }, [user, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const { error } = await updatePassword(password);
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        // Wait a bit for admin check to complete, then redirect
        setTimeout(() => {
          router.push('/admin');
        }, 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (isValidSession === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-6 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-lg">
              <span className="text-2xl font-bold text-slate-700">P</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">PLAY Barbados</h1>
            <h2 className="text-xl font-semibold text-slate-200 mb-2">Reset Password</h2>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-start">
                <div className="text-red-600 mr-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-red-800 font-semibold mb-1">Invalid Reset Link</h3>
                  <p className="text-red-700 text-sm">{error || 'This password reset link is invalid or has expired.'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link href="/auth/forgot-password">
                <Button
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white rounded-xl"
                >
                  Request New Reset Link
                </Button>
              </Link>
              <Link href="/admin">
                <Button
                  variant="outline"
                  className="w-full h-14 text-lg font-semibold rounded-xl"
                >
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-lg">
            <span className="text-2xl font-bold text-slate-700">P</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">PLAY Barbados</h1>
          <h2 className="text-xl font-semibold text-slate-200 mb-2">Set New Password</h2>
          <p className="text-slate-300">Enter your new password below</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6">
          {success ? (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start">
                  <div className="text-green-600 mr-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-green-800 font-semibold mb-1">Password Updated</h3>
                    <p className="text-green-700 text-sm">
                      Your password has been successfully updated. Redirecting to login...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="password" className="text-lg font-semibold text-gray-800">
                  New Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="h-14 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 mt-2"
                  required
                  minLength={6}
                />
                <p className="text-sm text-gray-500 mt-1">Must be at least 6 characters</p>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-lg font-semibold text-gray-800">
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="h-14 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 mt-2"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-16 text-lg font-bold bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating password...
                  </div>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-2xl p-6 text-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
