"use client";

import { useAuth } from '@/contexts/AuthContext';
import LoginForm from './LoginForm';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, isAdmin, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  if (!isAdmin) {
    const handleSignOut = async () => {
      await signOut();
      // Force a page reload to reset state
      window.location.reload();
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-lg">
              <span className="text-2xl font-bold text-slate-700">P</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">PLAY Barbados</h1>
            <h2 className="text-xl font-semibold text-slate-200 mb-2">Access Denied</h2>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-6 text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Unauthorized Access</h3>
            <p className="text-gray-600 mb-4">
              You don&apos;t have admin privileges to access this page.
            </p>
            {user?.email && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-left">
                <p className="text-sm text-yellow-800">
                  <strong>Logged in as:</strong> {user.email}
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  This email is not in the admin_users table. Please contact your administrator to add this email to the admin_users table in Supabase.
                </p>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleSignOut}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold"
              >
                Try Again with Different Account
              </button>
              <button
                onClick={() => window.location.href = '/interactions'}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition-colors"
              >
                Go to Customer Form
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
