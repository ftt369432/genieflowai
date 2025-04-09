import React, { useEffect } from 'react';
import { useUserStore } from '../stores/userStore';
import { getEnv } from '../config/env';

export function Settings() {
  const { user } = useUserStore();
  const { useMock } = getEnv();

  useEffect(() => {
    console.log('Settings component mounted');
    console.log('User data:', user);
    console.log('Mock mode:', useMock);
  }, [user, useMock]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">User Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <div className="text-gray-900 dark:text-gray-100">
              {user?.fullName || 'Not set'}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <div className="text-gray-900 dark:text-gray-100">
              {user?.email || 'Not set'}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subscription Plan
            </label>
            <div className="text-gray-900 dark:text-gray-100">
              {user?.subscription?.plan || 'Free'} 
              {user?.subscription?.status ? ` (${user?.subscription?.status})` : ''}
            </div>
          </div>
        </div>
      </div>
      
      {useMock && (
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Mock Mode Active
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>
                  You are currently in mock mode. Settings changes will not be persisted.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Application Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Theme
            </label>
            <select 
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              disabled={true}
            >
              <option>System Default</option>
              <option>Light</option>
              <option>Dark</option>
            </select>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Theme selection coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 