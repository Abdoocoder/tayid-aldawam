-- ====================================
-- TayydAldawam - Supabase Database Setup
-- نظام إدارة الحضور الشهري
-- ====================================

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================
-- 1. WORKERS TABLE (جدول العمال)
-- ====================================
CREATE TABLE IF NOT EXISTS workers (
    id TEXT PRIMARY KEY,  -- Worker ID from the original system
    name TEXT NOT NULL,
    area_id TEXT NOT NULL,  -- المنطقة/القطاع
    base_salary DECIMAL(10, 2) NOT NULL,
    day_value DECIMAL(10, 2) NOT NULL,  -- قيمة اليوم الواحد
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries by area
CREATE INDEX IF NOT EXISTS idx_workers_area_id ON workers(area_id);

-- Create index for searching by name
CREATE INDEX IF NOT EXISTS idx_workers_name ON workers(name);

-- ====================================
-- 2. ATTENDANCE RECORDS TABLE (جدول سجلات الحضور)
-- ====================================
CREATE TABLE IF NOT EXISTS attendance_records (
    id TEXT PRIMARY KEY,  -- Format: workerId-month-year
    worker_id TEXT NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
    normal_days INTEGER NOT NULL DEFAULT 0 CHECK (normal_days >= 0),
    overtime_normal_days INTEGER NOT NULL DEFAULT 0 CHECK (overtime_normal_days >= 0),  -- أيام إضافية عادية (0.5x)
    overtime_holiday_days INTEGER NOT NULL DEFAULT 0 CHECK (overtime_holiday_days >= 0),  -- أيام إضافية عطل (1.0x)
    total_calculated_days DECIMAL(10, 2) NOT NULL DEFAULT 0,  -- Calculated total
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one record per worker per month
    UNIQUE(worker_id, month, year)
);

-- Create composite index for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_worker_period ON attendance_records(worker_id, year, month);

-- Create index for querying by period
CREATE INDEX IF NOT EXISTS idx_attendance_period ON attendance_records(year, month);

-- ====================================
-- 3. USERS TABLE (جدول المستخدمين)
-- ====================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('SUPERVISOR', 'HR', 'FINANCE', 'ADMIN')),
    area_id TEXT,  -- Only for SUPERVISOR role
    auth_user_id UUID UNIQUE, -- Link to auth.users
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for login queries
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ====================================
-- 4. AUDIT LOG TABLE (سجل التعديلات)
-- ====================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_by TEXT,  -- Username who made the change
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for querying by table and record
CREATE INDEX IF NOT EXISTS idx_audit_table_record ON audit_logs(table_name, record_id);

-- Create index for time-based queries
CREATE INDEX IF NOT EXISTS idx_audit_changed_at ON audit_logs(changed_at DESC);

-- ====================================
-- 5. FUNCTIONS & TRIGGERS
-- ====================================

-- Function to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to workers table
DROP TRIGGER IF EXISTS set_timestamp_workers ON workers;
CREATE TRIGGER set_timestamp_workers
    BEFORE UPDATE ON workers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to attendance_records table
DROP TRIGGER IF EXISTS set_timestamp_attendance ON attendance_records;
CREATE TRIGGER set_timestamp_attendance
    BEFORE UPDATE ON attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to users table
