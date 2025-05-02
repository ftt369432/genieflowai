# GenieFlowAI Netlify Deployment Guide

This document provides detailed instructions for deploying the GenieFlowAI application to Netlify.

## Prerequisites

- Node.js 14.x or higher
- npm 6.x or higher
- Git repository with your GenieFlowAI code
- Netlify account

## Deployment Options

### Option 1: Automatic Deployment via Netlify UI

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
     - etc. (add all required environment variables from your `.env` file)

4. **Deploy the site**
   - Netlify will automatically build and deploy your site
   - You can configure a custom domain in the Netlify dashboard

### Option 2: Manual Deployment via Netlify CLI

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
   
   **Draft Deployment (for testing):**
   ```
   npm run deploy:netlify:draft
   ```
   
   **Interactive Deployment (with prompts):**
   ```
   npm run deploy:netlify:interactive
   ```

## Environment Variables

Ensure the following environment variables are set correctly in Netlify:

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_USE_MOCK` | Set to `false` for production | Yes |
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | Yes |
| `VITE_GOOGLE_CLIENT_ID` | Your Google OAuth client ID | Yes |
| `VITE_AUTH_CALLBACK_URL` | OAuth callback URL (e.g., `https://genieflowai.netlify.app/auth/callback`) | Yes |

## Troubleshooting

### Authentication Issues

- Ensure Google OAuth is correctly configured in both Google Cloud Console and Supabase
- Check that the OAuth redirect URI is set to your Netlify domain (e.g., `https://genieflowai.netlify.app/auth/callback`)
- Verify that you're using the correct environment variables in production

### Mock Mode Issues

- Ensure `VITE_USE_MOCK` is set to `false` in Netlify environment variables
- Verify that the environment configuration in `src/config/env.ts` correctly reads this variable
- Clear your browser cache after updating environment variables

### Build Failures

- Check the Netlify build logs for errors
- Ensure all dependencies are correctly installed
- Verify that your application builds successfully locally with `npm run build`

## Post-Deployment Checklist

- [ ] Verify the application loads correctly
- [ ] Test authentication flow with Google
- [ ] Verify that the application is not in mock mode
- [ ] Test core functionalities
- [ ] Check for any console errors

For additional help, refer to the [Netlify documentation](https://docs.netlify.com/) or contact the GenieFlowAI development team.