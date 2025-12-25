-- ==============================================================================
-- Fix: Worker Visibility for Supervisors with Multiple Areas
-- Description:
-- 1. Drops incomplete/restrictive policies on the 'workers' table.
-- 2. Implements a comprehensive 'SELECT' policy that allows access if:
--    a. User is ADMIN, HR, FINANCE, MAYOR, or GENERAL_SUPERVISOR (Full Access).
--    b. User is SUPERVISOR and the worker is in their Primary Area (Legacy).
--    c. User is SUPERVISOR and the worker is in one of their Assigned Areas (New Multi-Area).
-- ==============================================================================

-- 1. Drop existing policies on 'workers'
DROP POLICY IF EXISTS "Allow public read access to workers" ON public.workers;
DROP POLICY IF EXISTS "Allow base read access to workers" ON public.workers;
DROP POLICY IF EXISTS "Allow read access for all active users" ON public.workers;
-- (Add other potential names to be safe)

-- 2. Create the new Comprehensive Read Policy
CREATE POLICY "Allow comprehensive read access to workers"
ON public.workers FOR SELECT
USING (
  -- 1. Allow Public Read (Optional - remove if you want strict auth only)
  -- (auth.role() = 'anon') OR 
  
  -- 2. Allow Authenticated Users based on Role Logic
  (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = (select auth.uid())
      AND (
        -- A. Roles with Global Access
        u.role IN ('ADMIN', 'HR', 'FINANCE', 'MAYOR', 'GENERAL_SUPERVISOR')
        
        OR 
        
        -- B. Supervisors (Check Assignments)
        (
          u.role = 'SUPERVISOR' 
          AND (
            -- Case 1: Worker is in Supervisor's Primary Area (Legacy)
            workers.area_id::text = u.area_id::text
            
            OR
            
            -- Case 2: Worker is in one of Supervisor's Assigned Areas (via user_areas)
            EXISTS (
              SELECT 1 FROM public.user_areas ua
              JOIN public.areas a ON ua.area_id = a.id
              WHERE ua.user_id = u.id
              AND (
                -- Match by Area UUID (New System)
                workers.area_id::text = a.id::text
                OR
                -- Match by Area Name (Legacy System Hybrid)
                workers.area_id::text = a.name
              )
            )
          )
        )
      )
    )
  )
);

-- 3. Confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Worker visibility RLS policy updated successfully.';
END $$;
