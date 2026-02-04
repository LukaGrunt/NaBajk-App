-- NaBajk Row Level Security Policies
-- Run this AFTER running 01-schema.sql in Supabase SQL Editor

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_ride_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favourites ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USER PROFILES POLICIES
-- ============================================================

-- Users can read all profiles (for displaying names, etc.)
CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles FOR SELECT USING (true);

-- Users can insert their own profile after signing up
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update only their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- ROUTES POLICIES
-- ============================================================

-- Everyone can view all routes (public app)
CREATE POLICY "Routes are viewable by everyone"
  ON routes FOR SELECT USING (true);

-- Only authenticated users can create routes (for now, open to all users)
-- Later you can restrict to admins only
CREATE POLICY "Authenticated users can insert routes"
  ON routes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update routes they created
CREATE POLICY "Users can update own routes"
  ON routes FOR UPDATE USING (auth.uid() = created_by);

-- Users can delete routes they created
CREATE POLICY "Users can delete own routes"
  ON routes FOR DELETE USING (auth.uid() = created_by);

-- ============================================================
-- GROUP RIDES POLICIES
-- ============================================================

-- Public group rides are viewable by everyone
-- Unlisted rides only visible to creator
CREATE POLICY "Public group rides are viewable by everyone"
  ON group_rides FOR SELECT USING (
    visibility = 'public' OR auth.uid() = created_by
  );

-- Authenticated users can create group rides
CREATE POLICY "Authenticated users can create group rides"
  ON group_rides FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can update their own group rides
CREATE POLICY "Users can update own group rides"
  ON group_rides FOR UPDATE USING (auth.uid() = created_by);

-- Users can delete their own group rides
CREATE POLICY "Users can delete own group rides"
  ON group_rides FOR DELETE USING (auth.uid() = created_by);

-- ============================================================
-- GROUP RIDE RSVPS POLICIES
-- ============================================================

-- Everyone can view RSVPs (to see who's going)
CREATE POLICY "RSVPs are viewable by everyone"
  ON group_ride_rsvps FOR SELECT USING (true);

-- Authenticated users can insert their own RSVPs
CREATE POLICY "Users can insert own RSVPs"
  ON group_ride_rsvps FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own RSVPs
CREATE POLICY "Users can update own RSVPs"
  ON group_ride_rsvps FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own RSVPs
CREATE POLICY "Users can delete own RSVPs"
  ON group_ride_rsvps FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- USER FAVOURITES POLICIES
-- ============================================================

-- Users can only view their own favourites
CREATE POLICY "Favourites are viewable by owner"
  ON user_favourites FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own favourites
CREATE POLICY "Users can insert own favourites"
  ON user_favourites FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favourites
CREATE POLICY "Users can delete own favourites"
  ON user_favourites FOR DELETE USING (auth.uid() = user_id);
