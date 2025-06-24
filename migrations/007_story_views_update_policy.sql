-- Add UPDATE policy for story_views to allow updating viewed_at timestamp
CREATE POLICY "Users can update their own story views" ON story_views
  FOR UPDATE USING (
    auth.uid() = viewer_id
  ) WITH CHECK (
    auth.uid() = viewer_id
  );