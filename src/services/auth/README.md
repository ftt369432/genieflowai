# Authentication API

This directory contains the unified authentication API for GenieFlow AI.

## Overview

The authentication service provides a consolidated interface for all authentication-related functionality:

- Email/password authentication via Supabase
- Google OAuth authentication
- Authentication state management
- Mock authentication for testing and development

## Usage

### Basic authentication

```typescript
import { auth } from '../../services';

// Login with email and password
const response = await auth.login({ email, password });

// Register a new user
const response = await auth.register({ email, password, firstName, lastName });

// Logout
await auth.logout();

// Check if user is authenticated
const isLoggedIn = auth.isAuthenticated();

// Get current user
const user = auth.getCurrentUser();
```

### Google OAuth authentication

```typescript
import { auth } from '../../services';

// Login with Google
await auth.google.signIn();
```

### Using the React hook

We provide a convenient React hook that handles state and errors:

```typescript
import { useAuth } from '../../hooks/useAuth';

function LoginComponent() {
  const { user, loading, error, login, loginWithGoogle } = useAuth();

  const handleLogin = async () => {
    const success = await login({ email, password });
    if (success) {
      // Redirect or perform other actions on success
    }
  };

  return (
    <div>
      {loading && <span>Loading...</span>}
      {error && <span>Error: {error}</span>}
      <button onClick={handleLogin}>Login</button>
      <button onClick={loginWithGoogle}>Login with Google</button>
    </div>
  );
}
```

## Authentication Flow

1. User logs in via email/password or OAuth
2. Auth service validates credentials with provider
3. On success, user data is stored in the user store
4. Components can access authentication state via the useAuth hook

## Development Mode

The auth service supports a mock mode for development. In this mode:
- No real authentication is performed
- Mock user data is used
- This allows testing without real auth credentials

Enable mock mode in your `.env` file:

```
VITE_USE_MOCK=true
``` 