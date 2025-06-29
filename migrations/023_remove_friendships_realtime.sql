-- Remove friendships from realtime publication
-- Moving from realtime to 1-second polling for MVP simplicity
-- This reduces database load and websocket connections

-- Drop friendships table from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE friendships;

-- Note: The friendships table was manually added to realtime publication
-- outside of migrations, which is why it doesn't appear in previous migration files.
-- This migration formalizes the removal as part of our move to polling architecture.