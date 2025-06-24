-- Stories table for 24-hour visual posts
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  media_url TEXT NOT NULL, -- just the storage path
  snap_type TEXT NOT NULL CHECK (snap_type IN ('photo', 'video')),
  filter_type TEXT,
  duration INTEGER, -- video duration in seconds
  is_active BOOLEAN DEFAULT true, -- for soft delete
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
  CONSTRAINT stories_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Performance Indexes
CREATE INDEX idx_stories_active ON stories(user_id, is_active, expires_at);
CREATE INDEX idx_stories_user ON stories(user_id, created_at DESC);
CREATE INDEX idx_stories_active_unexpired ON stories(is_active, expires_at) WHERE is_active = true AND expires_at > NOW();

-- Row Level Security
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Users can view stories from their friends and their own stories
CREATE POLICY "Users can view stories from friends and themselves" ON stories
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM friendships 
      WHERE friendships.user_id = auth.uid() 
      AND friendships.friend_id = stories.user_id 
      AND friendships.status = 'accepted'
    )
  );

-- Users can only insert their own stories
CREATE POLICY "Users can insert their own stories" ON stories
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Users can only update their own stories (for soft delete)
CREATE POLICY "Users can update their own stories" ON stories
  FOR UPDATE USING (
    auth.uid() = user_id
  ) WITH CHECK (
    auth.uid() = user_id
  );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE stories;