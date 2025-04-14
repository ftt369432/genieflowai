-- Create pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge base documents for AI Assistants
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  type TEXT NOT NULL DEFAULT 'document', -- document, pdf, text, etc.
  size INT DEFAULT 0, -- File size in bytes
  file_url TEXT,  -- URL for file storage
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::JSONB,
  folder_id TEXT,  -- Parent folder ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for vector search
CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Document folders
CREATE TABLE IF NOT EXISTS document_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES document_folders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Assistant knowledge base linking table
CREATE TABLE IF NOT EXISTS assistant_knowledge (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assistant_id UUID NOT NULL, -- Link to assistants table
  folder_id UUID REFERENCES document_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Log table for embedding generation
CREATE TABLE IF NOT EXISTS embedding_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text_length INT NOT NULL,
  model TEXT NOT NULL,
  dimensions INT NOT NULL,
  status TEXT NOT NULL,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create similarity search function
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  type TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.title,
    documents.content,
    documents.type,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Row level security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE embedding_logs ENABLE ROW LEVEL SECURITY;

-- Document access policies
CREATE POLICY "Users can view their own documents" 
  ON documents FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documents" 
  ON documents FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
  ON documents FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
  ON documents FOR DELETE 
  USING (auth.uid() = user_id);

-- Folder access policies
CREATE POLICY "Users can view their own folders" 
  ON document_folders FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders" 
  ON document_folders FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" 
  ON document_folders FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" 
  ON document_folders FOR DELETE 
  USING (auth.uid() = user_id);

-- Assistant knowledge policies
CREATE POLICY "Users can manage assistant knowledge links" 
  ON assistant_knowledge FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM document_folders 
    WHERE document_folders.id = assistant_knowledge.folder_id 
    AND document_folders.user_id = auth.uid()
  ));

-- Admin access to embedding logs
CREATE POLICY "Only service role can access embedding logs" 
  ON embedding_logs FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role'); 