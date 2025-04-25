feat(legal): implement specialized legal case swarm system

This commit adds a comprehensive legal case management system based on our 
agent swarm architecture. The implementation includes:

- Legal Case Swarm Template with specialized roles (Case Coordinator, Legal Researcher, etc.)
- Legal-specific agent capabilities (legal-research, case-management, etc.)
- Legal Swarm Processor for parsing hearing notes with regex pattern detection
- Automatic agent assignment logic to match capabilities with case requirements
- Legal Case Input Component for UI that detects pasted legal content
- Dedicated legal swarm creation page at /legal-swarm

Key features:
- Automatic extraction of key information like applicant name, hearing status
- Medical evidence analysis capabilities
- Intelligent role assignment based on case complexity
- Support for different legal case types
- Specialized document processing for legal documents

Related interfaces have been added to the legal.ts type definitions file.
Progress and todo tracking has been updated to reflect these new features.

Closes #142
Relates to #158, #163 