-- ==========================================
-- FINAL SYSTEM FIX: ROLES & USER SYNC
-- ==========================================

-- 1. Fix User Roles (Allow MAYOR and GENERAL_SUPERVISOR)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('SUPERVISOR', 'GENERAL_SUPERVISOR', 'HR', 'FINANCE', 'ADMIN', 'MAYOR'));

-- 2. Fix Orphaned Users & Auto-Cleanup
-- First, drop old constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_auth_user_id_fkey;

-- Clean up any orphaned records now
DELETE FROM public.users 
WHERE auth_user_id IS NOT NULL 
AND auth_user_id NOT IN (SELECT id FROM auth.users);

-- Add CASCADE to ensure deletion in Auth dashboard also deletes from public.users
ALTER TABLE public.users 
ADD CONSTRAINT users_auth_user_id_fkey 
FOREIGN KEY (auth_user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 3. Cleanup specific user email if it's causing conflicts
DELETE FROM public.users WHERE username = 'sama.s.soft@gmail.com';

-- 4. Update Trigger to be more robust
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
    false
  )
  ON CONFLICT (auth_user_id) DO UPDATE SET
    username = EXCLUDED.username,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    area_id = EXCLUDED.area_id,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
