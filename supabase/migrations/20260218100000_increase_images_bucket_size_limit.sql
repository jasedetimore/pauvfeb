-- Increase the images bucket file size limit from 5MB to 10MB
-- to match the API route validation (10MB max)
UPDATE storage.buckets
SET file_size_limit = 10485760  -- 10MB
WHERE id = 'images';
