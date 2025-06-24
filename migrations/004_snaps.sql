-- Snaps table for visual messaging
CREATE TABLE snaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  media_url TEXT NOT NULL, -- just the storage path
  snap_type TEXT NOT NULL CHECK (snap_type IN ('photo', 'video')),
  filter_type TEXT,
  duration INTEGER, -- video duration in seconds
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  CONSTRAINT snaps_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT snaps_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Performance Indexes
CREATE INDEX idx_snaps_recipient ON snaps(recipient_id, created_at DESC);
CREATE INDEX idx_snaps_sender ON snaps(sender_id, created_at DESC);
CREATE INDEX idx_snaps_inbox ON snaps(recipient_id, status, created_at DESC);
CREATE INDEX idx_snaps_sent ON snaps(sender_id, status, created_at DESC);

-- Row Level Security
ALTER TABLE snaps ENABLE ROW LEVEL SECURITY;

-- Users can only see snaps they sent or received
CREATE POLICY "Users can view their own snaps" ON snaps
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
  );

-- Users can only insert snaps they are sending
CREATE POLICY "Users can insert snaps they send" ON snaps
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
  );

-- Users can only update snaps they received (to mark as opened)
CREATE POLICY "Recipients can update snap status" ON snaps
  FOR UPDATE USING (
    auth.uid() = recipient_id
  ) WITH CHECK (
    auth.uid() = recipient_id
  );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE snaps;