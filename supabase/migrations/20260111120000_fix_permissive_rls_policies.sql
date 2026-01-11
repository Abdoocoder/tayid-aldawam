-- ==========================================
-- SECURITY HARDENING: FIX PERMISSIVE RLS POLICIES
-- ==========================================

-- 1. AUDIT LOGS: Restrict manual inserts
-- Existing permissive policy: "Allow insert access to authenticated users" WITH CHECK (true)
DROP POLICY IF EXISTS "Allow insert access to authenticated users" ON public.audit_logs;
DROP POLICY IF EXISTS "Secure Insert Audit Logs" ON public.audit_logs;

CREATE POLICY "Secure Insert Audit Logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (
    -- Only allow inserting if the user ID matches the authenticated user
    (changed_by::uuid = (select auth.uid())) 
    OR 
    -- Or if it's being inserted by a trigger/system function (handled by SECURITY DEFINER)
    (changed_by IS NULL)
);

-- 2. USERS TABLE: Restrict management
DROP POLICY IF EXISTS "Allow authenticated insert on users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated update on users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated delete on users" ON public.users;

DROP POLICY IF EXISTS "Users Self Insert or Admin" ON public.users;
DROP POLICY IF EXISTS "Users Self Update or Admin/HR" ON public.users;
DROP POLICY IF EXISTS "Users Admin Delete" ON public.users;

-- INSERT: Self-signup or Admin
CREATE POLICY "Users Self Insert or Admin"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (
  (auth_user_id::uuid = (select auth.uid()))
  OR 
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id::uuid = (select auth.uid())
    AND u.role = 'ADMIN'
  )
);

-- UPDATE: Self-update or Admin/HR
CREATE POLICY "Users Self Update or Admin/HR"
ON public.users FOR UPDATE
TO authenticated
USING (
  (auth_user_id::uuid = (select auth.uid()))
  OR 
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id::uuid = (select auth.uid())
    AND u.role IN ('ADMIN', 'HR')
  )
)
WITH CHECK (
  (auth_user_id::uuid = (select auth.uid()))
  OR 
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id::uuid = (select auth.uid())
    AND u.role IN ('ADMIN', 'HR')
  )
);

-- DELETE: Admin only
CREATE POLICY "Users Admin Delete"
ON public.users FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id::uuid = (select auth.uid())
    AND u.role = 'ADMIN'
  )
);

-- 3. WORKERS TABLE: Restrict management
DROP POLICY IF EXISTS "Allow authenticated insert on workers" ON public.workers;
DROP POLICY IF EXISTS "Allow authenticated update on workers" ON public.workers;
DROP POLICY IF EXISTS "Allow authenticated delete on workers" ON public.workers;

DROP POLICY IF EXISTS "Workers Admin/HR Insert" ON public.workers;
DROP POLICY IF EXISTS "Workers Admin/HR/GS Update" ON public.workers;
DROP POLICY IF EXISTS "Workers Admin/HR Delete" ON public.workers;

-- INSERT: Admin/HR only
CREATE POLICY "Workers Admin/HR Insert"
ON public.workers FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id::uuid = (select auth.uid())
    AND u.role IN ('ADMIN', 'HR')
  )
);

-- UPDATE: Admin/HR/GS
CREATE POLICY "Workers Admin/HR/GS Update"
ON public.workers FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id::uuid = (select auth.uid())
    AND u.role IN ('ADMIN', 'HR', 'GENERAL_SUPERVISOR')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id::uuid = (select auth.uid())
    AND u.role IN ('ADMIN', 'HR', 'GENERAL_SUPERVISOR')
  )
);

-- DELETE: Admin/HR only
CREATE POLICY "Workers Admin/HR Delete"
ON public.workers FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id::uuid = (select auth.uid())
    AND u.role IN ('ADMIN', 'HR')
  )
);

-- 4. AREAS & USER_AREAS: Consolidated cleanup of all policy variations
-- Drop ALL known variations to prevent "Multiple Permissive Policies" warning

-- AREAS TABLE
DROP POLICY IF EXISTS "Allow public read on areas" ON public.areas;
DROP POLICY IF EXISTS "Allow HR/Admin to manage areas" ON public.areas;
DROP POLICY IF EXISTS "Allow HR/Admin to insert areas" ON public.areas;
DROP POLICY IF EXISTS "Allow HR/Admin to update areas" ON public.areas;
DROP POLICY IF EXISTS "Allow HR/Admin to delete areas" ON public.areas;
DROP POLICY IF EXISTS "Areas Admin/HR Manage" ON public.areas;
DROP POLICY IF EXISTS "Areas Public Select" ON public.areas;
DROP POLICY IF EXISTS "Areas Admin/HR Insert" ON public.areas;
DROP POLICY IF EXISTS "Areas Admin/HR Update" ON public.areas;
DROP POLICY IF EXISTS "Areas Admin/HR Delete" ON public.areas;

-- USER_AREAS TABLE
DROP POLICY IF EXISTS "Allow public read on user_areas" ON public.user_areas;
DROP POLICY IF EXISTS "Allow HR/Admin to manage user_areas" ON public.user_areas;
DROP POLICY IF EXISTS "Allow HR/Admin to insert user_areas" ON public.user_areas;
DROP POLICY IF EXISTS "Allow HR/Admin to update user_areas" ON public.user_areas;
DROP POLICY IF EXISTS "Allow HR/Admin to delete user_areas" ON public.user_areas;
DROP POLICY IF EXISTS "UserAreas Admin/HR Manage" ON public.user_areas;
DROP POLICY IF EXISTS "UserAreas Public Select" ON public.user_areas;
DROP POLICY IF EXISTS "UserAreas Admin/HR Insert" ON public.user_areas;
DROP POLICY IF EXISTS "UserAreas Admin/HR Update" ON public.user_areas;
DROP POLICY IF EXISTS "UserAreas Admin/HR Delete" ON public.user_areas;

-- Re-implement cleanly:

-- 4a. AREAS
CREATE POLICY "Areas Public Select" ON public.areas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Areas Admin/HR Insert" ON public.areas FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id::uuid = (select auth.uid()) AND u.role IN ('HR', 'ADMIN')));

CREATE POLICY "Areas Admin/HR Update" ON public.areas FOR UPDATE TO authenticated 
USING (EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id::uuid = (select auth.uid()) AND u.role IN ('HR', 'ADMIN')))
WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id::uuid = (select auth.uid()) AND u.role IN ('HR', 'ADMIN')));

CREATE POLICY "Areas Admin/HR Delete" ON public.areas FOR DELETE TO authenticated 
USING (EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id::uuid = (select auth.uid()) AND u.role IN ('HR', 'ADMIN')));

-- 4b. USER_AREAS
CREATE POLICY "UserAreas Public Select" ON public.user_areas FOR SELECT TO authenticated USING (true);

CREATE POLICY "UserAreas Admin/HR Insert" ON public.user_areas FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id::uuid = (select auth.uid()) AND u.role IN ('HR', 'ADMIN')));

CREATE POLICY "UserAreas Admin/HR Update" ON public.user_areas FOR UPDATE TO authenticated 
USING (EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id::uuid = (select auth.uid()) AND u.role IN ('HR', 'ADMIN')))
WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id::uuid = (select auth.uid()) AND u.role IN ('HR', 'ADMIN')));

CREATE POLICY "UserAreas Admin/HR Delete" ON public.user_areas FOR DELETE TO authenticated 
USING (EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id::uuid = (select auth.uid()) AND u.role IN ('HR', 'ADMIN')));

-- Confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Security hardening policies updated. Duplicates removed and type casting applied.';
END $$;

