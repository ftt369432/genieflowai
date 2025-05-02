# GenieFlowAI Deployment Guide

This document provides comprehensive instructions for deploying the GenieFlowAI application to production.

## Prerequisites

- Node.js 14.x or higher
- npm 6.x or higher
- Git repository with your GenieFlowAI code
- Access to a hosting provider (Netlify recommended)
- Domain name configured (genieflowai.com)

## Deployment Options

### Option 1: Deploy with Netlify (Recommended)

Netlify provides an easy way to deploy React applications with continuous deployment.

#### 1A: Automatic Deployment via Netlify UI

1. **Push your code to a Git repository** (GitHub, GitLab, or Bitbucket)

2. **Connect Netlify to your repository**
   - Sign up for a Netlify account at https://app.netlify.com/signup
   - Click "New site from Git" and select your repository
   - Configure build settings:
     - Build command: `npm run build`
     - Publish directory: `build`

3. **Configure environment variables**
   - Go to Site settings > Build & deploy > Environment
   - Add the following required environment variables:
     - `VITE_USE_MOCK`: Set to `false` for production
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
     - `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth client ID
     - `VITE_AUTH_CALLBACK_URL`: OAuth callback URL

4. **Deploy the site**
   - Netlify will automatically build and deploy your site
   - You can configure a custom domain in the Netlify dashboard

#### 1B: Manual Deployment via Netlify CLI

1. **Install Netlify CLI** (already added to project dependencies)
   ```
   # If not already installed
   npm install netlify-cli --save-dev
   ```

2. **Login to Netlify**
   ```
   npx netlify login
   ```

3. **Link your local project to a Netlify site**
   ```
   # If creating a new site
   npx netlify sites:create --name your-site-name
   
   # If linking to an existing site
   npx netlify link
   ```

4. **Deploy to Netlify**
   
   **Production Deployment:**
   ```
   npm run deploy:netlify
   ```
   
   **Automated Production Deployment:**
   ```
   npm run deploy:production
   ```
   
   **Interactive Deployment Script:**
   ```
   # On Windows
   npm run deploy
   
   # On Unix-based systems
   npm run deploy:unix
   ```

### Option 2: Manual Deployment to Other Hosting

1. **Prepare the application**
   - Run the deployment script:
     ```
     # On Windows
     npm run deploy
     
     # On Unix-based systems
     npm run deploy:unix
     ```

2. **Upload to your web server**
   - Upload the contents of the `build` directory to your web hosting
   - Configure your web server to serve `index.html` for all routes (for SPA routing)

3. **Configure your web server**
   - Set up HTTPS using Let's Encrypt or similar
   - Configure proper CORS headers if needed
   - Set up proper caching for static assets

## Domain Configuration

1. **Point your domain to your hosting provider**
   - Update DNS settings to point to your hosting provider
   - Add both `genieflowai.com` and `www.genieflowai.com`

2. **Set up HTTPS**
   - Enable HTTPS for your domain
   - Configure redirect from HTTP to HTTPS

## Environment Variables

Ensure the following environment variables are set correctly:

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_USE_MOCK` | Set to `false` for production | Yes |
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | Yes |
| `VITE_GOOGLE_CLIENT_ID` | Your Google OAuth client ID | Yes |
| `VITE_AUTH_CALLBACK_URL` | OAuth callback URL | Yes |

## API Configuration

Ensure that the API endpoints at `https://api.genieflowai.com` are properly set up and accessible.

1. **Update CORS settings**
   - Allow requests from your domain `https://genieflowai.com`
   
2. **Verify API connectivity**
   - Test all endpoints to ensure they are working correctly

## Post-Deployment Checklist

- [ ] Verify the application loads correctly
- [ ] Test authentication flow with Google
- [ ] Verify that the application is not in mock mode
- [ ] Test user profile functionality
- [ ] Verify subscription features
- [ ] Check email integration
- [ ] Test document processing
- [ ] Verify mobile responsiveness
- [ ] Check for any console errors
- [ ] Test API connectivity

## Monitoring and Analytics

- Set up error logging with a service like Sentry
- Configure analytics with Google Analytics or similar
- Set up uptime monitoring

## Troubleshooting

### Authentication Issues

- Ensure Google OAuth is correctly configured in both Google Cloud Console and Supabase
- Check that the OAuth redirect URI is set to your domain (e.g., `https://genieflowai.com/auth/callback`)
- Verify that you're using the correct environment variables in production

### Mock Mode Issues

- Ensure `VITE_USE_MOCK` is set to `false` in environment variables
- Verify that the environment configuration in `src/config/env.ts` correctly reads this variable
- Clear your browser cache after updating environment variables

### Build Failures

- Check the build logs for errors
- Ensure all dependencies are correctly installed
- Verify that your application builds successfully locally with `npm run build`

### General Issues

If you encounter other issues during deployment:

1. Check for CORS issues in the browser console
2. Ensure API endpoints are accessible
3. Check for any JavaScript errors in the console

For additional help, contact the GenieFlowAI development team at support@genieflowai.com or refer to the [Netlify documentation](https://docs.netlify.com/).