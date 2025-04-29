# GenieFlowAI Project Overview

## Design & Development Principles

### UI/UX Design Guidelines

```
For all designs I ask you to make, have them be beautiful, not cookie cutter. Make webpages that are fully featured and worthy for production.

By default, this template supports JSX syntax with Tailwind CSS classes, React hooks, and Lucide React for icons. Do not install other packages for UI themes, icons, etc unless absolutely necessary or I request them.

Use icons from lucide-react for logos.

Use stock photos from unsplash where appropriate, only valid URLs you know exist. Do not download the images, only link to them in image tags.
```

### React Best Practices

- Use functional components with hooks rather than class components
- Follow the principle of lifting state up when needed
- Keep components small, focused, and reusable
- Implement proper error boundaries and loading states
- Use custom hooks to share logic between components
- Always start the development server on port 5173
- Follow proper naming conventions (PascalCase for components, camelCase for functions)
- Minimize re-renders through proper use of useCallback, useMemo, and React.memo

### Codebase Guidelines

- Maintain clean, consistent code formatting
- Use TypeScript for type safety
- Avoid duplicate method definitions and code
- Write clear, comprehensive documentation
- Follow the component pattern established in the project
- Use absolute imports with the '@/' prefix
- Ensure proper error handling throughout the application
- Keep dependencies up to date and minimize their number

## Project Structure

```
src/
├── components/     # React UI components
│   ├── ai/         # AI-specific components
│   ├── calendar/   # Calendar components
│   ├── email/      # Email-related components
│   ├── layout/     # Layout and structural components
│   └── ui/         # Reusable UI components
├── contexts/       # React contexts for state management
├── hooks/          # Custom React hooks
├── lib/            # Utility libraries
├── pages/          # Page components
├── providers/      # Providers for contexts
├── services/       # Service layer
│   ├── agents/     # AI agents
│   ├── ai/         # AI service integrations
│   ├── auth/       # Authentication services
│   ├── calendar/   # Calendar services
│   ├── email/      # Email services
│   └── swarm/      # Swarm processing services
├── store/          # State management
├── styles/         # Global styles
└── types/          # TypeScript type definitions
```

## Core Dependencies

- React 18
- TypeScript
- Tailwind CSS
- Vite
- Supabase (Auth/DB)
- React Router
- Google APIs (Auth, Calendar, Gmail)
- Gemini AI API

## TODO List

### Critical Priority (Must Complete)

- [ ] **Authentication & Authorization**

  - [x] Fix Google OAuth callback handling
  - [x] Remove hardcoded mock mode override
  - [ ] Complete Google OAuth verification process
    - [ ] Configure OAuth consent screen
    - [ ] Add authorized domains
    - [ ] Add test users
    - [ ] Submit for verification
  - [ ] Configure Supabase URLs
    - [ ] Update Site URL to Netlify domain
    - [ ] Add correct redirect URLs
    - [ ] Verify OAuth state handling
  - [ ] Ensure proper session management in production
  - [ ] Add proper error handling for auth failures
  - [ ] Implement session refresh mechanism

- [ ] **Core Functionality**

  - [ ] Complete AI Assistant integration
    - [ ] Fix profile loading issues
    - [ ] Implement proper error states
    - [ ] Add loading indicators
  - [ ] Finalize email integration
    - [ ] Complete SMTP provider integration
    - [ ] Add email template system
  - [ ] Complete document knowledge base
    - [ ] Implement document processing
    - [ ] Add search functionality
    - [ ] Create document management UI

- [ ] **Deployment & DevOps**
  - [x] Add Netlify CLI to project
  - [x] Create Netlify deployment scripts
  - [x] Document Netlify deployment process
  - [ ] Configure continuous deployment
  - [ ] Set up environment variables in Netlify
  - [ ] Test deployment process end-to-end
  - [ ] Configure Netlify build hooks

### High Priority

- [ ] **Code Cleanup**

  - [x] Consolidate duplicate utility functions
  - [x] Clean up duplicate exports
  - [x] Mark deprecated components
  - [x] Fix deprecated utility imports
  - [x] Fix duplicate method definitions (CalendarAgent, CalendarService)
  - [ ] Remove redundant styles
  - [ ] Fix remaining linter errors
  - [ ] Convert remaining JS to TS
  - [ ] Standardize component patterns

- [ ] **Bug Fixes**

  - [x] Fix CSS import issues
  - [x] Fix duplicate component imports
  - [ ] Fix Calendar component
  - [ ] Resolve type errors in AI interfaces
  - [ ] Fix missing dependencies

- [ ] **Performance**
  - [ ] Implement code splitting
  - [ ] Optimize bundle size
  - [ ] Add lazy loading
  - [ ] Optimize React renders

### Medium Priority

- [ ] **Testing**

  - [ ] Add unit tests for core utilities
  - [ ] Add component tests
  - [ ] Add integration tests
  - [ ] Add E2E tests

- [ ] **Documentation**
  - [x] Document codebase structure
  - [ ] Document component API
  - [ ] Add JSDoc comments
  - [ ] Create user guide
  - [ ] Add developer guide
  - [ ] Consolidate documentation (see DOCUMENTATION.md for organization)
  - [ ] Remove duplicate design guidelines from .bolt/prompt

