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
  - [ ] [Assistants Navigation] Investigate why clicking the 'Assistants' button on /ai-assistant does not route to /assistants as expected. Be gentle: do not refactor, but look for errors or blocking conditions (e.g., team context, redirects, route guards) and report best minimal fix.
  - [ ] [Email/Calendar Sync] Ensure email-to-calendar logic:
    - [ ] Checks for existing events before creating new ones (prevents duplicates).
    - [ ] Moves/copies notes and attachments from prior event/email to the new/updated event.
    - [ ] Review and report on current logic before making changes; recommend best approach for minimal, safe fix.

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

- [ ] **Knowledge Base & Assistant Capabilities Documentation**
  - [ ] **Vector-Powered Knowledge System Explanation**: Document how the system leverages vectorization for advanced AI. Key points:
    - **Vectorization (Embedding Generation)**: Documents (petitions, briefs, case law, AI Drive content, conversation history) are converted into numerical vectors (embeddings) that capture semantic meaning. This is foundational.
    - **Semantic Search & Retrieval**: The system uses these embeddings to find the most semantically relevant documents/snippets in response to queries, going beyond keyword matching.
    - **Contextual AI Responses**: Retrieved relevant text is passed to the LLM (e.g., Gemini) as context, along with the original query and the assistant's system prompt.
    - **System Prompts for Style & Behavior**: Assistant system prompts instruct the LLM on persona, task, how to use context, and desired writing style/tone (mimicry, expansion, idea generation).
    - **Persistent Learning (Conceptual)**: AI-generated outputs (summaries, drafts) can be reviewed, vectorized, and added back to the knowledge base, creating a learning loop. Conversation history is also vectorized for ongoing context.
    - **Core Goal**: To create a system that understands and utilizes the *meaning* within documents for intelligent assistance.

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

## Continuing Google Calendar Integration for Email-Based Legal Case Management

Hi team,

We've made significant progress on enhancing our email processing system to intelligently manage Google Calendar events for legal case hearings.

What we've accomplished so far:

**Resolved Authentication/API Issues:**
*   Corrected Google OAuth scopes by adding `https://www.googleapis.com/auth/calendar.events` to `supabase.auth.signInWithOAuth` in `src/services/auth/googleAuth.ts`, fixing the "403 Permission Denied - Insufficient authentication scopes" error.
*   Ensured the Google Calendar API was enabled in the relevant Google Cloud Project, resolving the "403 Google Calendar API has not been used in project... or it is disabled" error.

**Implemented Event Update Logic (to avoid duplicates):**
*   `AiCalendarService.ts` (`src/services/calendar/AiCalendarService.ts`):
    *   Added `findEventByCaseNumber(caseNumber: string)` to search Google Calendar for events with a matching `genieflowCaseNumber` in their private extended properties.
    *   Added `updateEvent(eventId: string, meetingDetails, ...)` to update existing events on Google Calendar using a PUT request.
*   `EmailService.ts` (`src/services/email/emailService.ts`):
    *   Refactored `analyzeEmail(email: EmailMessage)` to:
        *   Extract `meetingDetails` (including `caseNumber`) via AI analysis.
        *   Call `aiCalendarService.findEventByCaseNumber()`.
        *   If an event exists, call `aiCalendarService.updateEvent()`.
        *   If no event exists, call `aiCalendarService.createEventFromAnalysis()`.
        *   Update `analysisResult` with `calendarEventId` and `calendarEventStatus`.
*   `types.ts` (`src/services/email/types.ts`):
    *   Updated the `EmailAnalysis` interface with new optional fields (`calendarEventId`, `calendarEventStatus`, etc.).
*   UI for Testing (`EmailDetail.tsx`, `EmailPage.tsx`):
    *   Removed automatic `analyzeEmail` call from `EmailService.getEmailDetails()`.
    *   Added an "Analyze" button to the email detail view.
    *   Implemented `handleAnalyzeAndCalendar` in `EmailPage.tsx` to trigger analysis, update state, and provide toast notifications.

**Initial Testing:**
*   Successfully tested the flow where an email for an existing case (ADJ4004075) correctly identified the existing calendar event (j3da1fum62bk395pg0pfje7n3s) and updated it, as confirmed by console logs.

Our overall goal remains: To create a robust system that automatically and accurately manages Google Calendar events derived from email content for legal hearings, intelligently creating new events or updating existing ones.

**Next Steps:**

1.  **Full Verification of Event Updates:**
    *   Manually check Google Calendar to confirm the event (e.g., j3da1fum62bk395pg0pfje7n3s for case ADJ4004075) was indeed updated correctly.
    *   Conduct a thorough test of the update scenario: send/process another email for the same case number but with a different date/time to ensure the existing event is modified rather than a new one created.
