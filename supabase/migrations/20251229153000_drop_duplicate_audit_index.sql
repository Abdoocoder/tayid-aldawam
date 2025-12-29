-- Drop duplicate index on audit_logs table
-- Linter Warning: Table `public.audit_logs` has identical indexes {idx_audit_changed_at,idx_audit_logs_changed_at}.
-- We are keeping `idx_audit_logs_changed_at` as it follows the naming convention suitable for the table `audit_logs`.

DROP INDEX IF EXISTS idx_audit_changed_at;
