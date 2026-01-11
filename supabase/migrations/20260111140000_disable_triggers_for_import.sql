
-- Temporary disable triggers for bulk import
ALTER TABLE public.attendance_records DISABLE TRIGGER audit_attendance_changes;
ALTER TABLE public.attendance_records DISABLE TRIGGER trigger_calculate_total_days;

-- Relax RLS for maintenance
ALTER TABLE public.attendance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
