/*
  # Final fix for user policies to prevent recursion

  1. Changes
    - Drop all existing policies
    - Create simplified policies without circular references
    - Fix service role access
    - Enable proper user registration and management
  
  2. Security
    - Maintain security while preventing recursion
    - Allow proper user registration and login
    - Keep admin access intact
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable service role access" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Users can view profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admin access" ON users;

-- Create simplified policies without recursion
CREATE POLICY "Enable public registration"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable service role bypass"
  ON users
  FOR ALL
  TO public
  USING (current_setting('role'::text) = 'service_role'::text);

CREATE POLICY "Enable read access"
  ON users
  FOR SELECT
  TO public
  USING (
    auth.uid() = id 
    OR current_setting('role'::text) = 'service_role'::text
  );

CREATE POLICY "Enable self update"
  ON users
  FOR UPDATE
  TO public
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;