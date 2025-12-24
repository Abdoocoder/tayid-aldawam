-- Secure SQL Trigger for User Profile Creation
-- Updates default is_active to false (Pending Approval)

-- 1. Create or Replace the function with SECURE defaults
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, username, name, role, area_id, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'SUPERVISOR'), -- Role is set but inactive
    NEW.raw_user_meta_data->>'areaId',
    false -- <--- CRITICAL CHANGE: Default to false (Pending Approval)
  )
  ON CONFLICT (auth_user_id) DO UPDATE SET
    -- On conflict, we DO NOT auto-activate. We only update details.
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    area_id = EXCLUDED.area_id,
    updated_at = NOW();
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure trigger is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
