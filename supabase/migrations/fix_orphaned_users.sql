-- 1. Clean up orphaned records for the specific user (and any others)
DELETE FROM public.users 
WHERE username = 'sama.s.soft@gmail.com' 
OR auth_user_id NOT IN (SELECT id FROM auth.users);

-- 2. Add ON DELETE CASCADE to prevent this in the future
-- We need to drop and recreate the constraint
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_auth_user_id_fkey;

ALTER TABLE public.users 
ADD CONSTRAINT users_auth_user_id_fkey 
FOREIGN KEY (auth_user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 3. Also fix the unique constraint on username to ensure it links correctly
-- (This is already handled by the trigger but good to have)
