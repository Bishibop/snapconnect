-- Create RPC function to find similar art using vector similarity
CREATE OR REPLACE FUNCTION find_similar_art(
  query_embedding vector(512),
  match_threshold float DEFAULT 0.8,
  match_count int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  image_url text,
  vibe_count integer,
  similarity float,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ap.id,
    ap.user_id,
    ap.image_url,
    ap.vibe_count,
    1 - (ap.embedding <=> query_embedding) AS similarity,
    ap.created_at
  FROM art_pieces ap
  WHERE ap.embedding IS NOT NULL
    AND 1 - (ap.embedding <=> query_embedding) >= match_threshold
  ORDER BY ap.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create function to get conversation or create if doesn't exist
CREATE OR REPLACE FUNCTION create_or_get_conversation(
  user1_id uuid,
  user2_id uuid
)
RETURNS TABLE (
  id uuid,
  participant_ids uuid[],
  last_activity timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
DECLARE
  sorted_participants uuid[2];
  existing_conversation_id uuid;
BEGIN
  -- Sort participant IDs to ensure consistent ordering
  IF user1_id < user2_id THEN
    sorted_participants := ARRAY[user1_id, user2_id];
  ELSE
    sorted_participants := ARRAY[user2_id, user1_id];
  END IF;

  -- Check for existing conversation
  SELECT c.id INTO existing_conversation_id
  FROM conversations c
  WHERE c.participant_ids = sorted_participants
  LIMIT 1;

  IF existing_conversation_id IS NOT NULL THEN
    -- Return existing conversation
    RETURN QUERY
    SELECT c.id, c.participant_ids, c.last_activity, c.created_at
    FROM conversations c
    WHERE c.id = existing_conversation_id;
  ELSE
    -- Create new conversation
    RETURN QUERY
    INSERT INTO conversations (participant_ids)
    VALUES (sorted_participants)
    RETURNING conversations.id, conversations.participant_ids, conversations.last_activity, conversations.created_at;
  END IF;
END;
$$;

-- Create function to update conversation activity timestamp
CREATE OR REPLACE FUNCTION update_conversation_activity(
  conversation_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE conversations
  SET last_activity = NOW()
  WHERE id = conversation_id;
END;
$$;