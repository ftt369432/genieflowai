-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Legal documents table
CREATE TABLE IF NOT EXISTS legal_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  document_type TEXT NOT NULL, -- brief, petition, memo, etc.
  status TEXT NOT NULL DEFAULT 'draft', -- draft, published, archived
  embedding VECTOR(1536),
  metadata JSONB DEFAULT '{}'::JSONB,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Citations table to track legal references
CREATE TABLE IF NOT EXISTS citations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES legal_documents ON DELETE CASCADE,
  citation_text TEXT NOT NULL,
  source TEXT,
  url TEXT,
  relevance_score FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Document templates
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  document_type TEXT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Writing style profiles
CREATE TABLE IF NOT EXISTS writing_styles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  characteristics JSONB NOT NULL,
  sample_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Row level security policies
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_styles ENABLE ROW LEVEL SECURITY;

-- Document access policies
CREATE POLICY "Users can view their own documents" 
  ON legal_documents FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documents" 
  ON legal_documents FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
  ON legal_documents FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
  ON legal_documents FOR DELETE 
  USING (auth.uid() = user_id);

-- Similar policies for other tables
-- Citations
CREATE POLICY "Users can manage citations for their documents" 
  ON citations FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM legal_documents 
    WHERE legal_documents.id = citations.document_id 
    AND legal_documents.user_id = auth.uid()
  ));

-- Templates
CREATE POLICY "Users can view public templates or their own" 
  ON document_templates FOR SELECT 
  USING (is_public OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own templates" 
  ON document_templates FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Writing styles
CREATE POLICY "Users can manage their own writing styles" 
  ON writing_styles FOR ALL 
  USING (auth.uid() = user_id);

-- Create search functions
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  document_type TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    legal_documents.id,
    legal_documents.title,
    legal_documents.content,
    legal_documents.document_type,
    1 - (legal_documents.embedding <=> query_embedding) as similarity
  FROM legal_documents
  WHERE 1 - (legal_documents.embedding <=> query_embedding) > match_threshold
  ORDER BY legal_documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$; 