-- Story views table to track who has seen which stories
CREATE TABLE story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL,
  viewer_id UUID NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT story_views_story_id_fkey FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  CONSTRAINT story_views_viewer_id_fkey FOREIGN KEY (viewer_id) REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(story_id, viewer_id) -- One view record per user per story
);

-- Performance Indexes
CREATE INDEX idx_story_views_viewer ON story_views(viewer_id, viewed_at DESC);
CREATE INDEX idx_story_views_story ON story_views(story_id, viewer_id);

-- Row Level Security
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- Users can view their own story views and views on their stories
CREATE POLICY "Users can view story views" ON story_views
  FOR SELECT USING (
    auth.uid() = viewer_id OR 
    EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = story_views.story_id 
      AND stories.user_id = auth.uid()
    )
  );

-- Users can insert their own story views
CREATE POLICY "Users can insert story views" ON story_views
  FOR INSERT WITH CHECK (
    auth.uid() = viewer_id
  );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE story_views;