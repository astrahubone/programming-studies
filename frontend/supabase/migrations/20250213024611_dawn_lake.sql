/*
  # Fix subjects table foreign key reference

  1. Changes
    - Drop existing foreign key constraint on subjects table
    - Add new foreign key constraint referencing users table
    - Recreate RLS policies to ensure they use the correct table
*/

-- Drop existing foreign key constraint
ALTER TABLE subjects
DROP CONSTRAINT IF EXISTS subjects_user_id_fkey;

-- Add new foreign key constraint
ALTER TABLE subjects
ADD CONSTRAINT subjects_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id)
ON DELETE CASCADE;

-- Ensure RLS policies are correctly set up
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