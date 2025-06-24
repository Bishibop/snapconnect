-- Friendships (bidirectional - 2 records per friendship)
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted')),
  requested_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CONSTRAINT friendships_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT friendships_friend_id_fkey FOREIGN KEY (friend_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT friendships_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Users can only see friendships they're part of
CREATE POLICY "Users can view own friendships" ON friendships
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can only insert friendships where they are the requester
CREATE POLICY "Users can create friend requests" ON friendships
  FOR INSERT WITH CHECK (auth.uid() = requested_by AND auth.uid() = user_id);

-- Users can only update friendships they're part of (for accepting/declining)
CREATE POLICY "Users can update own friendships" ON friendships
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can only delete friendships they're part of
CREATE POLICY "Users can delete own friendships" ON friendships
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Performance Indexes
CREATE INDEX idx_friendships_users ON friendships(user_id, status);
CREATE INDEX idx_friendships_pending ON friendships(friend_id, status) WHERE status = 'pending';
CREATE INDEX idx_friendships_accepted ON friendships(user_id, friend_id) WHERE status = 'accepted';

-- Function to auto-create bidirectional friendship when one is accepted
CREATE OR REPLACE FUNCTION create_bidirectional_friendship()
RETURNS TRIGGER AS $$
BEGIN
  -- When a friendship is accepted, create the reverse friendship if it doesn't exist
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO friendships (user_id, friend_id, status, requested_by, created_at, updated_at)
    VALUES (NEW.friend_id, NEW.user_id, 'accepted', NEW.requested_by, NEW.updated_at, NEW.updated_at)
    ON CONFLICT (user_id, friend_id) DO UPDATE SET
      status = 'accepted',
      updated_at = NEW.updated_at;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create bidirectional friendship on acceptance
CREATE TRIGGER on_friendship_accepted
  AFTER UPDATE ON friendships
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND OLD.status = 'pending')
  EXECUTE FUNCTION create_bidirectional_friendship();