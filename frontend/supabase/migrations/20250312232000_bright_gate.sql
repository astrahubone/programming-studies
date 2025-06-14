/*
  # Add quiz tables and update study sessions

  1. New Tables
    - `questions`
      - `id` (uuid, primary key)
      - `sub_subject_id` (uuid, foreign key)
      - `content` (text)
      - `correct_answer` (text)
      - `options` (text array)
      - `created_at` (timestamp)
    
    - `study_session_questions`
      - `id` (uuid, primary key)
      - `study_session_id` (uuid, foreign key)
      - `question_id` (uuid, foreign key)
      - `selected_answer` (text)
      - `is_correct` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

DO $$ 
BEGIN
  -- Create questions table if it doesn't exist
  CREATE TABLE IF NOT EXISTS questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sub_subject_id uuid NOT NULL,
    content text NOT NULL,
    correct_answer text NOT NULL,
    options text[] NOT NULL,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT fk_sub_subject
      FOREIGN KEY(sub_subject_id) 
      REFERENCES sub_subjects(id)
      ON DELETE CASCADE
  );

  -- Create study_session_questions table if it doesn't exist
  CREATE TABLE IF NOT EXISTS study_session_questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    study_session_id uuid NOT NULL,
    question_id uuid NOT NULL,
    selected_answer text,
    is_correct boolean,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT fk_study_session
      FOREIGN KEY(study_session_id) 
      REFERENCES study_sessions(id)
      ON DELETE CASCADE,
    CONSTRAINT fk_question
      FOREIGN KEY(question_id) 
      REFERENCES questions(id)
      ON DELETE CASCADE
  );

  -- Enable RLS
  ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE study_session_questions ENABLE ROW LEVEL SECURITY;

  -- Create policies for questions
  DROP POLICY IF EXISTS "Users can view questions for their subjects" ON questions;
  CREATE POLICY "Users can view questions for their subjects"
    ON questions FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM sub_subjects
      JOIN subjects ON subjects.id = sub_subjects.subject_id
      WHERE sub_subjects.id = questions.sub_subject_id
      AND subjects.user_id = auth.uid()
    ));

  DROP POLICY IF EXISTS "Users can insert questions for their subjects" ON questions;
  CREATE POLICY "Users can insert questions for their subjects"
    ON questions FOR INSERT
    WITH CHECK (EXISTS (
      SELECT 1 FROM sub_subjects
      JOIN subjects ON subjects.id = sub_subjects.subject_id
      WHERE sub_subjects.id = sub_subject_id
      AND subjects.user_id = auth.uid()
    ));

  -- Create policies for study_session_questions
  DROP POLICY IF EXISTS "Users can view their study session questions" ON study_session_questions;
  CREATE POLICY "Users can view their study session questions"
    ON study_session_questions FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM study_sessions
      JOIN sub_subjects ON sub_subjects.id = study_sessions.sub_subject_id
      JOIN subjects ON subjects.id = sub_subjects.subject_id
      WHERE study_sessions.id = study_session_questions.study_session_id
      AND subjects.user_id = auth.uid()
    ));

  DROP POLICY IF EXISTS "Users can insert their study session questions" ON study_session_questions;
  CREATE POLICY "Users can insert their study session questions"
    ON study_session_questions FOR INSERT
    WITH CHECK (EXISTS (
      SELECT 1 FROM study_sessions
      JOIN sub_subjects ON sub_subjects.id = study_sessions.sub_subject_id
      JOIN subjects ON subjects.id = sub_subjects.subject_id
      WHERE study_sessions.id = study_session_questions.study_session_id
      AND subjects.user_id = auth.uid()
    ));

  DROP POLICY IF EXISTS "Users can update their study session questions" ON study_session_questions;
  CREATE POLICY "Users can update their study session questions"
    ON study_session_questions FOR UPDATE
    USING (EXISTS (
      SELECT 1 FROM study_sessions
      JOIN sub_subjects ON sub_subjects.id = study_sessions.sub_subject_id
      JOIN subjects ON subjects.id = sub_subjects.subject_id
      WHERE study_sessions.id = study_session_questions.study_session_id
      AND subjects.user_id = auth.uid()
    ));

EXCEPTION WHEN others THEN
  RAISE NOTICE 'Error creating tables or policies: %', SQLERRM;
  RAISE;
END $$;