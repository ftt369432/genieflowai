# GenieFlowAI Documentation Structure

This document provides an overview of the documentation files in the GenieFlowAI project.

## Documentation Organization

The project documentation is distributed across several specialized Markdown files:

| File                             | Purpose                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------- |
| **TODO.md**                      | Main project overview with design principles, project structure, and prioritized task lists |
| **FEATURES.md**                  | Detailed feature tracking with implementation statuses and roadmap                          |
| **PROGRESS.md**                  | Current progress tracker with completed/in-progress tasks and sprint history                |
| **USER_GUIDE.md**                | End-user documentation for GenieFlowAI features                                             |
| **DEPLOYMENT.md**                | Instructions for deploying the application                                                  |
| **README.md**                    | Quick start guide and project introduction                                                  |
| **LAUNCH_CHECKLIST.md**          | Pre-launch verification items                                                               |
| Various specialized README files | Component-specific documentation                                                            |

## Known Duplication Issues

- The `.bolt/prompt` file contains UI/UX design guidelines that are already present in the `TODO.md` file. This duplication should be resolved in future cleanup.

## Documentation Guidelines

When updating documentation:

1. Use the appropriate specialized file for your updates
2. Maintain consistent formatting within each document
3. Update the main TODO.md for new tasks and priorities
4. Keep PROGRESS.md updated with completion status
5. Cross-reference between documents when appropriate

## Documentation Improvement Plan

- [ ] Consolidate duplicate design guidelines
- [ ] Standardize documentation format across all files
- [ ] Create component API documentation
- [ ] Improve developer onboarding guide
- [ ] Add JSDoc comments to code
