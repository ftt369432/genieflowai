import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { useAuth } from '../hooks/useAuth';
import { useLoading } from '../hooks/useLoading';
import { useError } from '../hooks/useError';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useUserStore();
  const [error, setError] = React.useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const { withLoading } = useLoading();
  const { handleError } = useError();

  const from = (location.state as any)?.from?.pathname || '/tasks';

  const handleDemoLogin = () => {
    // Create a demo user
    setUser({
      id: 'demo-user',
      email: 'demo@example.com',
      name: 'Demo User'
    });
    navigate(from, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await withLoading(login({ email, password }));
    } catch (error) {
      handleError(error instanceof Error ? error : 'Failed to log in');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Access the Demo
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Try out our task management system with a demo account
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="mt-8 space-y-6">
          <button
            onClick={handleDemoLogin}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Access Demo
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                Protected by enterprise-grade security
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center text-sm">
            <Lock className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-gray-500 dark:text-gray-400">
              Your data is always safe and encrypted
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}