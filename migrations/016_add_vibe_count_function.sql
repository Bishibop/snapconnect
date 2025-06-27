-- Create function to increment vibe count for art pieces
CREATE OR REPLACE FUNCTION increment_vibe_count(
  art_piece_id uuid
)
RETURNS TABLE (
  id uuid,
  new_vibe_count integer
)
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE art_pieces
  SET vibe_count = vibe_count + 1
  WHERE art_pieces.id = art_piece_id;

  RETURN QUERY
  SELECT art_pieces.id, art_pieces.vibe_count
  FROM art_pieces
  WHERE art_pieces.id = art_piece_id;
END;
$$;