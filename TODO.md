# GenieFlowAI TODO List

## High Priority

- [ ] **Code Cleanup**
  - [x] Consolidate duplicate utility functions into centralized files
    - [x] Consolidated cn utility
    - [x] Consolidated date utilities
    - [x] Consolidated avatar utility
    - [x] Consolidated encryption utilities
    - [x] Consolidated key validation utilities
    - [ ] Consolidate remaining utility functions
  - [x] Clean up duplicate exports in page indices
  - [x] Mark deprecated components with proper annotations
  - [x] Fix deprecated utility imports
  - [ ] Remove redundant styles and standardize CSS approach
  - [ ] Fix linter errors throughout codebase (especially in UI components)
  - [ ] Convert remaining JavaScript files to TypeScript
  - [ ] Standardize component interfaces and patterns
  - [ ] Remove or refactor duplicate page components (Login.tsx → LoginPage.tsx)

- [ ] **Bug Fixes**
  - [x] Fix CSS import issues in remaining components 
  - [x] Fix duplicate component imports (AIDrivePage)
  - [ ] Fix Calendar component date picking functionality
  - [ ] Resolve type errors in AI Document interfaces
  - [ ] Address missing dependencies in UI components
  - [ ] Fix linter errors in test files 

- [ ] **Performance Improvements**
  - [ ] Implement code splitting for large pages
  - [ ] Optimize bundle size by reducing unused dependencies
  - [ ] Add lazy loading for non-critical components
  - [ ] Review and optimize React renders

## Medium Priority

- [ ] **Feature Completion**
  - [x] Implement Teams collaboration feature
    - [x] Create TeamsSidebar component with Pages and Threads
    - [x] Build TeamsPage interface with message system
    - [x] Add AI Expert team member integration
    - [x] Implement mentions system for team communication
  - [ ] Complete subscription management system
  - [ ] Finalize email integration with SMTP providers
  - [ ] Complete document knowledge base integration
  - [ ] Finish advanced AI agent configuration interface

- [ ] **Testing**
  - [ ] Add unit tests for core utilities
  - [ ] Add component tests for UI library
  - [ ] Implement integration tests for critical user flows
  - [ ] Add E2E tests for main application paths

- [ ] **Documentation**
  - [x] Document codebase structure and architecture
  - [ ] Document component API for UI library
  - [ ] Add JSDoc comments to utility functions
  - [ ] Create user guide for application features
  - [ ] Add developer onboarding guide
  - [ ] Create code style guide for naming conventions

## Low Priority

- [ ] **Future Features**
  - [ ] Add voice controls to main interface
  - [ ] Implement advanced analytics dashboard
  - [ ] Build workflow automation builder
  - [ ] Create enterprise admin features

- [ ] **Optimizations**
  - [ ] PWA support for offline functionality
  - [ ] Add client-side caching strategies
  - [ ] Optimize for mobile touch interactions
  - [ ] Implement advanced animation transitions
  - [ ] Add linting rules to prevent usage of deprecated components 