-- Remove 24-hour time limit from VibeReel visibility
-- This allows friends to see all posted VibeReels, not just recent ones

-- Drop the existing policy with 24-hour restriction
DROP POLICY IF EXISTS "Users can view their own and friends posted vibe_reels" ON vibe_reels;

-- Create new policy without time restriction
CREATE POLICY "Users can view their own and friends posted vibe_reels" ON vibe_reels
  FOR SELECT USING (
    auth.uid() = creator_id OR 
    (
      posted_at IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM friendships 
        WHERE friendships.user_id = auth.uid() 
        AND friendships.friend_id = vibe_reels.creator_id 
        AND friendships.status = 'accepted'
      )
    )
  );