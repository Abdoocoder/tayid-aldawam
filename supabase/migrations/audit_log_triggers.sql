-- Create Audit Logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID DEFAULT auth.uid(),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users (or specific roles if needed)
-- Allow read access to authenticated users (or specific roles if needed)
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON audit_logs;
DROP POLICY IF EXISTS "Allow public read access to audit_logs" ON audit_logs;
CREATE POLICY "Allow read access to authenticated users" ON audit_logs
    FOR SELECT TO authenticated USING (true);

-- Allow insert access to authenticated users (needed for the trigger function which runs as security definer, but good to have explicit policy if inserted manually too)
-- actually triggers bypass RLS if using security definer, but let's be safe.
DROP POLICY IF EXISTS "Allow insert access to authenticated users" ON audit_logs;
DROP POLICY IF EXISTS "Allow authenticated insert on audit_logs" ON audit_logs;
CREATE POLICY "Allow insert access to authenticated users" ON audit_logs
    FOR INSERT TO authenticated WITH CHECK (true);


-- Create the Audit Log Function
CREATE OR REPLACE FUNCTION handle_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
        VALUES (
            TG_TABLE_NAME,
            NEW.id,
            'UPDATE',
            row_to_json(OLD),
            row_to_json(NEW),
            auth.uid()
        );
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_data, changed_by)
        VALUES (
            TG_TABLE_NAME,
            OLD.id,
            'DELETE',
            row_to_json(OLD),
            auth.uid()
        );
        RETURN OLD;
    ELSIF (TG_OP = 'INSERT') THEN
         INSERT INTO audit_logs (table_name, record_id, action, new_data, changed_by)
        VALUES (
            TG_TABLE_NAME,
            NEW.id,
            'INSERT',
            row_to_json(NEW),
            auth.uid()
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the Trigger on attendance_records
DROP TRIGGER IF EXISTS audit_attendance_changes ON attendance_records;

CREATE TRIGGER audit_attendance_changes
AFTER UPDATE OR DELETE OR INSERT ON attendance_records
FOR EACH ROW EXECUTE FUNCTION handle_audit_log();
