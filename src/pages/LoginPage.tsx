/**
 * Main LoginPage component - This is the preferred login page implementation
 * that should be used throughout the application.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { loginUser, registerUser, AuthError, AUTH_ERROR_CODES } from '../services/auth/authService';
import { ResponsiveContainer } from '../components/ui/ResponsiveContainer';
import { useBreakpoint } from '../utils/responsive';
import { useNotify } from '../utils/notification';
import { useSupabase } from '../providers/SupabaseProvider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { GoogleButton } from '../components/ui/GoogleButton';
import { getEnv } from '../config/env';

// Login page with toggle between login and register
const LoginPageContent = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const registerParam = queryParams.get('register');
  const planParam = queryParams.get('plan');
  
  const [isLogin, setIsLogin] = useState(!registerParam);
  const [selectedPlan, setSelectedPlan] = useState(planParam || 'free');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const notify = useNotify();
  const isDesktop = useBreakpoint('lg');
  const { user, loading, setMockUser } = useSupabase();
  const { useMock } = getEnv();

  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Field errors for validation feedback
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
  }>({});

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user && !loading) {
      console.log("User already authenticated, redirecting to dashboard");
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Update the form mode if the URL parameters change
    setIsLogin(!registerParam);
    if (planParam) {
      setSelectedPlan(planParam);
    }
  }, [registerParam, planParam]);

  // Clear loading state if component unmounts
  useEffect(() => {
    return () => {
      // This ensures the loading state is reset if the component unmounts
      setIsLoading(false);
    };
  }, []);

  const validateForm = () => {
    const errors: typeof fieldErrors = {};
    let isValid = true;

    // Validate email
    if (!email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email format';
      isValid = false;
    }

    // Validate password
    if (!password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (!isLogin && password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    // Validate name fields for registration
    if (!isLogin) {
      if (!firstName) {
        errors.firstName = 'First name is required';
        isValid = false;
      }
      if (!lastName) {
        errors.lastName = 'Last name is required';
        isValid = false;
      }
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent submission if already loading
    if (isLoading) return;
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    // Set a safety timeout to prevent infinite loading state
    const safetyTimer = setTimeout(() => {
      console.log("Safety timeout triggered, resetting loading state");
      setIsLoading(false);
    }, 10000);
    
    try {
      if (isLogin) {
        // Login user
        console.log("Attempting to log in with:", email);
        const result = await loginUser({ email, password });
        console.log("Login successful, user data received");
        
        // Set the user in Supabase context for protected routes
        if (result && result.user) {
          setMockUser({
            id: result.user.id,
            email: result.user.email,
            fullName: `${result.user.firstName} ${result.user.lastName}`
          });
        }
        
        notify.success('Welcome back!', 'You have successfully logged in');
        navigate('/dashboard', { replace: true });
      } else {
        // Register user with selected plan
        console.log("Attempting to register with:", email);
        const result = await registerUser({ 
          email, 
          password, 
          firstName, 
          lastName,
          plan: selectedPlan
        });
        
        // Set the user in Supabase context for protected routes
        if (result && result.user) {
          setMockUser({
            id: result.user.id,
            email: result.user.email,
            fullName: `${result.user.firstName} ${result.user.lastName}`
          });
        }
        
        notify.success('Account created', 'Your account has been created successfully');
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Authentication error:', err);
      
      if (err instanceof AuthError) {
        // Handle specific error types
        switch (err.code) {
          case AUTH_ERROR_CODES.INVALID_EMAIL:
            setFieldErrors({ ...fieldErrors, email: err.message });
            break;
          case AUTH_ERROR_CODES.INVALID_CREDENTIALS:
            if (err.message.includes('Password')) {
              setFieldErrors({ ...fieldErrors, password: err.message });
            } else {
              setError(err.message);
            }
            break;
          case AUTH_ERROR_CODES.USER_NOT_FOUND:
            setFieldErrors({ ...fieldErrors, email: err.message });
            break;
          case AUTH_ERROR_CODES.WEAK_PASSWORD:
            setFieldErrors({ ...fieldErrors, password: err.message });
            break;
          case AUTH_ERROR_CODES.EMAIL_IN_USE:
            setFieldErrors({ ...fieldErrors, email: err.message });
            break;
          case AUTH_ERROR_CODES.NETWORK_ERROR:
            notify.error('Network Error', err.message, { showToast: true });
            break;
          default:
            setError(err.message);
        }
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred during authentication');
        notify.error('Authentication Error', 'An unexpected error occurred. Please try again later.');
      }
    } finally {
      // Always clear the loading state and safety timer
      clearTimeout(safetyTimer);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      {/* Left side - Form */}
      <div className={`flex-1 flex flex-col justify-center ${isDesktop ? 'max-w-md' : 'w-full'}`}>
        <ResponsiveContainer
          maxWidth="max-w-md"
          paddingSm="px-5 py-8"
          paddingMd="px-8 py-12"
          className="w-full"
        >
          <div className="mb-8">
            <Link to="/" className="text-2xl font-bold text-primary">
              GenieFlow<span className="text-blue-600">AI</span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold mb-6">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h1>

          {!isLogin && selectedPlan && selectedPlan !== 'free' && (
            <div className="p-3 mb-4 text-sm text-green-800 bg-green-100 rounded-md">
              You're signing up for the <span className="font-bold capitalize">{selectedPlan}</span> plan
            </div>
          )}

          {error && (
            <div className="p-3 mb-4 text-sm text-red-800 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          <Tabs defaultValue="login" className="w-full" onValueChange={(value) => setIsLogin(value === 'login')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) {
                        setFieldErrors({ ...fieldErrors, email: undefined });
                      }
                    }}
                    required
                    placeholder="your@email.com"
                    className={fieldErrors.email ? "border-red-500" : ""}
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-1">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) {
                        setFieldErrors({ ...fieldErrors, password: undefined });
                      }
                    }}
                    required
                    placeholder="••••••••"
                    className={fieldErrors.password ? "border-red-500" : ""}
                  />
                  {fieldErrors.password && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
                  )}
                </div>

                {isLogin && (
                  <div className="text-right">
                    <Link
                      to="/forgot-password"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Forgot password?
                    </Link>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full relative"
                >
                  {isLoading ? (
                    <>
                      <span className="inline-block animate-spin mr-2">
                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
                      <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                    </>
                  ) : (
                    <>{isLogin ? 'Sign in' : 'Create account'}</>
                  )}
                </Button>
                
                <div className="mt-4 text-center relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      Or continue with
                    </span>
                  </div>
                </div>
                
                <GoogleButton 
                  className="w-full mt-4" 
                  onError={(error) => {
                    setError(error.message);
                  }}
                />
              </form>
            </TabsContent>
            <TabsContent value="register">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                      First Name
                    </label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        if (fieldErrors.firstName) {
                          setFieldErrors({ ...fieldErrors, firstName: undefined });
                        }
                      }}
                      required
                      placeholder="John"
                      className={fieldErrors.firstName ? "border-red-500" : ""}
                    />
                    {fieldErrors.firstName && (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                      Last Name
                    </label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        if (fieldErrors.lastName) {
                          setFieldErrors({ ...fieldErrors, lastName: undefined });
                        }
                      }}
                      required
                      placeholder="Doe"
                      className={fieldErrors.lastName ? "border-red-500" : ""}
                    />
                    {fieldErrors.lastName && (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="registerEmail" className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <Input
                    id="registerEmail"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) {
                        setFieldErrors({ ...fieldErrors, email: undefined });
                      }
                    }}
                    required
                    placeholder="your@email.com"
                    className={fieldErrors.email ? "border-red-500" : ""}
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="registerPassword" className="block text-sm font-medium mb-1">
                    Password
                  </label>
                  <Input
                    id="registerPassword"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) {
                        setFieldErrors({ ...fieldErrors, password: undefined });
                      }
                    }}
                    required
                    placeholder="Create a strong password"
                    className={fieldErrors.password ? "border-red-500" : ""}
                  />
                  {fieldErrors.password && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <span className="inline-block animate-spin mr-2">
                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>Create account</>
                  )}
                </Button>
                
                <div className="mt-4 text-center relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      Or continue with
                    </span>
                  </div>
                </div>
                
                <GoogleButton 
                  className="w-full mt-4" 
                  onError={(error) => {
                    setError(error.message);
                  }}
                />
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setFieldErrors({});
              }}
              className="ml-1 text-blue-600 hover:text-blue-800"
            >
              {isLogin ? 'Create one' : 'Sign in'}
            </button>
          </div>
        </ResponsiveContainer>
      </div>

      {/* Right side - Branding (only shown on desktop) */}
      {isDesktop && (
        <div className="hidden lg:flex flex-1 bg-blue-500 text-white">
          <div className="max-w-lg mx-auto py-12 px-8 flex flex-col justify-center">
            <h2 className="text-4xl font-bold mb-4 text-center">All Your Work In One Place</h2>
            <p className="text-lg mb-6 text-center">
              GenieFlowAI brings AI-powered productivity tools to your workflow. Manage emails, schedule meetings, and organize your work effortlessly.
            </p>
            
            <div className="mt-8 bg-blue-600 bg-opacity-30 p-6 rounded-lg shadow-xl border border-blue-400 border-opacity-50">
              <div className="h-64 flex items-center justify-center">
                <div className="text-center text-xl">
                  <div className="mb-6 h-12 bg-blue-400 bg-opacity-30 rounded-lg w-full"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-blue-400 bg-opacity-30 rounded-lg"></div>
                    <div className="h-24 bg-blue-400 bg-opacity-30 rounded-lg"></div>
                  </div>
                  <p className="mt-4 text-blue-100">GenieFlow Dashboard</p>
                </div>
              </div>
              <p className="text-center mt-4 text-sm text-blue-200">Dashboard Preview</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Export the LoginPage component
const LoginPage = () => {
  return <LoginPageContent />;
};

export { LoginPage };