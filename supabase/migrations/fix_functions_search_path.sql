-- ==============================================================================
-- Fix: Function Search Path Mutable Warnings
-- Description:
-- Explicitly sets the 'search_path' to 'public' for SECURITY DEFINER and other 
-- critical functions. This prevents malicious users from hijacking the search path 
-- to execute arbitrary code or creating tables that shadow system tables.
-- ==============================================================================

-- 1. Fix handle_new_user (Critical - SECURITY DEFINER)
ALTER FUNCTION public.handle_new_user() 
SET search_path = public;

-- 2. Fix update_updated_at_column (Trigger Function)
ALTER FUNCTION public.update_updated_at_column() 
SET search_path = public;

-- 3. Fix calculate_total_days (Trigger Function)
ALTER FUNCTION public.calculate_total_days() 
SET search_path = public;

-- 4. Fix handle_auto_confirm_user (If it exists, based on your warning)
-- Using DO block to avoid error if function doesn't exist in some environments
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_auto_confirm_user') THEN
        ALTER FUNCTION public.handle_auto_confirm_user() SET search_path = public;
    END IF;
END $$;

-- 5. Confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ search_path set to public for critical functions.';
END $$;
