-- ==============================================================================
-- Fix: Unindexed Foreign Keys
-- Description:
-- Adds missing indexes to foreign key columns to improve join performance and 
-- prevent performance degradation during cascade operations.
-- ==============================================================================

-- 1. Workers Table: Index on area_id
-- This is critical because nearly all queries filter/sort by area
CREATE INDEX IF NOT EXISTS idx_workers_area_id_new ON public.workers(area_id);

-- 2. User Areas Table: Index on area_id
-- Critical for checking supervisor permissions efficiently
CREATE INDEX IF NOT EXISTS idx_user_areas_area_id ON public.user_areas(area_id);

-- 3. Confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Missing indexes created for improved performance.';
END $$;
