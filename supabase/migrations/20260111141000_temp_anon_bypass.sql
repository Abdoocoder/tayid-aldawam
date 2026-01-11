
-- TEMPORARY BYPASS FOR MIGRATION SCRIPT
-- This allows the 'anon' role (used in development/migration scripts with public keys) to manage data.
-- WARNING: Do not leave this in production.

-- 1. Areas
DROP POLICY IF EXISTS "Areas Admin/HR Insert" ON public.areas;
CREATE POLICY "Temp Anon Insert Areas" ON public.areas FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Temp Anon Select Areas" ON public.areas FOR SELECT TO anon USING (true);

-- 2. Workers
DROP POLICY IF EXISTS "Workers Admin/HR Insert" ON public.workers;
CREATE POLICY "Temp Anon Insert Workers" ON public.workers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Temp Anon Update Workers" ON public.workers FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Temp Anon Select Workers" ON public.workers FOR SELECT TO anon USING (true);

-- 3. Attendance Records
DROP POLICY IF EXISTS "Admin/Supervisor Insert" ON public.attendance_records;
CREATE POLICY "Temp Anon Insert Attendance" ON public.attendance_records FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Temp Anon Select Attendance" ON public.attendance_records FOR SELECT TO anon USING (true);
CREATE POLICY "Temp Anon Update Attendance" ON public.attendance_records FOR UPDATE TO anon USING (true);

-- Disable triggers that might cause issues with missing auth.uid() in audit logs
ALTER TABLE public.attendance_records DISABLE TRIGGER audit_attendance_changes;
