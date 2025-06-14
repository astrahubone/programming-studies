/*
  # Initial Schema Setup for Medical Study Platform

  1. New Tables
    - profiles
      - id (uuid, references auth.users)
      - created_at (timestamp)
      - updated_at (timestamp)
    - subjects
      - id (uuid)
      - user_id (uuid, references profiles)
      - title (text)
      - created_at (timestamp)
    - sub_subjects
      - id (uuid)
      - subject_id (uuid, references subjects)
      - title (text)
      - difficulty (enum: easy, medium, hard)
      - created_at (timestamp)
    - study_sessions
      - id (uuid)
      - sub_subject_id (uuid, references sub_subjects)
      - scheduled_date (date)
      - completed_at (timestamp)
      - questions_total (int)
      - questions_correct (int)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create custom types
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

-- Create profiles table
CREATE TABLE profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subjects table
CREATE TABLE subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create sub_subjects table
CREATE TABLE sub_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  difficulty difficulty_level NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create study_sessions table
CREATE TABLE study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_subject_id uuid REFERENCES sub_subjects(id) ON DELETE CASCADE NOT NULL,
  scheduled_date date NOT NULL,
  completed_at timestamptz,
  questions_total int,
  questions_correct int,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view own subjects"
  ON subjects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subjects"
  ON subjects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subjects"
  ON subjects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subjects"
  ON subjects FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sub_subjects"
  ON sub_subjects FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM subjects
    WHERE subjects.id = sub_subjects.subject_id
    AND subjects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own sub_subjects"
  ON sub_subjects FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM subjects
    WHERE subjects.id = sub_subjects.subject_id
    AND subjects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own sub_subjects"
  ON sub_subjects FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM subjects
    WHERE subjects.id = sub_subjects.subject_id
    AND subjects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own sub_subjects"
  ON sub_subjects FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM subjects
    WHERE subjects.id = sub_subjects.subject_id
    AND subjects.user_id = auth.uid()
  ));

CREATE POLICY "Users can view own study_sessions"
  ON study_sessions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM sub_subjects
    JOIN subjects ON subjects.id = sub_subjects.subject_id
    WHERE sub_subjects.id = study_sessions.sub_subject_id
    AND subjects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own study_sessions"
  ON study_sessions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM sub_subjects
    JOIN subjects ON subjects.id = sub_subjects.subject_id
    WHERE sub_subjects.id = study_sessions.sub_subject_id
    AND subjects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own study_sessions"
  ON study_sessions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM sub_subjects
    JOIN subjects ON subjects.id = sub_subjects.subject_id
    WHERE sub_subjects.id = study_sessions.sub_subject_id
    AND subjects.user_id = auth.uid()
  ));

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();