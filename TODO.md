# GenieFlowAI TODO List

## Critical Priority (Must Complete)

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
  - [ ] Fix Supabase RLS policies
    - [ ] Apply fix_supabase_policy.sql to resolve infinite recursion in team_members policy
    - [ ] Verify team data loading works correctly after fix
    - [ ] Document proper RLS policy patterns for team access
    - [ ] Review other policies for similar recursion issues

- [ ] **Core Functionality**
  - [ ] Complete AI Assistant integration
    - [x] Implement basic AI assistant functionality
    - [ ] Fix profile loading issues
    - [ ] Implement proper error states
    - [ ] Add loading indicators
    - [x] Verify AI assistant is operational in current state
    - [ ] Document current AI assistant capabilities and limitations
    - [ ] Continue to iterate with enhanced assistant creation
      - [ ] Add avatar/logo selection for assistants
      - [ ] Create personalized assistant templates
      - [ ] Implement assistant customization wizard
      - [ ] Build assistant preview experience
  - [ ] Finalize email integration
    - [ ] Complete SMTP provider integration
    - [ ] Add email template system
  - [ ] Complete document knowledge base
    - [ ] Implement document processing
    - [ ] Add search functionality
    - [ ] Create document management UI
  - [ ] Enhance AI-powered notebooks
    - [ ] Implement cross-notebook references
    - [ ] Add automatic topic extraction
    - [ ] Improve semantic analysis of notebook content

- [ ] **Deployment & DevOps**
  - [x] Add Netlify CLI to project
  - [x] Create Netlify deployment scripts
  - [x] Document Netlify deployment process
  - [ ] Configure continuous deployment
  - [ ] Set up environment variables in Netlify
  - [ ] Test deployment process end-to-end
  - [ ] Configure Netlify build hooks
  - [ ] Optimize production build settings
  - [ ] Implement content security policy
  - [ ] Configure proper cache control headers

## High Priority

- [ ] **Code Cleanup**
  - [x] Consolidate duplicate utility functions
  - [x] Clean up duplicate exports
  - [x] Mark deprecated components
  - [x] Fix deprecated utility imports
  - [ ] Remove redundant styles
  - [ ] Fix remaining linter errors
  - [ ] Convert remaining JS to TS
  - [ ] Standardize component patterns
  - [ ] Continue to iterate? Apply iterative development approach for complex components
    - [ ] Break down complex features into smaller iterations
    - [ ] Validate functionality after each iteration
    - [ ] Refine components based on feedback from previous iterations
    - [ ] Document decision points and alternatives considered

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
  - [ ] Implement server-side rendering for critical paths
  - [ ] Add prefetching for common user journeys
  - [ ] Optimize Supabase queries

- [ ] Utilize Vite and React best practices and leverage Gemini API capabilities for optimal performance and features

## Medium Priority

- [ ] **Testing**
  - [ ] Add unit tests for core utilities
  - [ ] Add component tests
  - [ ] Add integration tests
  - [ ] Add E2E tests
  - [ ] Create test fixtures for common data patterns
  - [ ] Implement API mocking for tests

- [ ] **Documentation**
  - [x] Document codebase structure
  - [ ] Document component API
  - [ ] Add JSDoc comments
  - [ ] Create user guide
  - [ ] Add developer guide
  - [ ] Update README with comprehensive setup instructions
  - [ ] Create API documentation
  - [ ] Document AI integration patterns
  - [ ] Document AIAssistantPage structure (Left panel: auto-hide, conversations, recent assistants; Center: chat history, floating input w/ attachments/mic; Right panel: pull-out for Knowledge/Swarm)

- [ ] **Project Structure**
  - [ ] Consolidate duplicate configuration files
  - [ ] Create consistent folder structure across project
  - [ ] Implement better component organization
  - [ ] Standardize file naming conventions
  - [ ] Create clear separation between page and component files

## Low Priority

- [ ] **Future Features**
  - [ ] Voice controls
  - [ ] Analytics dashboard
  - [ ] Workflow automation
  - [ ] Enterprise features
  - [ ] Custom notebook templates
  - [ ] Enhanced document AI analysis
  - [ ] Collaborative notebooks
  - [ ] Advanced calendar integrations

- [ ] **Optimizations**
  - [ ] PWA support
  - [ ] Client-side caching
  - [ ] Mobile optimizations
  - [ ] Advanced animations 

## Swarm System Implementation

- [x] **Agent Swarm Feature**
  - [x] Complete swarm store (swarmStore.ts) with CRUD operations
  - [x] Develop component architecture for swarm functionality
    - [x] Create SwarmCard component
    - [x] Create SwarmList component
    - [x] Create SwarmDetail component
    - [x] Update SwarmPage to use new components
  - [x] Implement swarm status management (active, inactive, paused)
  - [x] Add agent selection and role assignment in swarms
  - [x] Connect swarm components with agent store

