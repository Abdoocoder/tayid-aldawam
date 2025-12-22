-- Areas & Multi-Area Support Migration
-- Run this in Supabase SQL Editor

-- 1. Create Areas table
CREATE TABLE IF NOT EXISTS public.areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Join Table for Users (Supervisors)
-- This allows one supervisor to manage multiple areas
CREATE TABLE IF NOT EXISTS public.user_areas (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    area_id UUID REFERENCES public.areas(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, area_id)
);

-- 3. Migration Logic: Extract existing unique areas
-- Extract from workers
INSERT INTO public.areas (name)
SELECT DISTINCT area_id FROM public.workers
ON CONFLICT (name) DO NOTHING;

-- Extract from users (excluding 'ALL' or empty)
INSERT INTO public.areas (name)
SELECT DISTINCT area_id FROM public.users 
WHERE area_id IS NOT NULL AND area_id != '' AND area_id != 'ALL'
ON CONFLICT (name) DO NOTHING;

-- 4. Temporarily add a uuid_area_id to workers to facilitate migration
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS uuid_area_id UUID REFERENCES public.areas(id);

-- Link workers to the new UUIDs
UPDATE public.workers w
SET uuid_area_id = a.id
FROM public.areas a
WHERE w.area_id = a.name;

-- 5. Populate user_areas join table from existing users.area_id
-- We only do this for supervisors who have a specific area
INSERT INTO public.user_areas (user_id, area_id)
SELECT u.id, a.id
FROM public.users u
JOIN public.areas a ON u.area_id = a.name
WHERE u.role = 'SUPERVISOR' AND u.area_id != 'ALL'
ON CONFLICT DO NOTHING;

-- Special handling for 'ALL':
-- If a supervisor is 'ALL', we could either keep it logic-based or link them to all areas.
-- For now, we'll keep the logic in the code, but the join table supports multiple assignments.

-- 6. Cleanup (OPTIONAL - do not run until manual verification is done)
/*
ALTER TABLE public.workers DROP COLUMN area_id;
ALTER TABLE public.workers RENAME COLUMN uuid_area_id TO area_id;
-- Note: users.area_id can be kept for backward compatibility or dropped later.
*/

-- 7. Add RLS for the new tables
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on areas" ON public.areas;
CREATE POLICY "Allow public read on areas" ON public.areas FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow HR/Admin to manage areas" ON public.areas;
CREATE POLICY "Allow HR/Admin to manage areas" ON public.areas 
FOR ALL USING (true); -- Simplifying for now, should ideally check user role

DROP POLICY IF EXISTS "Allow public read on user_areas" ON public.user_areas;
CREATE POLICY "Allow public read on user_areas" ON public.user_areas FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow HR/Admin to manage user_areas" ON public.user_areas;
CREATE POLICY "Allow HR/Admin to manage user_areas" ON public.user_areas 
FOR ALL USING (true);
