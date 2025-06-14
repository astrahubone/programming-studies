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

-- First, drop ALL existing policies on users table
DO $$ 
BEGIN
  -- Get all policy names and drop them
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'users' 
    AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON users', pol.policyname);
  END LOOP;
END $$;

-- Create new simplified policies
CREATE POLICY "Enable service role bypass"
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
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
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
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;