-- Remove vibe reel tables from realtime publication since we're using polling instead
-- This will reduce database load and prevent unnecessary realtime events

-- Remove vibe_reels from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE vibe_reels;

-- Remove vibe_reel_views from realtime publication  
ALTER PUBLICATION supabase_realtime DROP TABLE vibe_reel_views;

-- Also clean up duplicate RLS policy
DROP POLICY IF EXISTS "Users can view all vibe reels" ON vibe_reels;

-- The remaining policy "Users can view all vibe_reels" will be kept
-- Note the subtle difference in naming - one has underscore, one doesn't