-- NaBajk Storage Buckets and Policies
-- Run this AFTER running 01-schema.sql and 02-rls-policies.sql

-- Note: Buckets must be created via UI first (Storage > Create bucket)
-- Create these 3 buckets in Supabase UI:
-- 1. route-images (public)
-- 2. gpx-files (private)
-- 3. user-avatars (public)

-- ============================================================
-- STORAGE POLICIES FOR route-images BUCKET
-- ============================================================

-- Anyone can view route images
CREATE POLICY "Public can view route images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'route-images');

-- Authenticated users can upload route images
CREATE POLICY "Authenticated users can upload route images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'route-images'
    AND auth.role() = 'authenticated'
  );

-- Authenticated users can update their own route images
CREATE POLICY "Authenticated users can update route images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'route-images'
    AND auth.role() = 'authenticated'
  );

-- Authenticated users can delete their own route images
CREATE POLICY "Authenticated users can delete route images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'route-images'
    AND auth.role() = 'authenticated'
  );

-- ============================================================
-- STORAGE POLICIES FOR gpx-files BUCKET
-- ============================================================

-- Authenticated users can view GPX files
CREATE POLICY "Authenticated users can view GPX files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'gpx-files'
    AND auth.role() = 'authenticated'
  );

-- Authenticated users can upload GPX files
CREATE POLICY "Authenticated users can upload GPX files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'gpx-files'
    AND auth.role() = 'authenticated'
  );

-- Authenticated users can update GPX files
CREATE POLICY "Authenticated users can update GPX files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'gpx-files'
    AND auth.role() = 'authenticated'
  );

-- Authenticated users can delete GPX files
CREATE POLICY "Authenticated users can delete GPX files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'gpx-files'
    AND auth.role() = 'authenticated'
  );

-- ============================================================
-- STORAGE POLICIES FOR user-avatars BUCKET
-- ============================================================

-- Anyone can view user avatars
CREATE POLICY "Public can view user avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-avatars');

-- Authenticated users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-avatars'
    AND auth.role() = 'authenticated'
  );

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'user-avatars'
    AND auth.role() = 'authenticated'
  );

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-avatars'
    AND auth.role() = 'authenticated'
  );
