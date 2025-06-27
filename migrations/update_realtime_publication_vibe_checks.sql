-- Update realtime publication for vibe_checks
-- Note: vibe_checks table is already in realtime publication after table rename
-- This migration verifies the state but no changes needed

-- Verify vibe_checks is in publication (already added during rename)
-- ALTER PUBLICATION supabase_realtime ADD TABLE vibe_checks;