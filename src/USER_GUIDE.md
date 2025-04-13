# GenieFlowAI User Guide (Beta)

## Quick Start Guide

Welcome to GenieFlowAI, your AI-powered productivity suite! This guide will help you get started with the core features available in our beta release.

### Accessing the Application

1. Visit [genieflowai.com](https://genieflowai.com) to access the application
2. Create an account or log in with existing credentials
3. You'll be directed to your personalized dashboard

## Core Features

### 1. Email Management

GenieFlowAI provides a powerful email interface with AI-powered features:

- **Email Inbox**: Access your emails from the sidebar by clicking "Email"
- **AI Analysis**: The system automatically analyzes emails to identify:
  - Action items (tasks)
  - Meeting details
  - Priority level
  - Response requirements
- **Task Creation**: Extract tasks directly from emails
- **Email Composer**: Create and send new emails with AI assistance
- **Folders**: Navigate between Inbox, Sent, Archive, and Trash

### 2. Task Management

Stay organized with the built-in task management system:

- **Task Dashboard**: View all your tasks sorted by status
- **Task Creation**: Create tasks manually or extract them from emails
- **Task Details**: Set priorities, due dates, and notes
- **Task Organization**: Group tasks by projects, tags, or status

### 3. Calendar Integration

Manage your schedule effectively:

- **Calendar View**: View and manage events in day, week, or month view
- **Event Creation**: Create events manually or from tasks/emails
- **Meeting Scheduling**: Schedule meetings with participants

### 4. AI Assistant

Get help with your daily work:

- **AI Chat**: Ask questions and get assistance with tasks
- **Document Analysis**: Extract insights from documents
- **Email Drafting**: Get help composing emails

## AI Assistants with Knowledge Base

GenieFlowAI allows you to create custom AI assistants with their own specialized knowledge bases. This feature allows your assistants to reference specific documents and information when answering questions.

### Creating Assistants with Knowledge Base

1. Navigate to the **Assistants** section in the sidebar
2. Click **Create Assistant** or **Interactive Create** 
3. Configure the basic information:
   - Name
   - Description
   - System Prompt (instructions that define how the assistant behaves)
4. Navigate to the **Knowledge** tab
5. Create a new folder or select existing folders to include in the assistant's knowledge base
6. Upload documents to these folders that the assistant should use as reference

### Knowledge Base Features

#### Document Management
- Create multiple folders to organize your knowledge
- Upload various file types (text, PDF, Office documents)
- Search across documents
- Tag documents for better organization

#### Google Drive Integration
- Connect to your Google Drive to access your files
- Import documents directly from Google Drive to the knowledge base
- Keep your knowledge base in sync with your existing documents

#### Knowledge Retrieval
When you chat with an assistant, it will:
1. Find the most relevant documents to your query
2. Generate a response that incorporates information from these documents
3. Provide sources and citations for where the information came from

### Tips for Effective Knowledge Bases

- Use descriptive folder names to organize documents by topic or purpose
- Upload high-quality, relevant documents
- Add detailed system prompts that tell the assistant how to use the knowledge
- Test your assistant with various questions to see how well it retrieves information

### Supported File Types

- Text files (.txt)
- Markdown (.md)
- PDF documents (.pdf)
- Microsoft Office documents (.docx, .xlsx, .pptx)
- Google Workspace documents (via Google Drive)
- Images (with text extraction)

## Known Limitations (Beta)

- **Email Integration**: Limited to one email account per user
- **Calendar Sync**: One-way sync only (changes in external calendars may not appear)
- **Mobile Experience**: Optimized for desktop, mobile support is limited
- **Advanced Analytics**: Currently in development

## Getting Help

- Click on the "?" icon in the header for contextual help
- Send feedback through the feedback form in the user menu
- Contact support at support@genieflowai.com

## Coming Soon

We're actively working on enhancing GenieFlowAI with additional features:

- Advanced analytics dashboard
- Mobile application
- Multi-account email support
- Calendar synchronization improvements
- Enhanced AI capabilities

Thank you for being an early user of GenieFlowAI! Your feedback helps us improve. 

## Other GenieFlowAI Features

[Additional feature documentation would go here...]

## Theme System

GenieFlowAI includes a robust theme system that allows users to customize the appearance of the application. The theme system supports:

- Light and dark modes
- System preference detection
- Multiple theme styles (default, cyberpunk, etc.)
- Theme persistence across sessions

### Using Themes

- Toggle between light and dark mode using the theme switcher in the navigation bar
- Select "System" to automatically follow your operating system's dark/light preference
- Theme preferences are saved to localStorage and persist across sessions

### For Developers

The theme system is implemented using React Context. When working with the theme:

- Use the `useTheme()` hook from `src/contexts/ThemeContext.tsx` to access the current theme and theme functions
- Do not use the `useGlobalTheme()` hook from `src/hooks/useTheme.ts` as it's provided for legacy compatibility
- The `ThemeProvider` should be at the root of the application to ensure theme context is available throughout

## Document Management

The Documents section allows you to manage all your files in one place. You can upload, view, organize, and download various file types including PDFs, images, and text documents.

### Features:

- **Upload Documents:** Click the "Upload New" button to add files to your document library
- **View Documents:** Click on any document card to preview its contents
- **Search:** Use the search box to find documents by name or description
- **Filter by Tags:** Use the filter button to show only documents with specific tags
- **Document Tagging:** Add tags to documents during upload to help with organization
- **Download:** Download any document for offline use

### Supported File Types:

- PDF files (.pdf)
- Images (.jpg, .jpeg, .png, .gif)
- Text documents (.txt, .md, .doc, .docx)

### Tips:

- Use descriptive names and detailed descriptions to make documents easier to find
- Apply consistent tags across related documents to create logical groupings
- The document viewer provides different viewing options based on the file type 