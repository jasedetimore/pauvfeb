-- Create a public storage bucket for images (issuers, tags, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read from the images bucket (public)
CREATE POLICY "Public read access on images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'images');

-- Allow authenticated users with admin role to upload
CREATE POLICY "Admin upload access on images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'images'
    AND (auth.jwt() -> 'app_metadata' ->> 'admin')::boolean = true
  );

-- Allow admins to update (overwrite) images
CREATE POLICY "Admin update access on images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'images'
    AND (auth.jwt() -> 'app_metadata' ->> 'admin')::boolean = true
  )
  WITH CHECK (
    bucket_id = 'images'
    AND (auth.jwt() -> 'app_metadata' ->> 'admin')::boolean = true
  );

-- Allow admins to delete images
CREATE POLICY "Admin delete access on images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'images'
    AND (auth.jwt() -> 'app_metadata' ->> 'admin')::boolean = true
  );
