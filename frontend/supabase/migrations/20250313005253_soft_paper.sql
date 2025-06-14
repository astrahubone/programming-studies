/*
  # Fix user creation policies

  1. Changes
    - Add policies to allow user creation during registration
    - Fix RLS policies for users table
    - Ensure proper access control for user management

  2. Security
    - Maintain existing security while allowing registration
    - Keep admin privileges intact
    - Ensure proper user data protection
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Enable insert for authentication service" ON users;

-- Create policies for users table
CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR is_admin());

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable insert for authentication service"
  ON users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (is_admin());

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;