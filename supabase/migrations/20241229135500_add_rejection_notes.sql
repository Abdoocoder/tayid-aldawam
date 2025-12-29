-- Add rejection_notes column to attendance_records
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS rejection_notes TEXT;

-- Update the audit log trigger if necessary (usually triggers handle all columns automatically, but good to check)
-- No changes needed if the trigger uses 'TO JSONB' on the whole row.
