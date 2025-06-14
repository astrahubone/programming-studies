/*
  # User and Study Platform Schema Update

  1. Schema Changes
    - Create users table with auth integration
    - Create subjects and sub-subjects tables
    - Create study sessions table
  
  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
    - Create trigger for automatic user profile creation
*/

-- Create users table with authentication fields
CREATE TABLE IF NOT EXISTS users (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create sub_subjects table
CREATE TABLE IF NOT EXISTS sub_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  difficulty difficulty_level NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create study_sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_subject_id uuid REFERENCES sub_subjects(id) ON DELETE CASCADE NOT NULL,
  scheduled_date date NOT NULL,
  completed_at timestamptz,
  questions_total int,
  questions_correct int,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
DO $$ BEGIN
  CREATE POLICY "Users can view own data"
    ON users FOR SELECT
    USING (auth.uid() = id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own data"
    ON users FOR UPDATE
    USING (auth.uid() = id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create policies for subjects
DO $$ BEGIN
  CREATE POLICY "Users can view own subjects"
    ON subjects FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own subjects"
    ON subjects FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own subjects"
    ON subjects FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own subjects"
    ON subjects FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create policies for sub_subjects
DO $$ BEGIN
  CREATE POLICY "Users can view own sub_subjects"
    ON sub_subjects FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = sub_subjects.subject_id
      AND subjects.user_id = auth.uid()
    ));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own sub_subjects"
    ON sub_subjects FOR INSERT
    WITH CHECK (EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = sub_subjects.subject_id
      AND subjects.user_id = auth.uid()
    ));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own sub_subjects"
    ON sub_subjects FOR UPDATE
    USING (EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = sub_subjects.subject_id
      AND subjects.user_id = auth.uid()
    ));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own sub_subjects"
    ON sub_subjects FOR DELETE
    USING (EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = sub_subjects.subject_id
      AND subjects.user_id = auth.uid()
    ));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create policies for study_sessions
DO $$ BEGIN
  CREATE POLICY "Users can view own study_sessions"
    ON study_sessions FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM sub_subjects
      JOIN subjects ON subjects.id = sub_subjects.subject_id
      WHERE sub_subjects.id = study_sessions.sub_subject_id
      AND subjects.user_id = auth.uid()
    ));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own study_sessions"
    ON study_sessions FOR INSERT
    WITH CHECK (EXISTS (
      SELECT 1 FROM sub_subjects
      JOIN subjects ON subjects.id = sub_subjects.subject_id
      WHERE sub_subjects.id = study_sessions.sub_subject_id
      AND subjects.user_id = auth.uid()
    ));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own study_sessions"
    ON study_sessions FOR UPDATE
    USING (EXISTS (
      SELECT 1 FROM sub_subjects
      JOIN subjects ON subjects.id = sub_subjects.subject_id
      WHERE sub_subjects.id = study_sessions.sub_subject_id
      AND subjects.user_id = auth.uid()
    ));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();