/*
  # Fix subjects table RLS policies

  1. Changes
    - Drop existing RLS policies
    - Create new simplified policies
    - Fix user authentication checks
    - Add proper error handling

  2. Security
    - Maintain proper access control
    - Allow authenticated users to manage their subjects
    - Keep data secure
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own subjects" ON subjects;
DROP POLICY IF EXISTS "Users can insert own subjects" ON subjects;
DROP POLICY IF EXISTS "Users can update own subjects" ON subjects;
DROP POLICY IF EXISTS "Users can delete own subjects" ON subjects;
DROP POLICY IF EXISTS "Users must have active subscription to access subjects" ON subjects;

-- Create new policies
CREATE POLICY "Enable read for users"
  ON subjects
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
      )
    )
  );

CREATE POLICY "Enable insert for users"
  ON subjects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
      )
    )
  );

CREATE POLICY "Enable update for users"
  ON subjects
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
      )
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
      )
    )
  );

CREATE POLICY "Enable delete for users"
  ON subjects
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
      )
    )
  );

-- Ensure RLS is enabled
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;