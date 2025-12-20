-- 0. Fix potential schema mismatch: Update the role check constraint
-- Your database seems to have an older version of the constraint that doesn't include 'ADMIN'.
-- We drop and re-add it to be sure.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('SUPERVISOR', 'HR', 'FINANCE', 'ADMIN'));

-- 1. Fix the immediate issue: Insert the missing user manually
-- Replace '508daeb2-d9b1-4118-8865-878bc816cdca' with your actual User UID from the error log if different.
INSERT INTO public.users (username, name, role, auth_user_id)
VALUES 
    ('admin_user', 'System Administrator', 'ADMIN', '508daeb2-d9b1-4118-8865-878bc816cdca')
ON CONFLICT (username) DO NOTHING;

-- 2. Prevent this in the future: Create a trigger to automatically creating public.users entry
-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (username, name, role, auth_user_id)
  VALUES (
    NEW.email,                            -- Temporarily use email as username
    NEW.raw_user_meta_data->>'name',      -- Get name from metadata
    COALESCE(NEW.raw_user_meta_data->>'role', 'SUPERVISOR'), -- Default to SUPERVISOR if no role
    NEW.id                                -- Key link
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
