import React, { useState, useEffect, Fragment } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { LoadingButton } from '../components/ui/LoadingButton';
import { loginUser, registerUser, AuthError, AUTH_ERROR_CODES } from '../services/auth/authService';
import { useLoadingState } from '../utils/loadingState';
import { ResponsiveContainer } from '../components/ui/ResponsiveContainer';
import { useBreakpoint } from '../utils/responsive';
import { NotificationProvider } from '../contexts/NotificationContext';
import { Toaster } from 'sonner';
import { useNotify } from '../utils/notification';
import { useSupabase } from '../providers/SupabaseProvider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';

// Login page with toggle between login and register
const LoginPageContent = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const registerParam = queryParams.get('register');
  const planParam = queryParams.get('plan');
  
  const [isLogin, setIsLogin] = useState(!registerParam);
  const [selectedPlan, setSelectedPlan] = useState(planParam || 'free');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const notify = useNotify();
  const { withLoading, isLoading } = useLoadingState();
  const isDesktop = useBreakpoint('lg');
  const { user, loading, setMockUser } = useSupabase();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user && !loading) {
      console.log("User already authenticated, redirecting to dashboard");
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

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

  useEffect(() => {
    // Update the form mode if the URL parameters change
    setIsLogin(!registerParam);
    if (planParam) {
      setSelectedPlan(planParam);
    }
  }, [registerParam, planParam]);

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
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setError(null);
    
    try {
      const operationId = isLogin ? 'auth/login' : 'auth/register';
      
      await withLoading(
        operationId,
        async () => {
          if (isLogin) {
            // Login user
            const result = await loginUser({ email, password });
            console.log("Login successful, attempting to navigate to dashboard");
            
            // Set the user in Supabase context for protected routes
            if (result && result.user) {
              setMockUser({
                id: result.user.id,
                email: result.user.email,
                fullName: `${result.user.firstName} ${result.user.lastName}`
              });
              console.log("User set in Supabase context");
            }
            
            notify.success('Welcome back!', 'You have successfully logged in');
          } else {
            // Register user with selected plan
            const result = await registerUser({ 
              email, 
              password, 
              firstName, 
              lastName,
              plan: selectedPlan // Pass the selected plan to the registration
            });
            
            // Set the user in Supabase context for protected routes
            if (result && result.user) {
              setMockUser({
                id: result.user.id,
                email: result.user.email,
                fullName: `${result.user.firstName} ${result.user.lastName}`
              });
              console.log("User set in Supabase context");
            }
            
            console.log("Registration successful, attempting to navigate to dashboard");
            notify.success('Account created', 'Your account has been created successfully');
          }
          
          // Log before navigating to debug any issues
          console.log("Navigation triggered to /dashboard");
          navigate('/dashboard', { replace: true }); // Use replace to prevent back navigation to login
          console.log("Navigation should be complete");
        },
        {
          showSuccessNotification: false, // Already showing success notification above
          showErrorNotification: false, // Handling errors manually below
        }
      );
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
                    error={fieldErrors.email}
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
                    error={fieldErrors.password}
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

                <LoadingButton
                  type="submit"
                  className="w-full"
                  isLoading={isLoading(isLogin ? 'auth/login' : 'auth/register')}
                  loadingText={isLogin ? 'Signing in...' : 'Creating account...'}
                >
                  {isLogin ? 'Sign in' : 'Create account'}
                </LoadingButton>
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
                      error={fieldErrors.firstName}
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
                      error={fieldErrors.lastName}
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
                    error={fieldErrors.email}
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
                    error={fieldErrors.password}
                  />
                  {fieldErrors.password && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
                  )}
                </div>

                <LoadingButton
                  type="submit"
                  className="w-full"
                  isLoading={isLoading(isLogin ? 'auth/login' : 'auth/register')}
                  loadingText="Creating account..."
                >
                  Create account
                </LoadingButton>
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
        <div className="flex-1 bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex flex-col justify-center items-center">
          <div className="max-w-md px-8 py-12 text-center">
            <h2 className="text-3xl font-bold mb-4">
              All Your Work In One Place
            </h2>
            <p className="mb-6">
              GenieFlowAI brings AI-powered productivity tools to your workflow.
              Manage emails, schedule meetings, and organize your work effortlessly.
            </p>
            <div className="flex justify-center space-x-4">
              {/* Replace with SVG to avoid 404 errors */}
              <div 
                className="rounded-lg shadow-xl w-full max-w-sm border border-white/10 bg-white/5 p-4 text-center"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="100%" 
                  height="200" 
                  viewBox="0 0 400 200" 
                  className="mb-2"
                >
                  <rect width="100%" height="100%" fill="#1d4ed8" opacity="0.1" />
                  <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="18px">
                    GenieFlow Dashboard
                  </text>
                  <g fill="white" opacity="0.3">
                    <rect x="20" y="20" width="360" height="30" rx="4" />
                    <rect x="20" y="70" width="170" height="100" rx="4" />
                    <rect x="210" y="70" width="170" height="100" rx="4" />
                  </g>
                </svg>
                <p className="text-sm text-white/70">Dashboard Preview</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Wrapper component that provides the NotificationProvider context
export function LoginPage() {
  return (
    <NotificationProvider>
      <LoginPageContent />
      <Toaster position="top-right" richColors />
    </NotificationProvider>
  );
}