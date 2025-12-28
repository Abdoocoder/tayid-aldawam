-- Update the check constraint for user roles to include INTERNAL_AUDIT
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
    'ADMIN', 
    'MAYOR'
));
