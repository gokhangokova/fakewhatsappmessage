-- Export tracking table for daily quota management
CREATE TABLE IF NOT EXISTS public.user_export_counts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  image_count INTEGER DEFAULT 0,
  video_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.user_export_counts ENABLE ROW LEVEL SECURITY;

-- Users can view their own export counts
CREATE POLICY "Users can view own export counts" ON public.user_export_counts
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own export counts
CREATE POLICY "Users can insert own export counts" ON public.user_export_counts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own export counts
CREATE POLICY "Users can update own export counts" ON public.user_export_counts
  FOR UPDATE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS user_export_counts_user_date_idx ON public.user_export_counts(user_id, date);

-- Add free_tier_export_quota to system_settings if not exists
INSERT INTO system_settings (key, value)
VALUES ('free_tier_export_quota', '{"image_limit": 0, "video_limit": 0}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Grant permissions
GRANT ALL ON public.user_export_counts TO authenticated;
