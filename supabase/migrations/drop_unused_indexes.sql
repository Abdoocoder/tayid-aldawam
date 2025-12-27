-- Description: Drop unused indexes identified by Supabase database linter
-- The following indexes were reported as unused and are being removed to save resources.

DROP INDEX IF EXISTS public.idx_users_username;
DROP INDEX IF EXISTS public.idx_users_role;
DROP INDEX IF EXISTS public.idx_audit_table_record;
DROP INDEX IF EXISTS public.idx_attendance_status;
DROP INDEX IF EXISTS public.idx_attendance_period_status;
DROP INDEX IF EXISTS public.idx_user_areas_area_id;
DROP INDEX IF EXISTS public.idx_users_auth_user_id;

-- Note: If performance issues arise after this, verify if query patterns usage of these columns increased.
