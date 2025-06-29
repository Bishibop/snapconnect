-- Fix vibe count functionality by allowing authenticated users to update art pieces
-- This is needed so the increment_vibe_count function can update vibe counts on any art piece

-- Drop the restrictive update policy that only allows users to update their own art
DROP POLICY IF EXISTS "Users can update their own art pieces" ON art_pieces;

-- Create a more permissive update policy for MVP
-- This allows any authenticated user to update art pieces (needed for vibe count increments)
CREATE POLICY "Authenticated users can update art pieces" ON art_pieces
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);