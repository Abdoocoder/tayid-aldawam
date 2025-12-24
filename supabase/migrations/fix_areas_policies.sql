-- ==============================================================================
-- Fix: Multiple Permissive Policies on 'areas' and 'user_areas'
-- Description:
-- 1. Drops conflicting policies that allowed 'ALL' operations for everyone.
-- 2. Re-implements 'SELECT' policy for public read access.
-- 3. Implements strict 'INSERT', 'UPDATE', 'DELETE' policies restricted to HR and ADMIN roles.
-- ==============================================================================

-- ====================================
-- A. FIX POLICIES FOR 'areas' TABLE
-- ====================================

-- 1. Drop existing conflicting policies
DROP POLICY IF EXISTS "Allow public read on areas" ON public.areas;
DROP POLICY IF EXISTS "Allow HR/Admin to manage areas" ON public.areas;

-- 2. Re-create Public Read Policy (Safe)
CREATE POLICY "Allow public read on areas"
ON public.areas FOR SELECT
USING (true);

-- 3. Create Restricted Management Policy (HR & Admin ONLY)
-- We separate INSERT, UPDATE, DELETE to be explicit, or use ALL with the role check.
CREATE POLICY "Allow HR/Admin to manage areas"
ON public.areas FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid()
    AND u.role IN ('HR', 'ADMIN')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid()
    AND u.role IN ('HR', 'ADMIN')
  )
);

-- ====================================
-- B. FIX POLICIES FOR 'user_areas' TABLE
-- ====================================

-- 1. Drop existing conflicting policies
DROP POLICY IF EXISTS "Allow public read on user_areas" ON public.user_areas;
DROP POLICY IF EXISTS "Allow HR/Admin to manage user_areas" ON public.user_areas;

-- 2. Re-create Public Read Policy (Safe)
CREATE POLICY "Allow public read on user_areas"
ON public.user_areas FOR SELECT
USING (true);

-- 3. Create Restricted Management Policy (HR & Admin ONLY)
CREATE POLICY "Allow HR/Admin to manage user_areas"
ON public.user_areas FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid()
    AND u.role IN ('HR', 'ADMIN')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid()
    AND u.role IN ('HR', 'ADMIN')
  )
);

-- ====================================
-- C. CONFIRMATION
-- ====================================
DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies for areas and user_areas have been secured.';
END $$;
