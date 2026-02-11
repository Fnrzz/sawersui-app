-- ============================================
-- Exclusive Content Table (Gated Content for Donors)
-- ============================================

CREATE TABLE IF NOT EXISTS exclusive_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  min_donation_usdc NUMERIC NOT NULL DEFAULT 5.0,
  walrus_blob_id TEXT NOT NULL,
  content_type TEXT DEFAULT 'text',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE exclusive_content ENABLE ROW LEVEL SECURITY;

-- Anyone can see metadata (titles, thresholds) — needed for public page
CREATE POLICY "Public read exclusive_content"
  ON exclusive_content FOR SELECT
  USING (true);

-- Only the owner can insert
CREATE POLICY "Owner insert exclusive_content"
  ON exclusive_content FOR INSERT
  WITH CHECK (auth.uid() = streamer_id);

-- Only the owner can update
CREATE POLICY "Owner update exclusive_content"
  ON exclusive_content FOR UPDATE
  USING (auth.uid() = streamer_id);

-- Only the owner can delete
CREATE POLICY "Owner delete exclusive_content"
  ON exclusive_content FOR DELETE
  USING (auth.uid() = streamer_id);

-- Index for fast lookups by streamer
CREATE INDEX IF NOT EXISTS idx_exclusive_content_streamer
  ON exclusive_content (streamer_id, created_at DESC);

-- ============================================
-- Add walrus_blob_id column to donations table
-- (for Walrus donation receipts)
-- ============================================

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS walrus_blob_id TEXT DEFAULT NULL;
