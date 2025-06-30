-- Add ai_caption column to vibe_reels table for AI-generated captions
ALTER TABLE vibe_reels 
ADD COLUMN ai_caption TEXT;

-- Add comment for documentation
COMMENT ON COLUMN vibe_reels.ai_caption IS 'AI-generated artistic caption describing the vibe of the reel collection';