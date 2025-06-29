-- Remove stories and story_views tables from realtime publication
-- These tables are no longer used as functionality has been migrated to vibe_reels

-- Drop stories table from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE stories;

-- Drop story_views table from realtime publication  
ALTER PUBLICATION supabase_realtime DROP TABLE story_views;

-- Note: The actual tables will be dropped in the next migration
-- This migration only removes them from realtime broadcasts