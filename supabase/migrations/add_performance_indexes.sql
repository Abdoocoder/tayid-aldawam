-- ==============================================================================
-- Fix: Database Performance Optimizations
-- Description: 
-- 1. Adds composite indexes for common sorting and filtering patterns.
-- 2. Indexes foreign keys used in RLS policies to reduce lookup overhead.
-- 3. Optimizes audit log retrieval.
-- ==============================================================================

-- 1. RLS Efficiency: Index on auth_user_id in users table
-- This is checked in almost every RLS policy (EXISTS subqueries).
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id_cached ON public.users(auth_user_id);

-- 2. Workers: Composite Index for Area + Name (Primary sorting pattern)
-- Support: ORDER BY area_id ASC, name ASC
CREATE INDEX IF NOT EXISTS idx_workers_area_name ON public.workers(area_id, name);

-- 3. Attendance: Composite Index for Year + Month + Status (Primary reporting pattern)
-- Support: ORDER BY year DESC, month DESC and filtering by status
CREATE INDEX IF NOT EXISTS idx_attendance_year_month_status ON public.attendance_records(year DESC, month DESC, status);

-- 4. Audit Logs: Index on changed_at for Activity Log sorting
-- Support: ORDER BY changed_at DESC
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON public.audit_logs(changed_at DESC);

-- 5. Workers: Index on worker_id in attendance_records (Foreign Key)
-- Improving joins between workers and attendance_records in views
CREATE INDEX IF NOT EXISTS idx_attendance_worker_id ON public.attendance_records(worker_id);

-- Confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Performance optimization indexes created successfully.';
END $$;
