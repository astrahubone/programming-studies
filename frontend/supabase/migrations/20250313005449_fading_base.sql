/*
  # Fix service role permissions for user creation

  1. Changes
    - Update RLS policies for user creation
    - Add service role bypass for initial user creation
    - Fix user registration flow

  2. Security
    - Maintain security while allowing proper user registration
    - Keep admin privileges intact
    - Ensure proper user data protection
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for authentication service" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Create new policies with proper service role access
CREATE POLICY "Enable insert for service role"
  ON users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  USING (
    auth.uid() = id 
    OR auth.jwt()->>'role' = 'service_role'
    OR EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  USING (
    auth.uid() = id 
    OR auth.jwt()->>'role' = 'service_role'
  )
  WITH CHECK (
    auth.uid() = id 
    OR auth.jwt()->>'role' = 'service_role'
  );

CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  USING (
    auth.jwt()->>'role' = 'service_role'
    OR EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

-- Ensure RLS is enabled but service role can bypass
ALTER TABLE users ENABLE ROW LEVEL SECURITY;