import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../hooks/useTheme';
import { useEmail } from '../../contexts/EmailContext';
import { IMAPConfigForm } from '../email/IMAPConfigForm';
import { EmailService } from '../../services/email';
import { googleAuthService } from '../../services/auth/googleAuth';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsMenu({ isOpen, onClose }: SettingsMenuProps) {
  const { theme, setTheme } = useTheme();
  const { accounts, addAccount, removeAccount, loading, error } = useEmail();
  const [activeTab, setActiveTab] = useState('appearance');
  const [showIMAPForm, setShowIMAPForm] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      await googleAuthService.initialize();
      setIsAuthenticated(googleAuthService.isSignedIn());
    };
    checkAuth();
  }, []);

  const handleLogin = () => {
    try {
      const authUrl = googleAuthService.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await googleAuthService.signOut();
      setIsAuthenticated(false);
      // Remove Google account after logout
      const googleAccount = accounts.find(acc => acc.type === 'google');
      if (googleAccount) {
        await removeAccount(googleAccount.id);
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleIMAPSubmit = async (config: any) => {
    try {
      const account = await EmailService.addIMAPAccount(config);
      addAccount(account);
      setShowIMAPForm(false);
    } catch (error) {
      console.error('Failed to add IMAP account:', error);
    }
  };

  const handleRemoveAccount = async (accountId: string) => {
    try {
      await removeAccount(accountId);
      const account = accounts.find(acc => acc.id === accountId);
      if (account?.type === 'google') {
        await handleLogout();
      }
    } catch (error) {
      console.error('Failed to remove account:', error);
    }
  };

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
        onClose={onClose}
      >
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block w-full max-w-2xl p-6 my-8 text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
              <div className="flex justify-between items-center mb-4">
                <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
                  Settings
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="flex">
                {/* Sidebar */}
                <div className="w-48 border-r border-gray-200 dark:border-gray-700">
                  <nav className="space-y-1">
                    <button
                      onClick={() => setActiveTab('appearance')}
                      className={`w-full text-left px-3 py-2 rounded-md ${
                        activeTab === 'appearance'
                          ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Appearance
                    </button>
                    <button
                      onClick={() => setActiveTab('email')}
                      className={`w-full text-left px-3 py-2 rounded-md ${
                        activeTab === 'email'
                          ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Email Accounts
                    </button>
                    <button
                      onClick={() => setActiveTab('preferences')}
                      className={`w-full text-left px-3 py-2 rounded-md ${
                        activeTab === 'preferences'
                          ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Preferences
                    </button>
                  </nav>
                </div>

                {/* Content */}
                <div className="flex-1 pl-6">
                  {activeTab === 'appearance' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Theme
                      </h3>
                      <div className="space-y-2">
                        <button
                          onClick={() => setTheme('light')}
                          className={`w-full text-left px-3 py-2 rounded-md ${
                            theme === 'light'
                              ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          Light
                        </button>
                        <button
                          onClick={() => setTheme('dark')}
                          className={`w-full text-left px-3 py-2 rounded-md ${
                            theme === 'dark'
                              ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          Dark
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'email' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Email Accounts
                      </h3>

                      {error && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-md">
                          {error}
                        </div>
                      )}
                      
                      {loading ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading accounts...</p>
                        </div>
                      ) : (
                        <>
                          {/* Connected accounts */}
                          {accounts.length > 0 && (
                            <div className="space-y-3">
                              {accounts.map(account => (
                                <div
                                  key={account.id}
                                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      {account.email}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {account.type === 'google' ? 'Google Account' : 'IMAP'}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveAccount(account.id)}
                                    className="text-red-600 hover:text-red-700 text-sm"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add account buttons */}
                          <div className="space-y-2">
                            {isAuthenticated ? (
                              <button
                                onClick={handleLogout}
                                className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                              >
                                Sign Out of Google
                              </button>
                            ) : (
                              <button
                                onClick={handleLogin}
                                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                              >
                                Sign In with Google
                              </button>
                            )}
                            <button
                              onClick={() => setShowIMAPForm(true)}
                              className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md"
                            >
                              Add Other Email Account
                            </button>
                          </div>

                          {/* IMAP Configuration Form */}
                          {showIMAPForm && (
                            <IMAPConfigForm
                              onSubmit={handleIMAPSubmit}
                              onCancel={() => setShowIMAPForm(false)}
                            />
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {activeTab === 'preferences' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Preferences
                      </h3>
                      {/* Add preferences settings here */}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}