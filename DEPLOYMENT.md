# GenieFlowAI Deployment Guide

This document provides instructions for deploying the GenieFlowAI application to production.

## Prerequisites

- Node.js 14.x or higher
- npm 6.x or higher
- Access to a hosting provider (Netlify, Vercel, AWS, etc.)
- Domain name configured (genieflowai.com)

## Deployment Options

### Option 1: Deploy with Netlify (Recommended)

Netlify provides an easy way to deploy React applications with continuous deployment.

1. **Push your code to a Git repository** (GitHub, GitLab, or Bitbucket)

2. **Connect Netlify to your repository**
   - Sign up for a Netlify account at https://app.netlify.com/signup
   - Click "New site from Git" and select your repository
   - Configure build settings:
     - Build command: `npm run build`
     - Publish directory: `build`

3. **Configure environment variables**
   - Go to Site settings > Build & deploy > Environment
   - Add the required environment variables from `.env.production`

4. **Deploy the site**
   - Netlify will automatically build and deploy your site
   - You can configure a custom domain in the Netlify dashboard

### Option 2: Manual Deployment

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

## API Configuration

Ensure that the API endpoints at `https://api.genieflowai.com` are properly set up and accessible.

1. **Update CORS settings**
   - Allow requests from your domain `https://genieflowai.com`
   
2. **Verify API connectivity**
   - Test all endpoints to ensure they are working correctly

## Post-Deployment Checklist

- [ ] Verify the application loads correctly
- [ ] Test authentication flow
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

If you encounter issues during deployment:

1. Check the build logs for errors
2. Verify environment variables are set correctly
3. Check for CORS issues in the browser console
4. Ensure API endpoints are accessible
5. Check for any JavaScript errors in the console

For additional help, contact our development team at support@genieflowai.com. 