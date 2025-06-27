-- Add support for VibeCheck messages in conversations
-- Add message_type column to distinguish between text and VibeCheck messages
ALTER TABLE messages ADD COLUMN message_type VARCHAR(20) DEFAULT 'text' NOT NULL;

-- Add vibe_check_id column to link to VibeChecks
ALTER TABLE messages ADD COLUMN vibe_check_id UUID REFERENCES vibe_checks(id) ON DELETE CASCADE;

-- Make content column nullable since VibeCheck messages won't have text content
ALTER TABLE messages ALTER COLUMN content DROP NOT NULL;

-- Add constraint to ensure either content or vibe_check_id is provided
ALTER TABLE messages ADD CONSTRAINT messages_content_or_vibe_check_check 
  CHECK (
    (message_type = 'text' AND content IS NOT NULL AND vibe_check_id IS NULL) OR
    (message_type = 'vibe_check' AND content IS NULL AND vibe_check_id IS NOT NULL)
  );

-- Add index for message_type for better query performance
CREATE INDEX idx_messages_message_type ON messages(message_type);

-- Add index for vibe_check_id for better query performance
CREATE INDEX idx_messages_vibe_check_id ON messages(vibe_check_id);

-- Update RLS policies to work with new message types
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

-- Recreate RLS policies for messages
CREATE POLICY "Users can view conversation messages" ON messages
  FOR SELECT USING (
    auth.uid() IN (
      SELECT participant1_id FROM conversations WHERE id = conversation_id
      UNION
      SELECT participant2_id FROM conversations WHERE id = conversation_id
    )
  );

CREATE POLICY "Users can insert conversation messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    auth.uid() IN (
      SELECT participant1_id FROM conversations WHERE id = conversation_id
      UNION
      SELECT participant2_id FROM conversations WHERE id = conversation_id
    )
  );

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Update existing messages to have message_type = 'text'
UPDATE messages SET message_type = 'text' WHERE message_type IS NULL;