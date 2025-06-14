/*
  # Add user_id to study sessions table

  1. Changes
    - Add user_id column to study_sessions table
    - Add foreign key constraint to users table
    - Update existing policies to use user_id
    - Migrate existing data to set user_id based on subject ownership

  2. Security
    - Update RLS policies to use direct user_id check
    - Maintain existing security model
*/

-- First add the user_id column
ALTER TABLE study_sessions
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE CASCADE;

-- Update existing study sessions to set user_id based on subject ownership
UPDATE study_sessions
SET user_id = subjects.user_id
FROM sub_subjects
JOIN subjects ON subjects.id = sub_subjects.subject_id
WHERE study_sessions.sub_subject_id = sub_subjects.id;

-- Make user_id NOT NULL after migration
ALTER TABLE study_sessions
ALTER COLUMN user_id SET NOT NULL;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage own study_sessions" ON study_sessions;

-- Create new simplified policies using user_id
CREATE POLICY "Users can manage own study_sessions"
  ON study_sessions
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS study_sessions_user_id_idx ON study_sessions(user_id);

-- Add trigger to automatically set user_id on insert
CREATE OR REPLACE FUNCTION set_study_session_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If user_id is not provided, get it from the subject ownership
  IF NEW.user_id IS NULL THEN
    SELECT subjects.user_id INTO NEW.user_id
    FROM sub_subjects
    JOIN subjects ON subjects.id = sub_subjects.subject_id
    WHERE sub_subjects.id = NEW.sub_subject_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_study_session_user_id_trigger ON study_sessions;

CREATE TRIGGER set_study_session_user_id_trigger
  BEFORE INSERT ON study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_study_session_user_id();