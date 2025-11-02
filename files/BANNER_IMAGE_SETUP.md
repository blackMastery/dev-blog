# Banner Image Upload Setup Guide

This guide will help you set up banner image upload functionality for posts.

## 1. Database Migration

First, run the SQL migration to add the `banner_image` column to the posts table:

```sql
-- Run this in your Supabase SQL Editor
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS banner_image TEXT;
```

You can find the migration file at: `files/add_banner_image_migration.sql`

## 2. Supabase Storage Setup

### Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage**
3. Click **New bucket**
4. Name it: `post-images`
5. Set it to **Public** (so images can be accessed via URL)
6. Click **Create bucket**

### Set Storage Policies

**IMPORTANT**: You must set up storage policies before uploads will work. Without these policies, you'll get a "new row violates row-level security policy" error.

Run the SQL policies in the `files/storage_policies.sql` file, or copy this into your Supabase SQL Editor:

```sql
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
```

**Note**: The path structure is `banners/{user_id}/{filename}`. PostgreSQL arrays are 1-indexed, so `[1]` = 'banners' and `[2]` = user_id. The policy checks that index 2 matches the authenticated user's ID, ensuring users can only upload/manage their own images.

## 3. Features

- **File Upload**: Users can upload banner images directly from the post form
- **File Validation**: Only JPEG, PNG, WebP, and GIF files up to 5MB are allowed
- **Image Preview**: Users can see a preview of the uploaded banner image before saving
- **Remove Functionality**: Users can remove the banner image before saving the post
- **Storage Organization**: Images are organized by user ID and timestamp

## 4. Usage

When creating or editing a post:

1. Click on the banner image upload area
2. Select an image file (JPEG, PNG, WebP, or GIF, max 5MB)
3. The image will upload automatically and show a preview
4. You can remove the image if needed
5. Save the post to complete

## 5. Notes

- Banner images are stored in the `post-images` bucket in Supabase Storage
- Images are organized by user ID: `banners/{user_id}/{timestamp}-{random}.{ext}`
- The public URL is stored in the `banner_image` column of the posts table
- Existing posts without banner images will show the upload area

