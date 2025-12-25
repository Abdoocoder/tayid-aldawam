-- ==============================================================================
-- Fix: Security Definer View Issue (FINAL)
-- Description: Re-creating 'monthly_summary' and 'payroll_view' with 'security_invoker = true'
-- This ensures that the view respects the Row Level Security (RLS) policies
-- of the querying user. 
-- Includes 'overtime_eid_days' column.
-- ==============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Applying security fix for views: monthly_summary and payroll_view';
END $$;

-- 1. DROP and RECREATE payroll_view with security_invoker
DROP VIEW IF EXISTS public.payroll_view;
CREATE OR REPLACE VIEW public.payroll_view
WITH (security_invoker = true)
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
    ar.overtime_eid_days,
    ar.total_calculated_days,
    (ar.total_calculated_days * w.day_value) as total_salary,
    ar.status,
    ar.updated_at
FROM public.workers w
LEFT JOIN public.attendance_records ar ON w.id = ar.worker_id
ORDER BY w.area_id, w.name;

-- 2. DROP and RECREATE monthly_summary with security_invoker
DROP VIEW IF EXISTS public.monthly_summary;
CREATE OR REPLACE VIEW public.monthly_summary
WITH (security_invoker = true)
AS
SELECT 
    ar.year,
    ar.month,
    COUNT(DISTINCT ar.worker_id) as total_workers,
    SUM(ar.normal_days) as total_normal_days,
    SUM(ar.overtime_normal_days) as total_overtime_normal,
    SUM(ar.overtime_holiday_days) as total_overtime_holiday,
    SUM(COALESCE(ar.overtime_eid_days, 0)) as total_overtime_eid,
    SUM(ar.total_calculated_days) as total_calculated_days,
    SUM(ar.total_calculated_days * w.day_value) as total_payroll
FROM attendance_records ar
JOIN workers w ON ar.worker_id = w.id
GROUP BY ar.year, ar.month
ORDER BY ar.year DESC, ar.month DESC;