- [ ] **Agent Swarm Enhancements**
  - [ ] Add dynamic swarm metrics
  - [ ] Implement swarm communication interface
  - [ ] Add swarm task execution pipeline
  - [ ] Create swarm log viewer
  - [ ] Add agent-to-agent messaging within swarms

- [x] **Legal Case Swarm System**
  - [x] Create specialized legal swarm template
    - [x] Define specialized roles (Case Coordinator, Legal Researcher, etc.)
    - [x] Implement role capability requirements
  - [x] Add legal-specific agent capabilities
    - [x] Add legal-research capability
    - [x] Add case-management capability
    - [x] Add medical-record-analysis capability
    - [x] Add hearing-preparation capability
    - [x] Add document-filing capability
  - [x] Create Legal Swarm Processor
    - [x] Implement regex pattern parsing for hearing notes
    - [x] Extract key information (applicant name, hearing status, etc.)
    - [x] Create action item detection
  - [x] Implement automatic agent assignment
    - [x] Create logic to match agent capabilities to case requirements
    - [x] Build automatic role assignment system
  - [x] Create Legal Case Input Component
    - [x] Build UI for case information input
    - [x] Implement paste detection
    - [x] Add swarm creation prompt
  - [x] Create dedicated legal swarm page
    - [x] Build /legal-swarm route
    - [x] Implement swarm creation interface

- [ ] **Legal Case Swarm Enhancements**
  - [ ] Add template library for different case types
  - [ ] Improve parsing accuracy with ML techniques
  - [ ] Implement legal document generation
  - [ ] Create case timeline visualization
  - [ ] Add integration with legal research databases
  - [ ] Implement hearing reminder system
  - [ ] Create legal deadline calculator
  - [ ] Build document filing workflow management

## AI Drive Implementation

- [ ] **AI Drive Core Features**
  - [x] Complete file upload/download functionality (basic in place, needs review for OCR flow)
  - [ ] Implement file organization system
  - [ ] Create semantic search for documents
  - [ ] Add version history tracking
  - [ ] Implement file sharing capabilities
  - [ ] Refine file processing pipeline for on-demand OCR
    - [x] Implement on-demand OCR for image files in AI Drive (`getOcrTextForFile`)
    - [ ] Implement strategy for OCRing scanned PDFs (e.g., PDF to image conversion then OCR)
    - [ ] Ensure chat context loading utilizes on-demand OCR for relevant file types
  - [ ] Ensure AI processing (summaries, topics, embeddings) uses full extracted text (including OCR results when available)

- [ ] **AI Document Analysis**
  - [ ] Implement document summarization (ensure it uses full text, incl. OCR)
  - [ ] Create content analysis with key topics extraction (ensure it uses full text, incl. OCR)
  - [ ] Add question answering about document content (ensure it uses full text, incl. OCR - initial update done)
  - [ ] Build smart collections based on content
  - [ ] Implement document visualization tools
  - [ ] Integrate AI Drive documents into Assistant Knowledge Bases
    - [ ] Define mechanism for selecting AI Drive files/folders for an assistant's knowledge base
    - [ ] Ensure full text (including on-demand OCR) is extracted and processed for knowledge base ingestion
    - [ ] Update assistant retrieval logic to use its specific knowledge base derived from AI Drive
  - [ ] General Knowledge Base Population from AI Drive
    - [ ] Determine criteria/process for promoting AI Drive content to a general knowledge base
    - [ ] Implement pipeline for extracting and indexing this content

## Project Clean-up and Consistency

- [ ] **Frontend Consistency**
  - [ ] Standardize UI component patterns
  - [ ] Create design system documentation
  - [ ] Implement consistent error handling patterns
  - [ ] Standardize form validation approach
  - [ ] Create reusable animation components

- [ ] **Backend Services**
  - [ ] Refactor Netlify functions for consistency
  - [ ] Optimize Supabase database schema
  - [ ] Implement proper database indexes
  - [ ] Create consistent API error responses
  - [ ] Add API rate limiting

## Integration Enhancements

- [ ] **Google Calendar Integration**
  - [ ] Complete OAuth verification process
  - [ ] Add calendar event creation from notebooks
  - [ ] Implement calendar sync with task deadlines
  - [ ] Create recurring meeting templates

- [ ] **Task Management System**
  - [ ] Enhance task extraction from notebooks
  - [ ] Create task prioritization system
  - [ ] Implement due date notifications
  - [ ] Add collaborative task assignment
  - [ ] Create task dashboard view