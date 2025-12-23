-- 1. Add 'GENERAL_SUPERVISOR' to the users role constraint
-- Note: Direct check constraint update depends on existing constraint name. 
-- In most Supabase setups, it's safer to just allow the string if it's a simple text field or update the enum if used.
-- Assuming 'role' is a text field with a check constraint:
DO $$ 
BEGIN 
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('SUPERVISOR', 'GENERAL_SUPERVISOR', 'HR', 'FINANCE', 'ADMIN'));
EXCEPTION
    WHEN undefined_object THEN
        -- Handle cases where constraint might not exist yet
        ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('SUPERVISOR', 'GENERAL_SUPERVISOR', 'HR', 'FINANCE', 'ADMIN'));
END $$;

-- 2. Add 'status' column to attendance_records
ALTER TABLE attendance_records 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING_GS' CHECK (status IN ('PENDING_GS', 'PENDING_HR', 'APPROVED'));

-- 3. Update existing records to 'APPROVED' so previous data isn't lost
UPDATE attendance_records SET status = 'APPROVED' WHERE status IS NULL;

-- 4. Create index for performance
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance_records(status);
CREATE INDEX IF NOT EXISTS idx_attendance_period_status ON attendance_records(month, year, status);
