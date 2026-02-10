-- ============================================
-- Advanced Overlay Settings Table
-- Matches the actual Supabase schema
-- ============================================

CREATE TABLE IF NOT EXISTS overlay_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  card_bg_color TEXT DEFAULT '#5B21B6',
  sender_color TEXT DEFAULT '#FFDF20',
  amount_color TEXT DEFAULT '#A3E635',
  message_color TEXT DEFAULT '#ffffff',
  sound_url TEXT DEFAULT NULL,
  min_amount NUMERIC DEFAULT 0.5,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE overlay_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (overlay page is public, needs to fetch colors)
CREATE POLICY "Public read overlay_settings"
  ON overlay_settings FOR SELECT
  USING (true);

-- Only the owner can insert their own settings
CREATE POLICY "Owner insert overlay_settings"
  ON overlay_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only the owner can update their own settings
CREATE POLICY "Owner update overlay_settings"
  ON overlay_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- Storage bucket for custom alert sounds
-- Run this in the Supabase SQL editor:
-- ============================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('alert-sounds', 'alert-sounds', true)
-- ON CONFLICT (id) DO NOTHING;
