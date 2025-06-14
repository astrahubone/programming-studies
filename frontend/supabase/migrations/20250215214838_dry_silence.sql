/*
  # Update difficulty enum to Portuguese

  1. Changes
    - Create new ENUM type with Portuguese values
    - Update existing data to use new values
    - Drop old ENUM type
*/

-- Create new ENUM type with Portuguese values
CREATE TYPE difficulty_level_pt AS ENUM ('fácil', 'médio', 'difícil');

-- Update sub_subjects table to use new values
ALTER TABLE sub_subjects 
  ALTER COLUMN difficulty TYPE difficulty_level_pt 
  USING (
    CASE difficulty::text
      WHEN 'easy' THEN 'fácil'::difficulty_level_pt
      WHEN 'medium' THEN 'médio'::difficulty_level_pt
      WHEN 'hard' THEN 'difícil'::difficulty_level_pt
    END
  );

-- Drop old ENUM type
DROP TYPE difficulty_level;