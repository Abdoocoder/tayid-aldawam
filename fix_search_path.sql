-- =============================================
-- FIX: Function Search Path Mutable Warning
-- =============================================

-- PROBLEM:
-- The function 'calculate_total_days' flagged a warning because it doesn't have a fixed search_path.
-- This is a security best practice, especially for triggers.

-- SOLUTION:
-- Re-create the function with 'SET search_path = public'.

BEGIN;

CREATE OR REPLACE FUNCTION public.calculate_total_days()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_calculated_days = 
        NEW.normal_days + 
        (NEW.overtime_normal_days * 0.5) + 
        (NEW.overtime_holiday_days * 1.0) +
        (COALESCE(NEW.overtime_eid_days, 0) * 1.0); -- Eid days counted as full days
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public; -- <--- FIXED: Explicit search path

COMMIT;

DO $$
BEGIN
    RAISE NOTICE '✅ FUNCTION FIXED: calculate_total_days now has a secure search_path.';
END $$;
