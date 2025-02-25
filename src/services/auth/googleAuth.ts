import { GoogleLogin } from '@react-oauth/google';

interface GoogleAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

interface AuthResponse {
  access_token?: string;
  error?: string;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = window.location.origin;

export function initGoogleAuth() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export function GoogleAuthButton({ onSuccess }: { onSuccess: (response: any) => void }) {
  return (
    <GoogleLogin
      clientId={GOOGLE_CLIENT_ID}
      onSuccess={onSuccess}
      onError={() => console.log('Login Failed')}
    />
  );
}

export function getGoogleAuthConfig(): GoogleAuthConfig {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID in your environment variables.');
  }

  return {
    clientId: GOOGLE_CLIENT_ID,
    redirectUri: REDIRECT_URI,
    scopes: [
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/contacts.readonly'
    ]
  };
}

export function handleAuthResponse(response: AuthResponse): boolean {
  if (response?.access_token) {
    localStorage.setItem('email_access_token', response.access_token);
    return true;
  }
  return false;
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('email_access_token');
}

export function getAccessToken(): string | null {
  return localStorage.getItem('email_access_token');
}

export function logout(): void {
  localStorage.removeItem('email_access_token');
}