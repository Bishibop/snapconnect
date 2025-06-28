-- Update art_pieces table to support 768-dimensional embeddings
-- The current CLIP model (ViT-L) outputs 768 dimensions
-- Note: All embeddings in a column must have the same dimension in pgvector

-- First, we need to drop the existing column and recreate it with the new dimension
ALTER TABLE art_pieces DROP COLUMN IF EXISTS embedding;
ALTER TABLE art_pieces ADD COLUMN embedding vector(768);

-- Update the similarity function to handle 768-dimensional vectors
CREATE OR REPLACE FUNCTION find_similar_art(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.8,
  match_count int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  image_url text,
  vibe_count integer,
  similarity float,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ap.id,
    ap.user_id,
    ap.image_url,
    ap.vibe_count,
    1 - (ap.embedding <=> query_embedding) AS similarity,
    ap.created_at
  FROM art_pieces ap
  WHERE ap.embedding IS NOT NULL
    AND 1 - (ap.embedding <=> query_embedding) >= match_threshold
  ORDER BY ap.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Recreate the vector index for the new dimension
CREATE INDEX IF NOT EXISTS idx_art_pieces_embedding ON art_pieces 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);