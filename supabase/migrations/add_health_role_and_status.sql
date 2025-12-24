-- ==========================================
-- ADD HEALTH_DIRECTOR ROLE AND PENDING_HEALTH STATUS
-- ==========================================

-- 1. Update User Roles constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('SUPERVISOR', 'GENERAL_SUPERVISOR', 'HEALTH_DIRECTOR', 'HR', 'FINANCE', 'ADMIN', 'MAYOR'));

-- 2. Update Attendance Status constraint
ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_status_check;
ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_status_check 
CHECK (status IN ('PENDING_SUPERVISOR', 'PENDING_GS', 'PENDING_HEALTH', 'PENDING_HR', 'PENDING_FINANCE', 'APPROVED'));

-- Confirmation notice
DO $$
BEGIN
    RAISE NOTICE '✅ Added HEALTH_DIRECTOR role and PENDING_HEALTH status constraints.';
END $$;
