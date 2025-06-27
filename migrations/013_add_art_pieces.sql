-- Create art_pieces table for global art pool with CLIP embeddings
CREATE TABLE art_pieces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  embedding VECTOR(512), -- CLIP embedding dimension
  vibe_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector similarity index using ivfflat
CREATE INDEX art_pieces_embedding_idx ON art_pieces
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Performance indexes
CREATE INDEX idx_art_pieces_user ON art_pieces(user_id, created_at DESC);
CREATE INDEX idx_art_pieces_popular ON art_pieces(vibe_count DESC, created_at DESC);

-- Enable RLS
ALTER TABLE art_pieces ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view all art pieces" ON art_pieces
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own art pieces" ON art_pieces
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own art pieces" ON art_pieces
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own art pieces" ON art_pieces
  FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime for art pieces
ALTER PUBLICATION supabase_realtime ADD TABLE art_pieces;