DROP TRIGGER IF EXISTS set_timestamp_users ON users;
CREATE TRIGGER set_timestamp_users
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate total days and auto-update
CREATE OR REPLACE FUNCTION calculate_total_days()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_calculated_days = 
        NEW.normal_days + 
        (NEW.overtime_normal_days * 0.5) + 
        (NEW.overtime_holiday_days * 1.0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to automatically calculate total_calculated_days
DROP TRIGGER IF EXISTS calculate_days_trigger ON attendance_records;
CREATE TRIGGER calculate_days_trigger
    BEFORE INSERT OR UPDATE OF normal_days, overtime_normal_days, overtime_holiday_days
    ON attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION calculate_total_days();

-- ====================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================

-- Enable RLS on all tables
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Workers Policies: Everyone can read, only authenticated can modify
DROP POLICY IF EXISTS "Allow public read access to workers" ON workers;
CREATE POLICY "Allow public read access to workers"
    ON workers FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert on workers" ON workers;
CREATE POLICY "Allow authenticated insert on workers"
    ON workers FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update on workers" ON workers;
CREATE POLICY "Allow authenticated update on workers"
    ON workers FOR UPDATE
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete on workers" ON workers;
CREATE POLICY "Allow authenticated delete on workers"
    ON workers FOR DELETE
    USING (true);

-- Attendance Records Policies: Everyone can read, only authenticated can modify
DROP POLICY IF EXISTS "Allow public read access to attendance" ON attendance_records;
CREATE POLICY "Allow public read access to attendance"
    ON attendance_records FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert on attendance" ON attendance_records;
CREATE POLICY "Allow authenticated insert on attendance"
    ON attendance_records FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update on attendance" ON attendance_records;
CREATE POLICY "Allow authenticated update on attendance"
    ON attendance_records FOR UPDATE
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete on attendance" ON attendance_records;
CREATE POLICY "Allow authenticated delete on attendance"
    ON attendance_records FOR DELETE
    USING (true);

-- Users Policies: Public read, authenticated modify
DROP POLICY IF EXISTS "Allow public read access to users" ON users;
CREATE POLICY "Allow public read access to users"
    ON users FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert on users" ON users;
CREATE POLICY "Allow authenticated insert on users"
    ON users FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update on users" ON users;
CREATE POLICY "Allow authenticated update on users"
    ON users FOR UPDATE
    USING (true);

-- Audit Logs Policies: Read only for authenticated
DROP POLICY IF EXISTS "Allow public read access to audit_logs" ON audit_logs;
CREATE POLICY "Allow public read access to audit_logs"
    ON audit_logs FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert on audit_logs" ON audit_logs;
CREATE POLICY "Allow authenticated insert on audit_logs"
    ON audit_logs FOR INSERT
    WITH CHECK (true);

-- ====================================
-- 7. INSERT MOCK USERS
-- ====================================
INSERT INTO users (id, username, name, role, area_id, is_active) VALUES
    ('11111111-1111-1111-1111-111111111111', 'sup_laili', 'مراقب - ليلي - مالك العبابسة', 'SUPERVISOR', 'ليلي - مالك العبابسة', true),
    ('22222222-2222-2222-2222-222222222222', 'sup_general', 'مراقب عام', 'SUPERVISOR', 'ALL', true),
    ('33333333-3333-3333-3333-333333333333', 'sup_mohafetha', 'مراقب - مراسل - المحافظة', 'SUPERVISOR', 'مراسل - المحافظة', true),
    ('44444444-4444-4444-4444-444444444444', 'hr_manager', 'مدير الموارد البشرية', 'HR', NULL, true),
    ('55555555-5555-5555-5555-555555555555', 'finance_manager', 'المسؤول المالي', 'FINANCE', NULL, true)
ON CONFLICT (username) DO NOTHING;

-- ====================================
-- 8. HELPFUL VIEWS
-- ====================================

-- View for payroll calculation
CREATE OR REPLACE VIEW payroll_view AS
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
    ar.total_calculated_days,
    (ar.total_calculated_days * w.day_value) as total_salary,
    ar.updated_at
FROM workers w
LEFT JOIN attendance_records ar ON w.id = ar.worker_id
ORDER BY w.area_id, w.name;

-- View for monthly summary
CREATE OR REPLACE VIEW monthly_summary AS
SELECT 
    ar.year,
    ar.month,
    COUNT(DISTINCT ar.worker_id) as total_workers,
    SUM(ar.normal_days) as total_normal_days,
    SUM(ar.overtime_normal_days) as total_overtime_normal,
    SUM(ar.overtime_holiday_days) as total_overtime_holiday,
    SUM(ar.total_calculated_days) as total_calculated_days,
    SUM(ar.total_calculated_days * w.day_value) as total_payroll
FROM attendance_records ar
JOIN workers w ON ar.worker_id = w.id
GROUP BY ar.year, ar.month
ORDER BY ar.year DESC, ar.month DESC;

-- ====================================
-- SETUP COMPLETE!
-- ====================================

-- Display setup summary
DO $$
BEGIN
    RAISE NOTICE '✅ Database setup completed successfully!';
    RAISE NOTICE '📊 Tables created: workers, attendance_records, users, audit_logs';
    RAISE NOTICE '🔍 Views created: payroll_view, monthly_summary';
    RAISE NOTICE '⚡ Triggers enabled for auto-updates';
    RAISE NOTICE '🔒 Row Level Security enabled';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Run the migration script to import initial data';
    RAISE NOTICE '2. Configure your .env.local with Supabase credentials';
    RAISE NOTICE '3. Test the connection from your Next.js app';
END $$;
