-- Fix User Deletion Bug
-- The users table was missing a DELETE policy, preventing row deletion via RLS.

-- Policy: Allow authenticated delete on users
DROP POLICY IF EXISTS "Allow authenticated delete on users" ON users;
CREATE POLICY "Allow authenticated delete on users"
    ON users FOR DELETE
    USING (true);

-- Optional: If you want to restrict this to only HR or ADMIN roles in the future, 
-- you would use something like:
-- USING (auth.uid() IN (SELECT auth_user_id FROM users WHERE role IN ('HR', 'ADMIN')));
