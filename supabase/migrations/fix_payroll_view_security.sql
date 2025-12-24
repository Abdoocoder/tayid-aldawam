-- ==============================================================================
-- Fix: Security Definer View Issue (Part 2)
-- Description: Re-creating 'payroll_view' view with 'security_invoker = true'
-- This ensures that the view respects the Row Level Security (RLS) policies
-- of the querying user.
-- ==============================================================================

-- 1. Drop existing view
DROP VIEW IF EXISTS public.payroll_view;

-- 2. Re-create the view with security_invoker = true
CREATE OR REPLACE VIEW public.payroll_view
WITH (security_invoker = true) -- The security fix
AS
SELECT 
    w.id,
    w.name,
    w.area_id,
    w.day_value,
    ar.month,
    ar.year,
    ar.normal_days,
    ar.overtime_normal_days,
    ar.overtime_holiday_days,
    ar.total_calculated_days,
    (ar.total_calculated_days * w.day_value) as total_salary,
    ar.updated_at
FROM workers w
LEFT JOIN attendance_records ar ON w.id = ar.worker_id
ORDER BY w.area_id, w.name;

-- 3. Log completion
DO $$
BEGIN
    RAISE NOTICE '✅ payroll_view updated with security_invoker = true';
END $$;
