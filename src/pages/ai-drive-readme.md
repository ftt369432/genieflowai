# AI Drive

AI Drive is a powerful document management system enhanced with AI capabilities, providing an intelligent way to store, organize, and analyze your documents.

## Features

### Document Management
- Upload and organize files and folders
- Search files using both traditional and semantic search
- View file details and history
- Share files with other users
- Download files

### AI Capabilities
- Automatic document summarization
- Content analysis with key topics extraction
- Semantic search using embeddings
- Question answering about document content
- Smart collections based on content

## Technical Details

### Database Structure
AI Drive uses Supabase as its backend with the following tables:
- `ai_drive_files`: Stores file metadata and AI-generated insights
- `ai_drive_file_versions`: Tracks version history for files
- `ai_drive_sharing`: Manages file sharing permissions
- `ai_drive_comments`: Stores comments on files
- `ai_drive_labels`: Manages user-created labels/tags
- `ai_drive_file_labels`: Junction table between files and labels
- `ai_drive_smart_collections`: Stores saved searches and filter configurations

### AI Capabilities

The system uses:
- OpenAI embeddings for semantic search and content similarity
- Text generation for summarization and answering questions
- Vector search for finding semantically similar documents

### File Processing
- Text extraction from various file formats (PDF, DOCX, TXT, etc.)
- Content preview generation
- Automatic topic extraction and categorization

## Getting Started

1. Navigate to the AI Drive page from the sidebar
2. Upload your first document
3. Explore AI-powered insights by clicking on "AI Analysis"
4. Try asking questions about your document content
5. Create folders to organize your files

## Dependencies

- Supabase for database and storage
- OpenAI API for AI capabilities
- PDF.js for PDF processing
- Mammoth for DOCX processing

## Security

All files are protected by Supabase Row Level Security policies to ensure that:
- Users can only access their own files
- Files can only be shared explicitly
- All file operations are properly authorized 