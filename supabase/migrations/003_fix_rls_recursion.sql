-- Fix RLS Recursion Issue for Profiles Table
-- The previous policy had a recursive subquery that caused infinite loops

-- =============================================
-- 1. Fix profiles SELECT policy
-- =============================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;

-- Simple policy: Users can always read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Admins can read all profiles - using auth.jwt() to avoid recursion
CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
  );

-- =============================================
-- 2. Fix profiles UPDATE policy
-- =============================================

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- =============================================
-- 3. Alternative: Use a security definer function
-- =============================================

-- Create a function to check if current user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();

  RETURN user_role IN ('admin', 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- =============================================
-- 4. Recreate admin policies using the function
-- =============================================

-- Drop the jwt-based policy and create function-based one
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;

CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin());

-- =============================================
-- 5. Fix chats policies similarly
-- =============================================

DROP POLICY IF EXISTS "Users can view own chats" ON public.chats;
DROP POLICY IF EXISTS "Admins can view all chats" ON public.chats;

-- Users can read their own chats
CREATE POLICY "Users can read own chats" ON public.chats
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can read all chats
CREATE POLICY "Admins can read all chats" ON public.chats
  FOR SELECT USING (public.is_admin());
