-- ==============================================================================
-- Fix: RLS Performance & Policy Conflicts
-- Description:
-- 1. Optimizes auth.uid() calls by wrapping them in (select auth.uid()) to force caching per statement.
-- 2. Splits 'ALL' policies into specific operations to avoid conflict with 'SELECT' policies.
-- 3. Ensures strict separation between Public Read and Admin/HR Management.
-- ==============================================================================

-- ====================================
-- A. AREAS TABLE
-- ====================================

-- 1. clear existing policies
DROP POLICY IF EXISTS "Allow public read on areas" ON public.areas;
DROP POLICY IF EXISTS "Allow HR/Admin to manage areas" ON public.areas;

-- 2. Clean Public Read (Optimized)
CREATE POLICY "Allow public read on areas"
ON public.areas FOR SELECT
USING (true);

-- 3. Restricted Management (HR & ADMIN) - Split for performance & clarity
-- INSERT
CREATE POLICY "Allow HR/Admin to insert areas"
ON public.areas FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = (select auth.uid()) -- Optimized
    AND u.role IN ('HR', 'ADMIN')
  )
);

-- UPDATE
CREATE POLICY "Allow HR/Admin to update areas"
ON public.areas FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = (select auth.uid()) -- Optimized
    AND u.role IN ('HR', 'ADMIN')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = (select auth.uid()) -- Optimized
    AND u.role IN ('HR', 'ADMIN')
  )
);

-- DELETE
CREATE POLICY "Allow HR/Admin to delete areas"
ON public.areas FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = (select auth.uid()) -- Optimized
    AND u.role IN ('HR', 'ADMIN')
  )
);

-- ====================================
-- B. USER_AREAS TABLE
-- ====================================

-- 1. clear existing policies
DROP POLICY IF EXISTS "Allow public read on user_areas" ON public.user_areas;
DROP POLICY IF EXISTS "Allow HR/Admin to manage user_areas" ON public.user_areas;

-- 2. Clean Public Read
CREATE POLICY "Allow public read on user_areas"
ON public.user_areas FOR SELECT
USING (true);

-- 3. Restricted Management (HR & ADMIN)
-- INSERT
CREATE POLICY "Allow HR/Admin to insert user_areas"
ON public.user_areas FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = (select auth.uid()) -- Optimized
    AND u.role IN ('HR', 'ADMIN')
  )
);

-- UPDATE
CREATE POLICY "Allow HR/Admin to update user_areas"
ON public.user_areas FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = (select auth.uid()) -- Optimized
    AND u.role IN ('HR', 'ADMIN')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = (select auth.uid()) -- Optimized
    AND u.role IN ('HR', 'ADMIN')
  )
);

-- DELETE
CREATE POLICY "Allow HR/Admin to delete user_areas"
ON public.user_areas FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = (select auth.uid()) -- Optimized
    AND u.role IN ('HR', 'ADMIN')
  )
);

-- ====================================
-- C. CONFIRMATION
-- ====================================
DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies optimized. Warnings for auth_rls_initplan and multiple_permissive_policies should be resolved.';
END $$;
