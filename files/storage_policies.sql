-- Storage Policies for post-images bucket
-- Run this in your Supabase SQL Editor after creating the 'post-images' bucket

-- First, drop any existing policies if they exist (optional - uncomment if needed)
-- DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
-- DROP POLICY IF EXISTS "Public can view images" ON storage.objects;

-- Allow authenticated users to upload images to the post-images bucket
-- Path structure: banners/{user_id}/{filename}
-- PostgreSQL arrays are 1-indexed, so [1] = 'banners', [2] = user_id
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-images' 
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'post-images' 
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'post-images' 
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow public read access to all images
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post-images');

