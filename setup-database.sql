-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create function to check if vector extension is installed
CREATE OR REPLACE FUNCTION check_vector_extension()
RETURNS TEXT AS $$
BEGIN
  RETURN 'pgvector extension is installed';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'pgvector extension is NOT installed';
END;
$$ LANGUAGE plpgsql;

-- Create the documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB DEFAULT '{}'::JSONB,
  type TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  file_url TEXT,
  size INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create text search index for faster full-text search
CREATE INDEX IF NOT EXISTS documents_content_search_idx ON documents 
USING GIN (to_tsvector('english', content));

CREATE INDEX IF NOT EXISTS documents_title_search_idx ON documents 
USING GIN (to_tsvector('english', title));

-- Create vector index for similarity search using HNSW
CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents 
USING hnsw (embedding vector_cosine_ops);

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies for document access
CREATE POLICY "Users can view their own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON documents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON documents FOR DELETE
  USING (auth.uid() = user_id);

-- Create a function for vector similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.title,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM documents d
  WHERE 1 - (d.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$; 