-- ====================================
-- Supabase Auth Integration
-- Link auth.users to app users table
-- ====================================

-- Add auth_user_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

-- Robust function to create app user on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role TEXT := 'SUPERVISOR';
BEGIN
  -- We use a nested block to capture errors specifically during the insert
  BEGIN
    INSERT INTO public.users (id, auth_user_id, username, name, role, is_active)
    VALUES (
      uuid_generate_v4(),
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'User'),
      COALESCE(NEW.raw_user_meta_data->>'role', default_role),
      true
    )
    ON CONFLICT (auth_user_id) DO UPDATE SET
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      updated_at = NOW();
  EXCEPTION 
    WHEN unique_violation THEN
      -- Handle username conflict separately if it happens
      UPDATE public.users 
      SET auth_user_id = NEW.id,
          name = COALESCE(NEW.raw_user_meta_data->>'name', name),
          role = COALESCE(NEW.raw_user_meta_data->>'role', role)
      WHERE username = NEW.email;
    WHEN OTHERS THEN
      RAISE LOG 'Supabase Profile Trigger Error: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add unique constraint on auth_user_id (Idempotent)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_auth_user_id_key') THEN
    ALTER TABLE users ADD CONSTRAINT users_auth_user_id_key UNIQUE (auth_user_id);
  END IF;
END $$;

-- Update RLS policies to use auth.uid()
-- Workers policies remain the same (public read)

-- Attendance Records: Users can only modify their own area's records
DROP POLICY IF EXISTS "Users can insert attendance for their area" ON attendance_records;
CREATE POLICY "Users can insert attendance for their area"
  ON attendance_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN workers w ON w.area_id = u.area_id OR u.area_id = 'ALL'
      WHERE u.auth_user_id = auth.uid()
      AND w.id = attendance_records.worker_id
    )
    OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_user_id = auth.uid()
      AND u.role IN ('HR', 'FINANCE', 'ADMIN')
    )
  );

DROP POLICY IF EXISTS "Users can update attendance for their area" ON attendance_records;
CREATE POLICY "Users can update attendance for their area"
  ON attendance_records FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN workers w ON w.area_id = u.area_id OR u.area_id = 'ALL'
      WHERE u.auth_user_id = auth.uid()
      AND w.id = attendance_records.worker_id
    )
    OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_user_id = auth.uid()
      AND u.role IN ('HR', 'FINANCE', 'ADMIN')
    )
  );

-- ====================================
-- INSTRUCTIONS
-- ====================================
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Enable Email Auth in Supabase Dashboard:
--    Authentication → Providers → Email → Enable
-- 3. Configure OAuth providers (optional):
--    - Google: Add Client ID and Secret
--    - GitHub: Add Client ID and Secret
-- 4. Set redirect URLs:
--    - http://localhost:3000/auth/callback (development)
--    - https://yourdomain.com/auth/callback (production)
