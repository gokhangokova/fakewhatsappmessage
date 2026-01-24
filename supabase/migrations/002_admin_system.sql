-- Admin System Migration
-- Adds role-based access control and admin-specific tables

-- =============================================
-- 1. Add role column to profiles
-- =============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'
CHECK (role IN ('user', 'admin', 'super_admin'));

-- Add is_banned column for user moderation
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- Add last_active for analytics
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW();

-- =============================================
-- 2. Create feature_flags table
-- =============================================
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  free_enabled BOOLEAN DEFAULT false,
  pro_enabled BOOLEAN DEFAULT true,
  business_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Everyone can read feature flags
CREATE POLICY "Anyone can view feature flags" ON public.feature_flags
  FOR SELECT USING (true);

-- Only admins can modify feature flags (enforced via application layer + service role)
CREATE POLICY "Admins can manage feature flags" ON public.feature_flags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- =============================================
-- 3. Create admin_logs table
-- =============================================
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT, -- 'user', 'feature_flag', 'system_setting', etc.
  target_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view logs" ON public.admin_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Only admins can insert logs
CREATE POLICY "Admins can insert logs" ON public.admin_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- =============================================
-- 4. Create system_settings table
-- =============================================
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read system settings
CREATE POLICY "Anyone can view system settings" ON public.system_settings
  FOR SELECT USING (true);

-- Only admins can modify system settings
CREATE POLICY "Admins can manage system settings" ON public.system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- =============================================
-- 5. Create content_reports table (for moderation)
-- =============================================
CREATE TABLE IF NOT EXISTS public.content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  action_taken TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Users can create reports" ON public.content_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports" ON public.content_reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Admins can view and manage all reports
CREATE POLICY "Admins can manage reports" ON public.content_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- =============================================
-- 6. Update RLS policies for profiles (admin access)
-- =============================================

-- Drop and recreate profile policies to include admin access
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Users can view their own profile OR admins can view all profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Admins can update any profile
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- =============================================
-- 7. Update RLS policies for chats (admin access for moderation)
-- =============================================

-- Drop and recreate chat policies to include admin access
DROP POLICY IF EXISTS "Users can view own chats" ON public.chats;
DROP POLICY IF EXISTS "Admins can view all chats" ON public.chats;

CREATE POLICY "Users can view own chats" ON public.chats
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- =============================================
-- 8. Create indexes for performance
-- =============================================
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_subscription_tier_idx ON public.profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS profiles_last_active_idx ON public.profiles(last_active DESC);
CREATE INDEX IF NOT EXISTS admin_logs_admin_id_idx ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS admin_logs_created_at_idx ON public.admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS content_reports_status_idx ON public.content_reports(status);
CREATE INDEX IF NOT EXISTS content_reports_created_at_idx ON public.content_reports(created_at DESC);

-- =============================================
-- 9. Insert default feature flags
-- =============================================
INSERT INTO public.feature_flags (name, description, category, free_enabled, pro_enabled, business_enabled)
VALUES
  ('video_export', 'Export chats as MP4 video', 'export', false, true, true),
  ('gif_export', 'Export chats as GIF animation', 'export', false, true, true),
  ('high_resolution', 'Export in high resolution (2x)', 'export', false, true, true),
  ('remove_watermark', 'Remove watermark from exports', 'export', false, true, true),
  ('unlimited_chats', 'Save unlimited chat designs', 'storage', false, true, true),
  ('custom_backgrounds', 'Use custom background images', 'customization', false, true, true),
  ('priority_support', 'Access to priority support', 'support', false, true, true),
  ('api_access', 'API access for automation', 'advanced', false, false, true)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 10. Insert default system settings
-- =============================================
INSERT INTO public.system_settings (key, value, description)
VALUES
  ('maintenance_mode', '{"enabled": false, "message": ""}', 'Enable maintenance mode'),
  ('free_tier_chat_limit', '{"limit": 2}', 'Maximum saved chats for free tier'),
  ('announcement', '{"enabled": false, "message": "", "type": "info"}', 'Global announcement banner'),
  ('signup_enabled', '{"enabled": true}', 'Allow new user registrations')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- 11. Grant permissions
-- =============================================
GRANT ALL ON public.feature_flags TO anon, authenticated;
GRANT ALL ON public.admin_logs TO anon, authenticated;
GRANT ALL ON public.system_settings TO anon, authenticated;
GRANT ALL ON public.content_reports TO anon, authenticated;
