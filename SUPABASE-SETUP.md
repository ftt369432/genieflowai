# Supabase Vector Database Setup Guide

This guide will walk you through setting up Supabase with vector storage for your GenieFlow AI application.

## Prerequisites

1. A Supabase account (free tier works fine)
2. Node.js installed on your machine
3. OpenAI API key (for generating embeddings)

## Step 1: Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign in or create an account
2. Click "New Project" 
3. Enter "GenieFlow" as your project name
4. Create a secure database password and save it somewhere safe
5. Select a region close to your users
6. Click "Create new project"

## Step 2: Get Your Supabase Credentials

1. In your Supabase dashboard, go to Project Settings > API
2. Copy your **Project URL** and **anon/public** key
3. You'll need these for the next step

## Step 3: Configure Your Environment Variables

Run the setup script to configure your environment variables:

```bash
node setup-env.js
```

This will prompt you to enter:
- Your Supabase URL
- Your Supabase Anon Key
- Your OpenAI API Key (for generating embeddings)

## Step 4: Set Up the Database Schema

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the contents of `setup-database.sql` (or open and copy its contents)
3. Paste it into the SQL Editor
4. Click "Run" to execute the SQL script

The script will:
- Enable the pgvector extension
- Create a documents table with vector support
- Set up row-level security policies
- Create text search indexes
- Set up a vector similarity search function

## Step 5: Test Your Connection

Run the test script to verify your Supabase connection:

```bash
node test-supabase.js
```

If everything is set up correctly, you should see a success message.

## Step 6: Use the Supabase Document Service

The application now has a Supabase document service implementation at:
```
src/services/documents/supabaseDocumentService.ts
```

This service provides methods for:
- Adding documents with vector embeddings
- Fetching documents
- Searching documents by vector similarity
- Searching documents by text
- Deleting documents

## Troubleshooting

If you encounter any issues:

1. **Connection Failed**: Double-check your Supabase URL and Anon Key
2. **pgvector Extension Error**: Make sure you've run the setup SQL script
3. **Authentication Error**: Check that your Supabase authentication is set up correctly
4. **Embedding Error**: Verify your OpenAI API key is correct

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings Documentation](https://platform.openai.com/docs/guides/embeddings) 