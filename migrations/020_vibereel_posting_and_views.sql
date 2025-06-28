-- Add posted_at field to vibe_reels for tracking when a VibeReel is shared with friends
ALTER TABLE vibe_reels 
ADD COLUMN posted_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for efficient querying of posted VibeReels
CREATE INDEX idx_vibe_reels_posted ON vibe_reels(posted_at) 
WHERE posted_at IS NOT NULL;

-- Create index for finding active friend VibeReels
CREATE INDEX idx_vibe_reels_active_posted ON vibe_reels(creator_id, posted_at) 
WHERE posted_at IS NOT NULL;

-- Create vibe_reel_views table for tracking who has viewed each VibeReel
CREATE TABLE vibe_reel_views (
  vibe_reel_id UUID NOT NULL REFERENCES vibe_reels(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (vibe_reel_id, viewer_id)
);

-- Index for efficient lookups
CREATE INDEX idx_vibe_reel_views_viewer ON vibe_reel_views(viewer_id, viewed_at DESC);

-- Enable Row Level Security
ALTER TABLE vibe_reel_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vibe_reel_views

-- Users can view their own view records
CREATE POLICY "Users can view their own view records" ON vibe_reel_views
  FOR SELECT USING (
    auth.uid() = viewer_id
  );

-- Users can insert their own view records
CREATE POLICY "Users can insert their own view records" ON vibe_reel_views
  FOR INSERT WITH CHECK (
    auth.uid() = viewer_id
  );

-- Drop existing policy first
DROP POLICY IF EXISTS "Users can view their own vibe_reels" ON vibe_reels;

-- Create new policy for vibe_reels to allow viewing posted VibeReels from friends
CREATE POLICY "Users can view their own and friends posted vibe_reels" ON vibe_reels
  FOR SELECT USING (
    auth.uid() = creator_id OR 
    (
      posted_at IS NOT NULL AND
      posted_at > NOW() - INTERVAL '24 hours' AND
      EXISTS (
        SELECT 1 FROM friendships 
        WHERE friendships.user_id = auth.uid() 
        AND friendships.friend_id = vibe_reels.creator_id 
        AND friendships.status = 'accepted'
      )
    )
  );

-- Enable Realtime for vibe_reel_views
ALTER PUBLICATION supabase_realtime ADD TABLE vibe_reel_views;