-- Run after migration: storage policies for delivery photos

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'delivery-photos',
  'delivery-photos',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload delivery photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'delivery-photos');

CREATE POLICY "Anyone can view delivery photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'delivery-photos');

CREATE POLICY "Users can update own delivery photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'delivery-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own delivery photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'delivery-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
