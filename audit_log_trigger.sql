-- ====================================
-- Audit Log Triggers Setup
-- ====================================

-- 1. Helper function to get current user's identity
CREATE OR REPLACE FUNCTION get_current_username()
RETURNS TEXT AS $$
DECLARE
    cur_uid UUID;
    cur_username TEXT;
    cur_email TEXT;
BEGIN
    -- unique id from auth context
    cur_uid := auth.uid();
    
    -- If no auth uid, it's likely a system operation
    IF cur_uid IS NULL THEN
        RETURN 'system';
    END IF;

    -- Try to find username from public.users
    SELECT username INTO cur_username
    FROM public.users
    WHERE auth_user_id = cur_uid;

    IF cur_username IS NOT NULL THEN
        RETURN cur_username;
    END IF;

    -- Fallback to email from jwt
    -- Note: auth.jwt() returns jsonb
    cur_username := COALESCE(
        auth.jwt() ->> 'email',
        'unknown_user'
    );
    
    RETURN cur_username;
EXCEPTION WHEN OTHERS THEN
    RETURN 'error_getting_user';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Main Trigger Function
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
    current_user_name TEXT;
    record_identifier TEXT;
    old_val JSONB;
    new_val JSONB;
BEGIN
    -- Get current user
    current_user_name := get_current_username();

    -- Determine record ID based on table structure
    -- All our main tables have an 'id' column
    IF (TG_OP = 'DELETE') THEN
        record_identifier := OLD.id::TEXT;
        old_val := to_jsonb(OLD);
        new_val := NULL;
    ELSIF (TG_OP = 'UPDATE') THEN
        record_identifier := NEW.id::TEXT;
        old_val := to_jsonb(OLD);
        new_val := to_jsonb(NEW);
    ELSIF (TG_OP = 'INSERT') THEN
        record_identifier := NEW.id::TEXT;
        old_val := NULL;
        new_val := to_jsonb(NEW);
    END IF;

    -- Insert into audit_logs
    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        action,
        old_data,
        new_data,
        changed_by,
        changed_at
    ) VALUES (
        TG_TABLE_NAME,
        record_identifier,
        TG_OP,
        old_val,
        new_val,
        current_user_name,
        NOW()
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Apply Triggers to Tables

-- Workers Table
DROP TRIGGER IF EXISTS audit_workers_trigger ON public.workers;
CREATE TRIGGER audit_workers_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.workers
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Attendance Records Table
DROP TRIGGER IF EXISTS audit_attendance_trigger ON public.attendance_records;
CREATE TRIGGER audit_attendance_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.attendance_records
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Users Table
DROP TRIGGER IF EXISTS audit_users_trigger ON public.users;
CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.users
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Display Success Message
DO $$
BEGIN
    RAISE NOTICE '✅ Audit logging system installed successfully.';
    RAISE NOTICE '   - Helper function: get_current_username()';
    RAISE NOTICE '   - Trigger function: log_audit_event()';
    RAISE NOTICE '   - Triggers applied to: workers, attendance_records, users';
END $$;
