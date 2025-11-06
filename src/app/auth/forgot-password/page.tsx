"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { resetPasswordForEmail } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error } = await resetPasswordForEmail(email);
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setEmail('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-lg">
            <span className="text-2xl font-bold text-slate-700">P</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">PLAY Barbados</h1>
          <h2 className="text-xl font-semibold text-slate-200 mb-2">Reset Password</h2>
          <p className="text-slate-300">Enter your email to receive a password reset link</p>
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
                    <h3 className="text-green-800 font-semibold mb-1">Check your email</h3>
                    <p className="text-green-700 text-sm">
                      We&apos;ve sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.
                    </p>
                  </div>
                </div>
              </div>
              <Link href="/admin">
                <Button
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white rounded-xl"
                >
                  Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-lg font-semibold text-gray-800">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@playbarbados.com"
                  className="h-14 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 mt-2"
                  required
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
                    Sending reset link...
                  </div>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <div className="text-center">
                <Link 
                  href="/admin" 
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

