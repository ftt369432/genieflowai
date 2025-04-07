-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- AI Drive files table
CREATE TABLE IF NOT EXISTS ai_drive_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size BIGINT NOT NULL,
  parent_id UUID REFERENCES ai_drive_files(id),
  is_folder BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_trashed BOOLEAN DEFAULT FALSE,
  storage_path TEXT,
  embedding VECTOR(1536),
  content_preview TEXT,
  thumbnail_url TEXT,
  ai_summary TEXT,
  ai_topics TEXT[] DEFAULT '{}',
  ai_entities JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  shared_with TEXT[] DEFAULT '{}',
  permissions JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- AI Drive file versions for keeping history
CREATE TABLE IF NOT EXISTS ai_drive_file_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID REFERENCES ai_drive_files(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users NOT NULL,
  version_number INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  size BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  comment TEXT
);

-- AI Drive sharing table
CREATE TABLE IF NOT EXISTS ai_drive_sharing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID REFERENCES ai_drive_files(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users NOT NULL,
  shared_with UUID REFERENCES auth.users,
  shared_email TEXT,
  permission_level TEXT NOT NULL DEFAULT 'viewer', -- viewer, editor, owner
  share_link TEXT,
  is_link_sharing BOOLEAN DEFAULT FALSE,
  link_expiry TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- AI Drive comments
CREATE TABLE IF NOT EXISTS ai_drive_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID REFERENCES ai_drive_files(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES ai_drive_comments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE
);

-- AI Drive file labels/tags
CREATE TABLE IF NOT EXISTS ai_drive_labels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Many-to-many relationship between files and labels
CREATE TABLE IF NOT EXISTS ai_drive_file_labels (
  file_id UUID REFERENCES ai_drive_files(id) ON DELETE CASCADE,
  label_id UUID REFERENCES ai_drive_labels(id) ON DELETE CASCADE,
  PRIMARY KEY (file_id, label_id)
);

-- AI Drive smart collections (saved queries/filters)
CREATE TABLE IF NOT EXISTS ai_drive_smart_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  query JSONB NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- AI Document insights table
CREATE TABLE IF NOT EXISTS ai_drive_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID REFERENCES ai_drive_files(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- summary, key_points, sentiment, entities, etc.
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Row level security policies
ALTER TABLE ai_drive_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_drive_file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_drive_sharing ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_drive_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_drive_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_drive_file_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_drive_smart_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_drive_insights ENABLE ROW LEVEL SECURITY;

-- Basic security policies

-- Files: users can see their own files or files shared with them
CREATE POLICY "Users can view their own files or shared files" 
  ON ai_drive_files FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    auth.uid()::text = ANY(shared_with) OR
    EXISTS (
      SELECT 1 FROM ai_drive_sharing 
      WHERE file_id = ai_drive_files.id AND shared_with = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own files" 
  ON ai_drive_files FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own files" 
  ON ai_drive_files FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files" 
  ON ai_drive_files FOR DELETE 
  USING (auth.uid() = user_id);

-- Similar policies for other tables
-- File versions
CREATE POLICY "Users can view file versions they own or have access to" 
  ON ai_drive_file_versions FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM ai_drive_files 
      WHERE ai_drive_files.id = ai_drive_file_versions.file_id AND 
      (auth.uid() = ai_drive_files.user_id OR 
       auth.uid()::text = ANY(ai_drive_files.shared_with) OR
       EXISTS (
         SELECT 1 FROM ai_drive_sharing 
         WHERE file_id = ai_drive_files.id AND shared_with = auth.uid()
       ))
    )
  );

-- File search function using vector similarity
CREATE OR REPLACE FUNCTION search_ai_drive_files(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  user_id_input UUID
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  mime_type TEXT,
  parent_id UUID,
  is_folder BOOLEAN,
  content_preview TEXT,
  ai_summary TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.name,
    f.mime_type,
    f.parent_id,
    f.is_folder,
    f.content_preview,
    f.ai_summary,
    1 - (f.embedding <=> query_embedding) as similarity
  FROM ai_drive_files f
  WHERE 
    f.embedding IS NOT NULL AND
    1 - (f.embedding <=> query_embedding) > match_threshold AND
    (f.user_id = user_id_input OR 
     user_id_input::text = ANY(f.shared_with) OR
     EXISTS (
       SELECT 1 FROM ai_drive_sharing 
       WHERE file_id = f.id AND shared_with = user_id_input
     ))
  ORDER BY f.embedding <=> query_embedding
  LIMIT match_count;
END;
$$; 