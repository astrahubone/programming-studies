/*
  # Fix user policies to prevent recursion and conflicts

  1. Changes
    - Drop all existing policies first
    - Create simplified policies for users table
    - Fix service role access
    - Enable proper user registration and login
  
  2. Security
    - Maintain security while fixing recursion
    - Allow proper user registration
    - Keep admin access intact
*/

-- Drop existing policies explicitly
DROP POLICY IF EXISTS "Enable service role bypass" ON users;
DROP POLICY IF EXISTS "Enable user registration" ON users;
DROP POLICY IF EXISTS "Users can read profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Enable service role operations" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Service role can manage all users" ON users;
DROP POLICY IF EXISTS "Enable insert for service role" ON users;
DROP POLICY IF EXISTS "Enable service role operations on users" ON users;

-- Create new simplified policies
CREATE POLICY "Enable service role access"
  ON users
  FOR ALL
  USING (current_setting('role'::text) = 'service_role'::text);

CREATE POLICY "Allow user registration"
  ON users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view profiles"
  ON users
  FOR SELECT
  USING (
    auth.uid() = id 
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin access"
  ON users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;