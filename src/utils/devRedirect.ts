/**
 * Development redirection utility
 * 
 * This utility helps prevent accidentally using the Netlify deployment
 * when developing locally. It will redirect from Netlify back to localhost.
 */

/**
 * Checks if the current page is the Netlify deployment and we should be
 * using localhost instead (when in development mode).
 */
export function redirectToLocalhost() {
  // Only run in development mode
  const isDev = localStorage.getItem('devMode') === 'true' || 
                import.meta.env.DEV || 
                import.meta.env.MODE === 'development';
  
  if (!isDev) {
    console.log('Not in development mode, allowing Netlify usage');
    return;
  }
  
  // Check if we're on the Netlify deployment
  if (window.location.hostname.includes('netlify.app')) {
    console.warn('Development mode active but using Netlify deployment - redirecting to localhost!');
    
    // Replace the current URL with localhost
    const localhostUrl = `http://localhost:5173${window.location.pathname}${window.location.search}`;
    window.location.href = localhostUrl;
  }
}

/**
 * Enables developer mode which will redirect from Netlify to localhost
 */
export function enableDevMode() {
  localStorage.setItem('devMode', 'true');
  console.log('Developer mode enabled - will redirect from Netlify to localhost');
}

/**
 * Disables developer mode which allows using Netlify
 */
export function disableDevMode() {
  localStorage.setItem('devMode', 'false');
  console.log('Developer mode disabled - will allow Netlify usage');
}

/**
 * Checks if developer mode is enabled
 */
export function isDevModeEnabled(): boolean {
  return localStorage.getItem('devMode') === 'true';
} 