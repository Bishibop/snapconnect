-- Update indexes, constraints, and RLS policies for vibe_checks table
-- This completes the renaming of snaps to vibe_checks

-- Rename indexes
ALTER INDEX idx_snaps_recipient RENAME TO idx_vibe_checks_recipient;
ALTER INDEX idx_snaps_sender RENAME TO idx_vibe_checks_sender;
ALTER INDEX idx_snaps_inbox RENAME TO idx_vibe_checks_inbox;
ALTER INDEX idx_snaps_sent RENAME TO idx_vibe_checks_sent;

-- Update foreign key constraint names
ALTER TABLE vibe_checks RENAME CONSTRAINT snaps_sender_id_fkey TO vibe_checks_sender_id_fkey;
ALTER TABLE vibe_checks RENAME CONSTRAINT snaps_recipient_id_fkey TO vibe_checks_recipient_id_fkey;

-- Drop old RLS policies
DROP POLICY IF EXISTS "Users can view their own snaps" ON vibe_checks;
DROP POLICY IF EXISTS "Users can insert snaps they send" ON vibe_checks;
DROP POLICY IF EXISTS "Recipients can update snap status" ON vibe_checks;

-- Create new RLS policies with updated names
CREATE POLICY "Users can view their own vibe checks" ON vibe_checks
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
  );

CREATE POLICY "Users can insert vibe checks they send" ON vibe_checks
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
  );

CREATE POLICY "Recipients can update vibe check status" ON vibe_checks
  FOR UPDATE USING (
    auth.uid() = recipient_id
  ) WITH CHECK (
    auth.uid() = recipient_id
  );