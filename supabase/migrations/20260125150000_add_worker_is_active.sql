-- Add is_active column to workers table
ALTER TABLE public.workers ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- Update existing workers to be active
UPDATE public.workers SET is_active = TRUE WHERE is_active IS NULL;
