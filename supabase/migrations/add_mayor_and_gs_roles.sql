-- Migration: Add MAYOR and GENERAL_SUPERVISOR roles to users table
-- Description: Updates the role check constraint to support all defined system roles

-- 1. Drop the existing role constraint
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Add the updated constraint with all system roles
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('SUPERVISOR', 'GENERAL_SUPERVISOR', 'HR', 'FINANCE', 'ADMIN', 'MAYOR'));

-- 3. Verify labels for clarity
COMMENT ON CONSTRAINT users_role_check ON users IS 'Ensures users are assigned a valid system role including the Mayor role.';
