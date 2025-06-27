-- Rename snap_type column to vibe_check_type in vibe_checks table
ALTER TABLE vibe_checks RENAME COLUMN snap_type TO vibe_check_type;

-- Update check constraint to use new column name
ALTER TABLE vibe_checks DROP CONSTRAINT IF EXISTS vibe_checks_snap_type_check;
ALTER TABLE vibe_checks ADD CONSTRAINT vibe_checks_vibe_check_type_check 
  CHECK (vibe_check_type IN ('photo', 'video'));