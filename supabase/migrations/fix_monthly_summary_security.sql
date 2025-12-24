-- ==============================================================================
-- Fix: Security Definer View Issue
-- Description: Re-creating 'monthly_summary' view with 'security_invoker = true'
-- This ensures that the view respects the Row Level Security (RLS) policies
-- of the querying user, rather than executing with the creator's permissions.
-- ==============================================================================

-- 1. Drop existing view
-- We use DROP VIEW IF EXISTS to avoid errors if the view was already dropped or doesn't exist.
DROP VIEW IF EXISTS public.monthly_summary;

-- 2. Re-create the view with security_invoker = true
CREATE OR REPLACE VIEW public.monthly_summary
WITH (security_invoker = true) -- This is the critical security fix
AS
SELECT 
    ar.year,
    ar.month,
    COUNT(DISTINCT ar.worker_id) as total_workers,
    SUM(ar.normal_days) as total_normal_days,
    SUM(ar.overtime_normal_days) as total_overtime_normal,
    SUM(ar.overtime_holiday_days) as total_overtime_holiday,
    SUM(ar.total_calculated_days) as total_calculated_days,
    SUM(ar.total_calculated_days * w.day_value) as total_payroll
FROM attendance_records ar
JOIN workers w ON ar.worker_id = w.id
GROUP BY ar.year, ar.month
ORDER BY ar.year DESC, ar.month DESC;

-- 3. Log completion (Optional, visible if run via psql or Supabase Query Editor)
DO $$
BEGIN
    RAISE NOTICE '✅ monthly_summary view updated with security_invoker = true';
END $$;
