-- ============================================================
-- NABAJK COMPLETE SUPABASE SETUP
-- Copy this ENTIRE file and paste into Supabase SQL Editor
-- Run once after creating the 3 storage buckets (see below)
-- ============================================================

-- IMPORTANT: Before running this, create 3 storage buckets in Supabase UI:
-- 1. Go to Storage > Create bucket > Name: "route-images", Public: ON
-- 2. Go to Storage > Create bucket > Name: "gpx-files", Public: OFF
-- 3. Go to Storage > Create bucket > Name: "user-avatars", Public: ON

-- ============================================================
-- STEP 1: DATABASE SCHEMA
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table (extends auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rider_level TEXT DEFAULT 'easy',
  push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routes table
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  distance_km NUMERIC(6,2) NOT NULL,
  elevation_m INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Lahka', 'Srednja', 'Težka')),
  image_url TEXT NOT NULL,
  featured BOOLEAN DEFAULT FALSE,
  categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  polyline TEXT,
  gpx_file_url TEXT,
  region TEXT DEFAULT 'gorenjska',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group rides table
CREATE TABLE group_rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  region TEXT NOT NULL CHECK (region IN ('gorenjska', 'dolenjska', 'stajerska')),
  starts_at TIMESTAMPTZ NOT NULL,
  meeting_point TEXT NOT NULL,
  meeting_coordinates JSONB NOT NULL,
  route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
  notes TEXT,
  external_url TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted')),
  capacity INTEGER,
  custom_polyline TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group ride RSVPs table
CREATE TABLE group_ride_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_ride_id UUID NOT NULL REFERENCES group_rides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('going', 'maybe', 'not_going')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_ride_id, user_id)
);

-- User favourites table
CREATE TABLE user_favourites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, route_id)
);

-- Create indexes
CREATE INDEX idx_routes_featured ON routes(featured) WHERE featured = TRUE;
CREATE INDEX idx_routes_categories ON routes USING GIN(categories);
CREATE INDEX idx_group_rides_region ON group_rides(region);
CREATE INDEX idx_group_rides_starts_at ON group_rides(starts_at);
CREATE INDEX idx_group_rides_visibility ON group_rides(visibility);
CREATE INDEX idx_rsvps_group_ride ON group_ride_rsvps(group_ride_id);
CREATE INDEX idx_rsvps_user ON group_ride_rsvps(user_id);
CREATE INDEX idx_favourites_user ON user_favourites(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_rides_updated_at BEFORE UPDATE ON group_rides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rsvps_updated_at BEFORE UPDATE ON group_ride_rsvps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 2: ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_ride_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favourites ENABLE ROW LEVEL SECURITY;

-- USER PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- ROUTES POLICIES
CREATE POLICY "Routes are viewable by everyone"
  ON routes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert routes"
  ON routes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own routes"
  ON routes FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own routes"
  ON routes FOR DELETE USING (auth.uid() = created_by);

-- GROUP RIDES POLICIES
CREATE POLICY "Public group rides are viewable by everyone"
  ON group_rides FOR SELECT USING (
    visibility = 'public' OR auth.uid() = created_by
  );

CREATE POLICY "Authenticated users can create group rides"
  ON group_rides FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own group rides"
  ON group_rides FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own group rides"
  ON group_rides FOR DELETE USING (auth.uid() = created_by);

-- RSVPS POLICIES
CREATE POLICY "RSVPs are viewable by everyone"
  ON group_ride_rsvps FOR SELECT USING (true);

CREATE POLICY "Users can insert own RSVPs"
  ON group_ride_rsvps FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own RSVPs"
  ON group_ride_rsvps FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own RSVPs"
  ON group_ride_rsvps FOR DELETE USING (auth.uid() = user_id);

-- FAVOURITES POLICIES
CREATE POLICY "Favourites are viewable by owner"
  ON user_favourites FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favourites"
  ON user_favourites FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favourites"
  ON user_favourites FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- STEP 3: STORAGE POLICIES
-- ============================================================

-- ROUTE IMAGES BUCKET POLICIES
CREATE POLICY "Public can view route images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'route-images');

CREATE POLICY "Authenticated users can upload route images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'route-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update route images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'route-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete route images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'route-images' AND auth.role() = 'authenticated');

-- GPX FILES BUCKET POLICIES
CREATE POLICY "Authenticated users can view GPX files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gpx-files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload GPX files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gpx-files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update GPX files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'gpx-files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete GPX files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'gpx-files' AND auth.role() = 'authenticated');

-- USER AVATARS BUCKET POLICIES
CREATE POLICY "Public can view user avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'user-avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'user-avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'user-avatars' AND auth.role() = 'authenticated');
