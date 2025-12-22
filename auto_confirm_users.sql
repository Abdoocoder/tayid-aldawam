-- Auto-Confirm Users SQL Script (FIXED)
-- Run this in Supabase SQL Editor

-- This trigger will automatically mark every new user as "Confirmed"
-- so they can log in immediately without checking email.

CREATE OR REPLACE FUNCTION public.handle_auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  -- We only update email_confirmed_at as confirmed_at is likely generated from it
  UPDATE auth.users 
  SET email_confirmed_at = NOW(),
      last_sign_in_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_confirm
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auto_confirm_user();

-- Also, confirm all existing unconfirmed users
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
