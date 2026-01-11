-- ==========================================
-- ADD NATIONALITY TO WORKERS
-- ==========================================

-- 1. Add nationality column to workers table
ALTER TABLE public.workers 
ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'مصري';

-- 2. Update existing workers (assumed to be Egyptian as per user request)
UPDATE public.workers SET nationality = 'مصري' WHERE nationality IS NULL;

-- Confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Nationality column added to workers table and defaulted to Egyptian.';
END $$;
