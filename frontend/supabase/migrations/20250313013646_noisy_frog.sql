/*
  # Fix admin policies and search functionality

  1. Changes
    - Drop existing policies
    - Create new admin access policies
    - Add btree indexes for better performance
    - Enable pg_trgm extension for text search
    - Add text search indexes
  
  2. Security
    - Maintain RLS policies
    - Ensure proper admin access
*/

-- Enable pg_trgm extension first
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for service role" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Service role can manage all users" ON users;

-- Create new policies for admin access
CREATE POLICY "Service role and admins can manage all users"
  ON users
  FOR ALL
  USING (
    (auth.jwt()->>'role' = 'service_role')
    OR (
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role = 'admin'
        AND u.is_active = true
      )
    )
  );

CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  USING (
    auth.uid() = id
    OR (auth.jwt()->>'role' = 'service_role')
    OR (
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role = 'admin'
        AND u.is_active = true
      )
    )
  );

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create btree indexes for better performance
CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE INDEX IF NOT EXISTS users_full_name_idx ON users (full_name);
CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);
CREATE INDEX IF NOT EXISTS users_is_active_idx ON users (is_active);

-- Create text search indexes using gin with trgm
CREATE INDEX IF NOT EXISTS users_email_trgm_idx ON users USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS users_full_name_trgm_idx ON users USING gin (full_name gin_trgm_ops);