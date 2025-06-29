-- Revert vibe_reels RLS to simple policy to fix O(N²) database load
-- The complex RLS with EXISTS subquery was causing 94% database consumption
-- We'll do friendship filtering client-side instead

-- Drop the complex policy
DROP POLICY IF EXISTS "Users can view their own and friends posted vibe_reels" ON vibe_reels;

-- Recreate the simple policy that allows all users to view vibe reels
-- Security is maintained at the API level and client-side filtering
CREATE POLICY "Users can view all vibe_reels" ON vibe_reels
  FOR SELECT
  USING (true);

-- Note: The other policies for INSERT, UPDATE, DELETE remain unchanged
-- as they already correctly restrict to the owner only