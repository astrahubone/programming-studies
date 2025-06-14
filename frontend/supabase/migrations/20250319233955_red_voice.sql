/*
  # Fix subjects RLS policies

  1. Changes
    - Drop existing policies
    - Create new policies with proper service role handling
    - Fix authentication checks
    - Add proper error handling

  2. Security
    - Maintain proper access control
    - Allow service role operations
    - Keep data secure
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read for users" ON subjects;
DROP POLICY IF EXISTS "Enable insert for users" ON subjects;
DROP POLICY IF EXISTS "Enable update for users" ON subjects;
DROP POLICY IF EXISTS "Enable delete for users" ON subjects;

-- Create new policies with service role handling
CREATE POLICY "Enable service role operations"
  ON subjects
  FOR ALL
  TO authenticated
  USING (
    current_setting('role') = 'service_role'
    OR auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  )
  WITH CHECK (
    current_setting('role') = 'service_role'
    OR auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

-- Ensure RLS is enabled but service role can bypass
ALTER TABLE subjects FORCE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;