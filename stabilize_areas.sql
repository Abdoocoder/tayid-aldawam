-- Final Stabilization Migration for Areas
-- Run this in Supabase SQL Editor to fix the visibility issue

-- 1. Ensure all workers have the correct UUID in the temporary column
UPDATE public.workers w
SET uuid_area_id = a.id
FROM public.areas a
WHERE w.area_id = a.name AND w.uuid_area_id IS NULL;

-- 2. Update users.area_id from name to UUID (for primary area)
-- Create a temporary column for users as well if needed, or just update directly if it's text
UPDATE public.users u
SET area_id = a.id
FROM public.areas a
WHERE u.area_id = a.name;

-- 3. Finalize Workers table: Swap the columns with CASCADE to handle dependencies
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workers' AND column_name='uuid_area_id') THEN
        -- Backup old names to a different column just in case
        ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS old_area_name TEXT;
        UPDATE public.workers SET old_area_name = area_id;
        
        -- Use CASCADE to drop area_id and its dependencies (views/policies)
        -- We will recreate them immediately after
        ALTER TABLE public.workers DROP COLUMN area_id CASCADE;
        ALTER TABLE public.workers RENAME COLUMN uuid_area_id TO area_id;
        
        RAISE NOTICE 'Workers table updated and dependencies dropped. Recreating views and policies...';
    END IF;
END $$;

-- 4. Recreate dependent View (payroll_view)
CREATE OR REPLACE VIEW public.payroll_view AS
SELECT 
    w.id,
    w.name,
    w.area_id, -- This is now the new UUID column
    w.day_value,
    ar.month,
    ar.year,
    ar.normal_days,
    ar.overtime_normal_days,
    ar.overtime_holiday_days,
    ar.total_calculated_days,
    (ar.total_calculated_days * w.day_value) as total_salary,
    ar.updated_at
FROM public.workers w
LEFT JOIN public.attendance_records ar ON w.id = ar.worker_id
ORDER BY w.area_id, w.name;

-- 5. Recreate RLS Policies (if they were dropped by CASCADE)
-- Note: Re-enabling standard public access as defined in the main setup
DROP POLICY IF EXISTS "Allow public read access to workers" ON public.workers;
CREATE POLICY "Allow public read access to workers" ON public.workers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert on workers" ON public.workers;
CREATE POLICY "Allow authenticated insert on workers" ON public.workers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update on workers" ON public.workers;
CREATE POLICY "Allow authenticated update on workers" ON public.workers FOR UPDATE USING (true);

-- 6. Verify user_areas is populated for all supervisors
INSERT INTO public.user_areas (user_id, area_id)
SELECT u.id, CAST(u.area_id AS UUID)
FROM public.users u
WHERE u.role = 'SUPERVISOR' 
  AND u.area_id IS NOT NULL 
  AND u.area_id != 'ALL'
  AND u.area_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' -- Only if it's now a UUID
ON CONFLICT DO NOTHING;

DO $$ 
BEGIN
    RAISE NOTICE 'Standardization complete. Refresh your app to see the workers.';
END $$;
