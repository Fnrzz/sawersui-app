-- ============================================
-- Leaderboard Overlay Settings Table
-- ============================================

CREATE TABLE IF NOT EXISTS leaderboard_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  bg_color TEXT DEFAULT '#1f2937', -- Dark Gray
  title_color TEXT DEFAULT '#fbbf24', -- Gold
  text_color TEXT DEFAULT '#ffffff', -- White
  rank_color TEXT DEFAULT '#22c55e', -- Green
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE leaderboard_settings ENABLE ROW LEVEL SECURITY;

-- Public can read settings (for overlay display)
CREATE POLICY "Public read leaderboard_settings"
  ON leaderboard_settings FOR SELECT
  USING (true);

-- Users can insert their own settings
CREATE POLICY "Owner insert leaderboard_settings"
  ON leaderboard_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Owner update leaderboard_settings"
  ON leaderboard_settings FOR UPDATE
  USING (auth.uid() = user_id);
