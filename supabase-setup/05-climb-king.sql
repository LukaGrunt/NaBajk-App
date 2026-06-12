-- Kralj vzponov (Climb King) — Phase 1 schema
-- Run this in the Supabase SQL Editor.

-- 1. Detection checkpoints per climb: array of {lat, lng}, derived from the
--    climb's GPX by scripts/extract-climb-checkpoints.js (start, 25%, 50%,
--    75%, summit). A recorded ride "conquers" the climb when its track
--    passes all checkpoints in order.
ALTER TABLE routes ADD COLUMN IF NOT EXISTS climb_checkpoints JSONB;

-- 2. Conquests: one row per user per climb, keeping the BEST time.
CREATE TABLE IF NOT EXISTS climb_conquests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  climb_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  time_seconds INTEGER NOT NULL CHECK (time_seconds > 0),
  conquered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, climb_id)
);

CREATE INDEX IF NOT EXISTS idx_climb_conquests_user  ON climb_conquests(user_id);
CREATE INDEX IF NOT EXISTS idx_climb_conquests_climb ON climb_conquests(climb_id);

ALTER TABLE climb_conquests ENABLE ROW LEVEL SECURITY;

-- Everyone signed in can read conquests (needed later for leaderboards);
-- users can only write their own.
CREATE POLICY "Authenticated users can read conquests"
  ON climb_conquests FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own conquests"
  ON climb_conquests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conquests"
  ON climb_conquests FOR UPDATE
  USING (auth.uid() = user_id);
