-- Migration: Add banner_image column to posts table
-- Run this in your Supabase SQL Editor

ALTER TABLE posts
ADD COLUMN IF NOT EXISTS banner_image TEXT;

-- Optional: Add comment to document the column
COMMENT ON COLUMN posts.banner_image IS 'URL to the banner image for the post, typically uploaded to Supabase Storage';

