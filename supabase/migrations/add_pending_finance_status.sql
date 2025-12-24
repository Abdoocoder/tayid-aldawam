-- Migration: Add PENDING_FINANCE status to attendance_records
-- Description: Updates the status check constraint to support the new 4-stage approval workflow

-- First, we need to temporarily drop the constraint
ALTER TABLE attendance_records 
DROP CONSTRAINT IF EXISTS attendance_records_status_check;

-- Add the updated constraint with PENDING_FINANCE
ALTER TABLE attendance_records 
ADD CONSTRAINT attendance_records_status_check 
CHECK (status IN ('PENDING_GS', 'PENDING_HR', 'PENDING_FINANCE', 'APPROVED'));

-- Update any existing records that might be affected (optional, based on your needs)
-- This would typically not be needed as status should already be valid
-- But included for completeness
-- UPDATE attendance_records SET status = 'PENDING_FINANCE' WHERE status = 'PENDING_HR' AND ... (your conditions);
