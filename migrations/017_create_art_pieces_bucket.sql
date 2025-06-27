-- Create storage bucket for art pieces
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'art-pieces',
  'art-pieces',
  true, -- public read access
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
);

-- Storage policies for art-pieces bucket
CREATE POLICY "Anyone can view art pieces" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'art-pieces');

CREATE POLICY "Authenticated users can upload art pieces" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'art-pieces' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own art pieces" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'art-pieces' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'art-pieces' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own art pieces" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'art-pieces' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );