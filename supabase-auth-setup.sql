-- ====================================
-- Supabase Auth Integration
-- Link auth.users to app users table
-- ====================================

-- Add auth_user_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

-- Function to create app user on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table when new auth user is created
  -- Role will be taken from user metadata
  INSERT INTO public.users (id, auth_user_id, username, name, role, is_active)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'SUPERVISOR'),
    true
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add unique constraint on auth_user_id
ALTER TABLE users ADD CONSTRAINT users_auth_user_id_key UNIQUE (auth_user_id);

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
      AND u.role IN ('HR', 'FINANCE')
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
      AND u.role IN ('HR', 'FINANCE')
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
