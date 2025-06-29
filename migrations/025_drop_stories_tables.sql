-- Drop stories and story_views tables
-- All functionality has been migrated to vibe_reels

-- First drop story_views table (has foreign key dependency on stories)
DROP TABLE IF EXISTS story_views;

-- Drop the main stories table
DROP TABLE IF EXISTS stories;

-- Note: This will permanently delete all stories data (10 stories, 8 views)
-- Ensure all data has been migrated to vibe_reels before running this migration