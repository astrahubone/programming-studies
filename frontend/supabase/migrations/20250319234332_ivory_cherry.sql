/*
  # Fix subjects RLS policies

  1. Changes
    - Drop existing policies
    - Create simplified policies that work correctly
    - Enable proper service role bypass
    - Fix user and admin access

  2. Security
    - Maintain proper access control
    - Allow service role operations
    - Enable admin access
    - Keep user data secure
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable service role operations" ON subjects;

-- Create new simplified policies
CREATE POLICY "Users can manage own subjects"
  ON subjects
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Admins can manage all subjects"
  ON subjects
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

-- Ensure RLS is enabled
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;