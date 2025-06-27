-- Create vibe_reels table for collaborative art stories
CREATE TABLE vibe_reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  primary_art_id UUID REFERENCES art_pieces(id) ON DELETE CASCADE,
  selected_art_ids UUID[] NOT NULL, -- up to 7 pieces
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT selected_art_limit CHECK (array_length(selected_art_ids, 1) <= 7)
);

-- Performance indexes
CREATE INDEX idx_vibe_reels_creator ON vibe_reels(creator_id, created_at DESC);
CREATE INDEX idx_vibe_reels_art ON vibe_reels USING GIN(selected_art_ids);
CREATE INDEX idx_vibe_reels_primary_art ON vibe_reels(primary_art_id);

-- Enable RLS
ALTER TABLE vibe_reels ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view all vibe reels" ON vibe_reels
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own vibe reels" ON vibe_reels
  FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own vibe reels" ON vibe_reels
  FOR UPDATE
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own vibe reels" ON vibe_reels
  FOR DELETE
  USING (auth.uid() = creator_id);

-- Enable realtime for vibe reels
ALTER PUBLICATION supabase_realtime ADD TABLE vibe_reels;