2.  **Documentation:**
    *   Begin documenting the new calendar integration features, including the event update logic and the UI changes for manual analysis.
3.  **Future Enhancements (Discussion):**
    *   Revisit the idea of a checkbox system for batch email processing and calendaring.

Let's proceed with the full verification first.

## Advanced Swarm: Dynamic Prompt-Driven Orchestration (Voice/Text)

**Vision:** Enable users to issue complex, multi-part instructions (via voice dictation or detailed text prompts) that the system can intelligently dissect into a series of coordinated tasks. A "swarm" of agents/capabilities will then execute these tasks, potentially in parallel or sequence, to deliver a comprehensive set of results. This aims to mirror and automate complex workflows like the user's trial preparation example.

**User Scenario Example (Trial Preparation):**
1.  User provides initial case notes.
2.  User dictates/prompts for:
    *   Summarization of notes.
    *   Legal framework generation.
    *   Relevant case law retrieval.
    *   Arrangement of facts based on legal issues.
3.  User then dictates a hearing report and further instructions:
    *   Calendar the new hearing date (integrating with Google Calendar).
    *   Generate a formal hearing report document from the dictation and prior analysis.
    *   Develop a case strategy and a to-do plan.
    *   Draft letters (e.g., to doctors).
    *   Draft new legal petitions based on recommendations.
    *   Create follow-up tasks for various deadlines (e.g., exhibits).
4.  **Swarm Execution:** The system analyzes the full set of instructions, identifies all discrete tasks, assigns them to appropriate agents/capabilities, executes them, and consolidates the results for the user.

**Key Challenges & Requirements:**
*   **Advanced NLU & Intent Recognition:** To accurately parse complex prompts and extract individual tasks, parameters, and dependencies.
*   **Task Decomposition & Planning:** Breaking down a high-level goal into a sequence or graph of executable sub-tasks.
*   **Dynamic Capability Mapping:** Matching extracted tasks to the available granular capabilities (tools/agents).
*   **Orchestration Engine:** To manage the execution flow, data dependencies between tasks, and error handling for a set of inter-related operations.
*   **Context Management:** Maintaining context across multiple stages of a complex interaction.
*   **Result Aggregation & Presentation:** Consolidating outputs from various tasks into a coherent final deliverable.

**Relation to Swarm Templates & Automation Hub:**
*   This "Dynamic Prompt-Driven Swarm" can be conceptualized as a highly advanced, flexible swarm template.
*   The granular capabilities (e.g., "summarize_text", "find_case_law", "schedule_gcal_event", "draft_document_section", "create_todo_task") would be registered in the Automation Hub's Capability Registry.
*   Users might even be able to create simpler versions of such dynamic swarms by chaining together capabilities in a no-code/low-code interface within the Automation Hub, building on the template concept.

**Accomplished Steps Contributing to This Vision:**
*   **Granular Capability Implementation (Examples):**
    *   Google Calendar integration (`AiCalendarService.ts`): `findEventByCaseNumber`, `updateEvent`, `createEventFromAnalysis` (acts as a "schedule_calendar_event" capability).
    *   AI-driven email analysis (`EmailService.ts`, `geminiSimplifiedService`): Extracting meeting details, case numbers, event types (foundational for NLU and task parameter extraction).
    *   Basic Swarm Mechanics (`swarmStore.ts`, UI components): Framework for defining and managing swarms and agents.
    *   Specialized Legal Swarm Prototype: Demonstrated role-based agent assignment and parsing of specific inputs (hearing notes).
*   **Initial UI for Manual Triggering:** "Analyze" button for emails to trigger calendar actions.

**Next Steps Towards Dynamic Prompt-Driven Swarms:**

1.  **Formalize Capability Registry:**
    *   [ ] Define the data structure for `CapabilityDefinition` (as discussed: ID, name, description, parameters, underlying function/agent mapping).
    *   [ ] Create a prototype registry (e.g., a simple in-memory store or a new section in a Zustand store).
    *   [ ] Register existing functionalities (e.g., from `AiCalendarService`, `EmailService` AI analysis parts) as initial capabilities.

2.  **Develop Swarm Template System:**
    *   [x] Finalize `SwarmTemplate` and `SwarmRoleTemplate` data structures (Initial versions in `src/types/templates.ts`, review for completeness).
    *   [x] Implement store for Swarm Templates (e.g., `swarmTemplateStore.ts`) (Basic CRUD like create/fetch via `useSwarmTemplateStore` in `ConfigureSwarmPage.tsx`, review for full CRUD and backend integration).
    *   [~] Build basic UI for viewing and creating simple Swarm Templates (Automation Hub MVP - Phase 1) (`ConfigureSwarmPage.tsx` allows creating templates from configurations and loading them. Dedicated viewing/management UI for full CRUD might be pending).
        *   [x] Allow defining roles (UI exists in `ConfigureSwarmPage.tsx`); assigning *registered* capabilities depends on Capability Registry completion.

