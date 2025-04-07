# Supabase Integration Guide

This folder contains the necessary files for Supabase integration with the GenieFlow AI application.

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and create an account if you don't have one
2. Create a new project in the Supabase dashboard
3. Take note of your project URL and anon/public API key

### 2. Update Environment Variables

In your project's `.env` file, add the Supabase credentials:

```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Create Database Tables

You can run the migrations in one of two ways:

#### Option 1: Using the Supabase Web Interface

1. Go to your Supabase project
2. Go to the SQL Editor
3. Create a new query
4. Copy the contents from `migrations/create_tables.sql`
5. Run the query

#### Option 2: Using Supabase CLI

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link to your project:
   ```bash
   supabase login
   supabase link --project-ref your-project-id
   ```

3. Run the migrations:
   ```bash
   supabase db push
   ```

### 4. Configure Authentication

1. In the Supabase dashboard, go to Authentication > Settings
2. Configure your site URL and redirect URLs
3. Enable the Email provider at minimum
4. (Optional) Configure additional auth providers as needed

### 5. Verify Setup

1. Run your application
2. Test user registration and login
3. Test document creation and retrieval

## Database Schema

### Profiles Table

Stores user profile information:

- `id` - UUID from auth.users (primary key)
- `email` - User's email address
- `full_name` - User's full name
- `avatar_url` - URL to user's avatar image
- `role` - User role (default: 'user')
- `created_at` - Timestamp when profile was created
- `updated_at` - Timestamp when profile was last updated
- `preferences` - JSON object for user preferences

### Documents Table

Stores user documents:

- `id` - UUID (primary key)
- `user_id` - Foreign key to auth.users
- `name` - Document name
- `type` - Document type (pdf, doc, txt, md)
- `content` - Document content
- `tags` - Array of tags
- `size` - Document size in bytes
- `metadata` - Additional metadata as JSON
- `created_at` - Timestamp when document was created
- `updated_at` - Timestamp when document was last updated

### Email Accounts Table

Stores user email account credentials:

- `id` - UUID (primary key)
- `user_id` - Foreign key to auth.users
- `name` - Account display name
- `email` - Email address
- `provider` - Email provider (google, imap, smtp)
- `access_token` - OAuth access token (encrypted)
- `refresh_token` - OAuth refresh token (encrypted)
- `password` - Email password for IMAP/SMTP (encrypted)
- `imap_host` - IMAP server hostname
- `imap_port` - IMAP server port
- `smtp_host` - SMTP server hostname
- `smtp_port` - SMTP server port
- `use_ssl` - Whether to use SSL for connection
- `created_at` - Timestamp when email account was created
- `updated_at` - Timestamp when email account was last updated

## Row Level Security

All tables have Row Level Security enabled, restricting users to only access their own data. 