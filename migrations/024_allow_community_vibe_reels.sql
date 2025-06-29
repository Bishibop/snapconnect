-- Allow users to see all posted vibe reels for community feed
-- This enables the community tab to show all posted vibe reels from all users

-- Drop the existing policy that restricts viewing to friends only
DROP POLICY IF EXISTS "Users can view their own and friends posted vibe_reels" ON vibe_reels;

-- Create new policy that allows viewing all posted vibe reels
CREATE POLICY "Users can view their own and all posted vibe_reels" ON vibe_reels
  FOR SELECT USING (
    auth.uid() = creator_id OR 
    posted_at IS NOT NULL  -- Any posted vibe reel is visible to all users
  );