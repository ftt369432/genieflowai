import React, { useEffect } from 'react';
import { useUserStore } from '../stores/userStore';
import { getEnv } from '../config/env';
import { getAvatar } from '../lib/utils';

export function Profile() {
  const { user } = useUserStore();
  const { useMock } = getEnv();

  useEffect(() => {
    console.log('Profile component mounted');
    console.log('User data:', user);
    console.log('Mock mode:', useMock);
  }, [user, useMock]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-4 sm:mb-0 sm:mr-6 border-2 border-gray-200 dark:border-gray-700">
            <img 
              src={user?.avatar || getAvatar(user?.fullName || 'User')} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {user?.fullName || 'User'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {user?.email || 'email@example.com'}
            </p>
            
            <div className="mt-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                {user?.subscription?.plan || 'Free'} Plan
              </span>
              
              {user?.subscription?.status && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                  {user?.subscription?.status}
                </span>
              )}
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
                  You are viewing mock profile data. Connect with Google to see your real profile.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Account Details</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Member Since
            </label>
            <div className="text-gray-900 dark:text-gray-100">
              {new Date().toLocaleDateString()}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Last Login
            </label>
            <div className="text-gray-900 dark:text-gray-100">
              {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 