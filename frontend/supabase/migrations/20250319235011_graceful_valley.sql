/*
  # Complete Policy Restructure

  1. Changes
    - Drop all existing policies
    - Recreate policies for all tables
    - Set up proper access control for users and admins
    - Enable RLS on all tables
  
  2. Security Rules
    - Anyone can register
    - Authenticated users can login
    - Regular users can manage their own data
    - Admins have full access to platform data
    - Service role has necessary access
*/

-- First, drop all existing policies
DO $$ 
BEGIN
  -- Users table policies
  DROP POLICY IF EXISTS "Enable insert for service role" ON users;
  DROP POLICY IF EXISTS "Users can view own data" ON users;
  DROP POLICY IF EXISTS "Users can update own data" ON users;
  DROP POLICY IF EXISTS "Service role can manage all users" ON users;

  -- Subjects table policies
  DROP POLICY IF EXISTS "Users can manage own subjects" ON subjects;
  DROP POLICY IF EXISTS "Admins can manage all subjects" ON subjects;

  -- Sub_subjects table policies
  DROP POLICY IF EXISTS "Users can view own sub_subjects" ON sub_subjects;
  DROP POLICY IF EXISTS "Users can insert own sub_subjects" ON sub_subjects;
  DROP POLICY IF EXISTS "Users can update own sub_subjects" ON sub_subjects;
  DROP POLICY IF EXISTS "Users can delete own sub_subjects" ON sub_subjects;

  -- Study_sessions table policies
  DROP POLICY IF EXISTS "Users can view own study_sessions" ON study_sessions;
  DROP POLICY IF EXISTS "Users can insert own study_sessions" ON study_sessions;
  DROP POLICY IF EXISTS "Users can update own study_sessions" ON study_sessions;

  -- Questions table policies
  DROP POLICY IF EXISTS "Users can view questions for their subjects" ON questions;
  DROP POLICY IF EXISTS "Users can insert questions for their subjects" ON questions;

  -- Study_session_questions table policies
  DROP POLICY IF EXISTS "Users can view their study session questions" ON study_session_questions;
  DROP POLICY IF EXISTS "Users can insert their study session questions" ON study_session_questions;
  DROP POLICY IF EXISTS "Users can update their study session questions" ON study_session_questions;

  -- Subscriptions table policies
  DROP POLICY IF EXISTS "Admins can do everything with subscriptions" ON subscriptions;
  DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
END $$;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_session_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Enable service role operations on users"
  ON users
  FOR ALL
  USING (current_setting('role') = 'service_role');

CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
      AND u.is_active = true
    )
  );

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Subjects table policies
CREATE POLICY "Users can manage own subjects"
  ON subjects
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

-- Sub_subjects table policies
CREATE POLICY "Users can manage own sub_subjects"
  ON sub_subjects
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = sub_subjects.subject_id
      AND (
        subjects.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role = 'admin'
          AND users.is_active = true
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = sub_subjects.subject_id
      AND (
        subjects.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role = 'admin'
          AND users.is_active = true
        )
      )
    )
  );

-- Study_sessions table policies
CREATE POLICY "Users can manage own study_sessions"
  ON study_sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sub_subjects
      JOIN subjects ON subjects.id = sub_subjects.subject_id
      WHERE sub_subjects.id = study_sessions.sub_subject_id
      AND (
        subjects.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role = 'admin'
          AND users.is_active = true
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sub_subjects
      JOIN subjects ON subjects.id = sub_subjects.subject_id
      WHERE sub_subjects.id = study_sessions.sub_subject_id
      AND (
        subjects.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role = 'admin'
          AND users.is_active = true
        )
      )
    )
  );

-- Questions table policies
CREATE POLICY "Users can manage own questions"
  ON questions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sub_subjects
      JOIN subjects ON subjects.id = sub_subjects.subject_id
      WHERE sub_subjects.id = questions.sub_subject_id
      AND (
        subjects.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role = 'admin'
          AND users.is_active = true
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sub_subjects
      JOIN subjects ON subjects.id = sub_subjects.subject_id
      WHERE sub_subjects.id = questions.sub_subject_id
      AND (
        subjects.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role = 'admin'
          AND users.is_active = true
        )
      )
    )
  );

-- Study_session_questions table policies
CREATE POLICY "Users can manage own study_session_questions"
  ON study_session_questions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM study_sessions
      JOIN sub_subjects ON sub_subjects.id = study_sessions.sub_subject_id
      JOIN subjects ON subjects.id = sub_subjects.subject_id
      WHERE study_sessions.id = study_session_questions.study_session_id
      AND (
        subjects.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role = 'admin'
          AND users.is_active = true
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM study_sessions
      JOIN sub_subjects ON sub_subjects.id = study_sessions.sub_subject_id
      JOIN subjects ON subjects.id = sub_subjects.subject_id
      WHERE study_sessions.id = study_session_questions.study_session_id
      AND (
        subjects.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role = 'admin'
          AND users.is_active = true
        )
      )
    )
  );

-- Subscriptions table policies
CREATE POLICY "Users can view own subscription"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

CREATE POLICY "Admins can manage subscriptions"
  ON subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );