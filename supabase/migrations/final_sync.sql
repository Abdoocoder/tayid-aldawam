-- Database Consistency Sync (Standardizing Multipliers)
-- Run this in Supabase SQL Editor to ensure all records follow the correct multipliers

-- 1. Ensure the trigger function is up to date with the latest multipliers
CREATE OR REPLACE FUNCTION calculate_total_days()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_calculated_days = 
        NEW.normal_days + 
        (NEW.overtime_normal_days * 0.5) + 
        (NEW.overtime_holiday_days * 1.0) +
        (COALESCE(NEW.overtime_eid_days, 0) * 1.0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Force a recalculation for all existing records
-- This triggers the 'BEFORE UPDATE' trigger for every row
UPDATE public.attendance_records 
SET updated_at = NOW() 
WHERE true;

-- 3. Verify consistency in views
-- Refresh payroll_view
DROP VIEW IF EXISTS public.payroll_view;
CREATE OR REPLACE VIEW public.payroll_view AS
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

-- Refresh monthly_summary
DROP VIEW IF EXISTS public.monthly_summary;
CREATE OR REPLACE VIEW public.monthly_summary AS
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
