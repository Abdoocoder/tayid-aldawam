-- ==========================================
-- ADD HANDLED NATIONALITY TO USERS
-- ==========================================

-- 1. Add handled_nationality column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS handled_nationality TEXT DEFAULT 'ALL';

-- Confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ handled_nationality column added to users table and defaulted to ALL.';
END $$;
