-- Robuset SQL Trigger for User Profile Creation
-- Run this in Supabase SQL Editor to fix missing profiles

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the robust function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, username, name, role, area_id, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'SUPERVISOR'),
    NEW.raw_user_meta_data->>'areaId',
    true
  )
  ON CONFLICT (auth_user_id) DO UPDATE SET
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

-- 3. Re-create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Manual catch-up (Run this to fix existing missing profiles)
INSERT INTO public.users (auth_user_id, username, name, role, area_id, is_active)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'name', email, 'User'),
    COALESCE(raw_user_meta_data->>'role', 'SUPERVISOR'),
    raw_user_meta_data->>'areaId',
    true
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.auth_user_id = au.id)
ON CONFLICT (auth_user_id) DO NOTHING;
