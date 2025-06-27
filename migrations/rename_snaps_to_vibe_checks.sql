-- Rename snaps table to vibe_checks
-- This migration transforms the existing snaps functionality into VibeChecks
-- as part of Epic 1 Feature 3: VibeCheck Integration in Conversations

ALTER TABLE snaps RENAME TO vibe_checks;