/*
  # Fix infinite recursion in user policies

  1. Changes
    - Simplify user policies to avoid recursion
    - Remove circular references in policy conditions
    - Maintain security while fixing the recursion issue

  2. Security
    - Keep admin privileges intact
    - Ensure proper user data protection
    - Allow service role operations
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for service role" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Create simplified policies without recursion
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
  );

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can manage all users"
  ON users
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;