### Low Priority

- [ ] **Future Features**

  - [x] Add voice controls to main interface
  - [ ] Implement advanced analytics dashboard
  - [ ] Build workflow automation builder
  - [ ] Create enterprise admin features
  - [ ] Mobile application development
    - [ ] NoteGPT-style dictation interface
    - [ ] Live transcription capability
    - [ ] Dictation machine connectivity
    - [ ] Medical/legal specialized transcription

- [ ] **Optimizations**
  - [ ] PWA support for offline functionality
  - [ ] Add client-side caching strategies
  - [ ] Optimize for mobile touch interactions
  - [ ] Implement advanced animation transitions

## Branch Management

- `main` - Production-ready code
- `develop` - Integration branch for ongoing development
- All feature branches should be merged to `develop` first
- Use the naming convention: `feature/feature-name` for feature branches
- Use `fix/issue-name` for bugfix branches

## Development Setup

1. Clone the repository
2. Copy `.env.example` to `.env`
3. Fill in your environment variables
4. Run `npm install` to install dependencies
5. Run `npm run dev` to start the development server
6. The app will be available at http://localhost:5173

### AI Setup and Configuration

When setting up the AI components of GenieFlowAI, follow these steps:

1. **API Keys Configuration**:

   - Obtain API keys for your AI providers (Gemini, OpenAI, etc.)
   - Add these keys to your `.env` file using the exact format below:
     ```
     VITE_OPENAI_API_KEY=your_openai_key_here
     VITE_GEMINI_API_KEY=your_gemini_key_here
     ```
   - **Important**: Verify that your API keys are valid and not expired
   - For Gemini, ensure you've enabled the Gemini API in your Google Cloud Console
   - For testing, you can use mock services by setting `VITE_USE_MOCK_AI=true` in your `.env`

2. **AI Services Integration**:

   - AI services are located in `src/services/ai/`
   - Each service provider has its own implementation:
     - `gemini.ts` - Google's Gemini AI integration
     - `openai.ts` - OpenAI integration
     - `gemini-simplified.ts` - Simplified wrapper for Gemini
   - The main entry point is through `AIService.ts` which handles provider selection
   - Model configurations are stored in `config/ai.ts` (verify selected models exist in your account)

3. **Google Authentication Setup**:

   - The application requires proper Google OAuth setup for Calendar/Gmail services
   - Configure your Google Cloud OAuth consent screen with appropriate scopes
   - In `.env`, configure the following Google Auth variables:
     ```
     VITE_GOOGLE_CLIENT_ID=your_client_id
     VITE_GOOGLE_API_KEY=your_api_key
     VITE_GOOGLE_OAUTH_REDIRECT=http://localhost:3003/google-auth-callback
     ```
   - For local development, you can use mock services by setting `VITE_USE_MOCK_GOOGLE=true`
   - If you see "No session available" or "No provider token available" errors, check your OAuth configuration

4. **Agent Configuration**:

   - Agents are located in `src/services/agents/`
   - Each agent (Calendar, Email, etc.) uses a standardized interface
   - All agents extend the BaseAgent class from `BaseAgent.ts`
   - Agent initialization occurs in `initializeServices.ts`

5. **Troubleshooting Common Issues**:

   - **Invalid API Key**: If you see "API key not valid" errors in the console, verify:
     - Your key format is correct (no extra spaces or quotes)
     - The API is enabled in your Google Cloud/OpenAI account
     - Your billing is properly set up for the API
   - **Authentication Errors**: For "No session available" errors:
     - Verify your Google OAuth credentials
     - Ensure redirect URLs match your application's URLs
     - For development, consider using mock authentication
   - **CORS Issues**: If API requests fail with CORS errors:
     - Verify your development server is using HTTP as configured
     - Check CSP settings in the Vite config
     - Ensure API endpoints are configured correctly

6. **Development Server Configuration**:
   - When running the development server, use HTTP instead of HTTPS to avoid SSL errors
   - If you see `ERR_SSL_PROTOCOL_ERROR` messages, ensure:
     ```javascript
     // In vite.config.js
     server: {
       https: false,
       host: true,
       port: 3003,
       strictPort: true
     }
     ```
   - Access the server using http:// not https:// (e.g., http://localhost:3003 or http://192.168.1.6:3003)

## Rebuild Instructions

If the project needs to be rebuilt from scratch, follow these steps:

1. Set up Vite with React and TypeScript:

   ```bash
   npm create vite@latest genieflowai -- --template react-ts
   ```

2. Install core dependencies:

   ```bash
   npm install tailwindcss postcss autoprefixer react-router-dom @supabase/supabase-js lucide-react @google-api/client
   ```

3. Configure Tailwind CSS:

   ```bash
   npx tailwindcss init -p
   ```

4. Set up project structure following the structure above

5. Configure Vite to use port 5173:

   ```javascript
   // vite.config.ts
   export default defineConfig({
     plugins: [react()],
     server: {
       port: 5173,
       strictPort: true,
     },
   });
   ```

6. Clone environment variables:

   ```bash
   cp .env.example .env
   ```

7. Implement core services based on existing code

   - Authentication (Google, Supabase)
   - AI integration (Gemini)
   - Calendar/Email integration

8. Migrate UI components, preserving existing functionality