3.  **NLU & Task Extraction (Research & Prototyping):**
    *   [ ] Investigate and prototype using a powerful LLM (e.g., Gemini via API) for prompt dissection:
        *   Identify distinct tasks requested by the user.
        *   Extract key parameters for each task (dates, names, case numbers, topics, etc.).
        *   Attempt to identify simple dependencies (e.g., "summarize X, then use summary to draft Y").
    *   [ ] Design a standardized output format for the NLU component (e.g., a list of identified tasks with their parameters and target capabilities).

4.  **Simple Orchestrator for Dynamic Tasks:**
    *   [ ] Create a basic orchestrator service/function that can take a list of tasks (from NLU output) and execute them by invoking the mapped capabilities.
    *   [ ] Initially focus on sequential execution or simple parallel execution of independent tasks.
    *   [ ] Implement basic result collection.

5.  **User Interface for Prompt Input & Result Display:**
    *   [ ] Design a UI where a user can input a complex voice/text prompt.
    *   [ ] Display the dissected tasks (as understood by NLU) for user confirmation/adjustment (optional advanced feature).
    *   [ ] Present the aggregated results from the swarm execution.

6.  **Iterate on Legal Case Swarm as a Template:**
    *   [ ] Refactor the existing `Legal Case Swarm System` to use the new `SwarmTemplate` and `CapabilityRegistry` model. This makes it a concrete example within the Automation Hub.

**Considerations for Future Development:**
*   Voice input processing (speech-to-text integration).
*   Advanced workflow/dependency management in the orchestrator (e.g., DAG-based execution).
*   User feedback loops for clarifying ambiguous prompts.
*   Contextual awareness (remembering previous turns in a conversation that defines a complex task).
*   Security and permissions for accessing capabilities and data.

## Swarm Template System (Phase 1: Foundation)

- [x] **Define Swarm Template Data Structures:** (Initial versions exist, review for completeness)
  - [x] Create `src/types/templates.ts`.
  - [x] Define `AgentRoleDefinition` interface (roleName, description, requiredCapabilities, min/maxAgents).
  - [x] Define `SwarmTemplate` interface (id, name, description, templateType, roles, defaultInstructions, creatorId, timestamps, isSystemTemplate).
- [ ] **Database Schema for Swarm Templates (Supabase):** (Crucial next step for persistence)
  - [ ] Design `swarm_templates` table schema (columns: id, name, description, template_type, roles (JSONB), default_instructions, creator_id, created_at, updated_at, is_system_template).
  - [ ] Write SQL migration script for creating the `swarm_templates` table.
  - [ ] Implement appropriate RLS policies for the `swarm_templates` table.
- [~] **Implement Store/Service for Swarm Template CRUD Operations:** (Store exists, needs full CRUD & backend integration)
  - [x] Create `src/store/swarmTemplateStore.ts` (or `src/services/swarmTemplateService.ts`).
  - [x] Implement `createSwarmTemplate(templateData)` function.
  - [~] Implement `getSwarmTemplateById(id)` function (Store likely supports fetching; ensure explicit function if needed).
  - [x] Implement `getSwarmTemplates(filters)` function.
  - [ ] Implement `updateSwarmTemplate(id, updates)` function.
  - [ ] Implement `deleteSwarmTemplate(id)` function.

## Swarm Template System (Phase 2: Integration & UI)

- [x] **Integrate Templates into Swarm Creation Process:**
  - [x] Modify swarm creation UI (`ConfigureSwarmPage.tsx`) to allow selection from existing templates.
  - [x] Populate swarm configuration form based on the selected template.
  - [ ] Adapt `LegalSwarmProcessor` to potentially suggest using or saving a template.
- [x] **Implement "Save as Template" Functionality:**
  - [x] Add UI option to save a configured swarm (from `ConfigureSwarmPage.tsx`) as a new `SwarmTemplate`.
- [~] **Build UI for Basic Swarm Template Management (Optional MVP+):**
  - [~] Create a UI view to list, view user-created swarm templates (`ConfigureSwarmPage.tsx` lists for loading. Dedicated management for full CRUD: view details, edit, delete is pending).

## Teams Page (Slack Clone)

### Vision
Create a Slack-like real-time messaging interface for team communication, including channels, direct messages, and other collaborative features.

