-- Add PAYROLL to user_roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN (
    'SUPERVISOR', 
    'GENERAL_SUPERVISOR', 
    'HEALTH_DIRECTOR', 
    'HR', 
    'INTERNAL_AUDIT', 
    'FINANCE', 
    'PAYROLL',
    'ADMIN', 
    'MAYOR'
));

-- Add PENDING_PAYROLL to attendance_status
ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_status_check;

ALTER TABLE attendance_records
ADD CONSTRAINT attendance_records_status_check
CHECK (status IN (
    'PENDING_SUPERVISOR',
    'PENDING_GS',
    'PENDING_HEALTH',
    'PENDING_HR',
    'PENDING_AUDIT',
    'PENDING_FINANCE',
    'PENDING_PAYROLL',
    'APPROVED'
));
