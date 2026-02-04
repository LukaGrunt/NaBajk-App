-- NaBajk Database Schema
-- Run this in Supabase SQL Editor: https://zymssfxffkymkkfndssf.supabase.co/project/zymssfxffkymkkfndssf/editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table (extends auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rider_level TEXT DEFAULT 'easy', -- 'easy', 'medium', 'hard'
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
  polyline TEXT, -- Encoded Google Polyline
  gpx_file_url TEXT, -- URL to GPX file in Storage
  region TEXT DEFAULT 'gorenjska', -- For future filtering
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
  meeting_coordinates JSONB NOT NULL, -- { lat: number, lng: number }
  route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
  notes TEXT,
  external_url TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted')),
  capacity INTEGER,
  custom_polyline TEXT, -- For rides with custom GPX routes
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

-- Create indexes for common queries
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

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_rides_updated_at BEFORE UPDATE ON group_rides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rsvps_updated_at BEFORE UPDATE ON group_ride_rsvps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
