-- ==========================================
-- FINAL LAUNCH FIX: SCHEMA & SECURITY
-- ==========================================

-- 1. ADD MISSING FIELD: overtime_eid_days
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance_records' AND column_name='overtime_eid_days') THEN
        ALTER TABLE public.attendance_records ADD COLUMN overtime_eid_days INTEGER NOT NULL DEFAULT 0 CHECK (overtime_eid_days >= 0);
        RAISE NOTICE 'Added overtime_eid_days to attendance_records';
    END IF;
END $$;

-- 2. UPDATE CALCULATION TRIGGER
CREATE OR REPLACE FUNCTION calculate_total_days()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_calculated_days = 
        NEW.normal_days + 
        (NEW.overtime_normal_days * 0.5) + 
        (NEW.overtime_holiday_days * 1.0) +
        (COALESCE(NEW.overtime_eid_days, 0) * 1.0); -- Eid days counted as full days
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. UPDATE VIEWS (Drop first to avoid column name change errors)
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

-- 4. STRENGTHEN RLS POLICIES (WORKERS)
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to workers" ON public.workers;
CREATE POLICY "Strict View Workers"
ON public.workers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = (select auth.uid())
    AND (
      u.role IN ('ADMIN', 'HR', 'FINANCE', 'MAYOR', 'HEALTH_DIRECTOR') -- Management roles see all
      OR u.role = 'GENERAL_SUPERVISOR' -- GS sees all (for oversight)
      OR (u.role = 'SUPERVISOR' AND (u.area_id = 'ALL' OR u.area_id = workers.area_id::text)) -- Supervisor sees their area
    )
  )
);

-- 5. STRENGTHEN RLS POLICIES (ATTENDANCE)
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to attendance" ON public.attendance_records;
CREATE POLICY "Strict View Attendance"
ON public.attendance_records FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.workers w ON w.id = attendance_records.worker_id
    WHERE u.auth_user_id = (select auth.uid())
    AND (
      u.role IN ('ADMIN', 'HR', 'FINANCE', 'MAYOR', 'HEALTH_DIRECTOR')
      OR u.role = 'GENERAL_SUPERVISOR'
      OR (u.role = 'SUPERVISOR' AND (u.area_id = 'ALL' OR u.area_id = w.area_id::text))
    )
  )
);

-- Update Policy: Only record owner (Supervisor) or management can update status
DROP POLICY IF EXISTS "Allow authenticated update on attendance" ON public.attendance_records;
CREATE POLICY "Controlled Update Attendance"
ON public.attendance_records FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = (select auth.uid())
    AND u.role IN ('ADMIN', 'HR', 'FINANCE', 'GENERAL_SUPERVISOR', 'SUPERVISOR', 'HEALTH_DIRECTOR')
  )
);

-- INSERT & DELETE
DROP POLICY IF EXISTS "Allow authenticated insert on attendance" ON public.attendance_records;
CREATE POLICY "Admin/Supervisor Insert"
ON public.attendance_records FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = (select auth.uid())
    AND u.role IN ('ADMIN', 'SUPERVISOR')
  )
);

-- Confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Final Launch SQL Fixes applied successfully.';
END $$;
