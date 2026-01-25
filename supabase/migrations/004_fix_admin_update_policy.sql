-- Fix Admin Update Policy for Profiles
-- Ensures admins can update any profile (ban users, change tiers, etc.)

-- =============================================
-- 1. Drop existing update policies
-- =============================================
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- =============================================
-- 2. Recreate the is_admin function to ensure it works
-- =============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Direct query without RLS (SECURITY DEFINER bypasses RLS)
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();

  RETURN COALESCE(user_role IN ('admin', 'super_admin'), false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Ensure function is accessible
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- =============================================
-- 3. Create new update policies
-- =============================================

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can update ALL profiles (including their own)
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================
-- 4. Test verification query (run manually to verify)
-- =============================================
-- SELECT public.is_admin();
-- This should return true if you're logged in as an admin
