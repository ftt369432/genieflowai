import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Optional: Add a logo or app name here */}
        {/* <div className="mb-8 text-center">
          <img src="/logo.png" alt="App Logo" className="w-32 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">App Name</h1>
        </div> */}
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8">
          {children}
        </div>
        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          {/* Optional: Footer links like terms of service or back to website */}
          {/* <a href="/" className="hover:underline">Back to homepage</a> */}
        </p>
      </div>
    </div>
  );
};

export default AuthLayout; 