### Current Situation (Important Discovery)
*   `TeamService.ts` is **currently mocked**. It does not interact with a real backend database for pages (channels), threads (messages), or direct messages.
*   Frontend types (`src/types/team.ts`) and `TeamContext.tsx` define structures and functions for these features, but they operate on mock data.
*   The existing Supabase migration (`20240319_create_teams_table.sql`) only defines `teams` and `team_members` tables. Tables for `pages` (channels) and `messages` (or `threads`) need to be created.

### Revised Core Features (MVP - Focus on De-Mocking & Backend)
- [ ] **Backend - Database Schema (Supabase):**
    - [ ] Define and implement Supabase table schema for `pages` (acting as channels):
        -   `id` (UUID, PK)
        -   `team_id` (UUID, FK to `public.teams.id`, NOT NULL)
        -   `name` (TEXT, NOT NULL)
        -   `description` (TEXT, nullable)
        -   `created_by` (UUID, FK to `auth.users.id`, NOT NULL)
        -   `created_at` (TIMESTAMPTZ, default `now()`)
        -   `updated_at` (TIMESTAMPTZ, default `now()`)
        -   *(Consider: `is_private` (BOOLEAN, default `false`), `is_starred` (frontend concern initially))*
    - [ ] Define and implement Supabase table schema for `messages` (for page/channel communication):
        -   `id` (UUID, PK)
        -   `page_id` (UUID, FK to `pages.id`, NOT NULL)
        -   `user_id` (UUID, FK to `auth.users.id`, NOT NULL)
        -   `content` (TEXT, NOT NULL)
        -   `created_at` (TIMESTAMPTZ, default `now()`)
        -   `updated_at` (TIMESTAMPTZ, default `now()`)
        -   `parent_message_id` (UUID, FK to `messages.id`, nullable - for threads)
    - [ ] Define and implement Supabase table schema for `page_members` (if pages can have specific members different from team members, or for private page access):
        -   `page_id` (UUID, FK to `pages.id`)
        -   `user_id` (UUID, FK to `auth.users.id`)
        -   `role` (TEXT, e.g., 'member', 'admin_of_page') - Optional
        -   PRIMARY KEY (`page_id`, `user_id`)
    - [ ] Review and implement appropriate RLS (Row Level Security) policies for `pages` and `messages`.
        -   Users can see pages of teams they are members of.
        -   Users can create pages in teams they are members of.
        -   Users can see messages in pages they have access to.
        -   Users can send messages in pages they have access to.
        -   Page creators/team owners can manage pages.
- [ ] **Backend - `TeamService.ts` De-Mocking:**
    - [ ] Rewrite `TeamService.getTeams(userId)`:
        -   Fetch teams user is a member of (via `team_members`).
        -   For each team, fetch its associated `pages` from the new `pages` table.
        -   (Optionally for MVP, defer fetching all members/threads per team here if too heavy, fetch on demand).
    - [ ] Rewrite `TeamService.createPage(teamId, pageData)`:
        -   Insert a new row into the `pages` table, linking to `team_id` and `auth.uid()` as `created_by`.
    - [ ] Implement `TeamService.getMessages(pageId)`:
        -   Fetch messages for the given `page_id` from the `messages` table, ordered by `created_at`.
    - [ ] Implement `TeamService.sendMessage(pageId, userId, content, parentMessageId)`:
        -   Insert a new row into the `

## Knowledge Base & AI Drive Enhancements (Assistant Focused)

- [ ] **Knowledge Base Core Capabilities**
  - [ ] Ensure KB remembers conversation history for context.
  - [ ] Implement self-learning: KB learns from new knowledge and expands/teaches itself.
  - [ ] Solidify vector search capabilities.
  - [ ] Ingest and process sample petitions, briefs, templates, case law, and labor codes.
  - [ ] Enable KB to mimic user's writing style and tone.
  - [ ] Allow KB to be flexible, expand on existing knowledge, and offer new ideas.
- [ ] **AI Drive and Assistant Knowledge Base Integration**
  - [ ] Define clear strategy for `useKnowledgeBaseStore` to source data from AI Drive (Google Drive).
    - [ ] Option 1: `useKnowledgeBase` hook populates `useKnowledgeBaseStore` after Drive sync.
    - [ ] Option 2: `AIDrivePage.tsx` populates `useKnowledgeBaseStore` from `useKnowledgeBase` hook data.
  - [ ] Complete `syncDriveDocuments` in `src/hooks/useKnowledgeBase.ts` (Google Drive API integration).
  - [ ] Ensure `AssistantConfig.tsx` uses AI Drive-sourced folders/documents for linking to assistants.
- [ ] **Right Side Panel Quick Add Features**
  - [ ] Implement functionality to quickly copy-paste text/ideas into the knowledge base via the right-side panel.
  - [ ] Implement functionality to quickly add files to the knowledge base via the right-side panel.