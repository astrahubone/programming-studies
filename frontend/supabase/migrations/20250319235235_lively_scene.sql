/*
  # Fix user policies to prevent recursion

  1. Changes
    - Drop existing policies that cause recursion
    - Create simplified policies for users table
    - Fix service role access
    - Enable proper user registration and login
  
  2. Security
    - Maintain security while fixing recursion
    - Allow proper user registration
    - Keep admin access intact
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable service role operations on users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Service role can manage all users" ON users;

-- Create simplified policies
CREATE POLICY "Enable service role operations"
  ON users
  FOR ALL
  USING (current_setting('role'::text) = 'service_role'::text);

CREATE POLICY "Enable user registration"
  ON users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can read profiles"
  ON users
  FOR SELECT
  USING (
    auth.uid() = id 
    OR role = 'admin'
  );

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage users"
  ON users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;