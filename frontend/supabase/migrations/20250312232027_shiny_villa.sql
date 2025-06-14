/*
  # Reset study data

  1. Changes
    - Delete all existing questions
    - Reset completed_at, questions_total, and questions_correct in study_sessions
    - Delete all study session questions

  2. Security
    - Maintains RLS policies
    - Safe deletion order to respect foreign key constraints
    - Uses security definer function to handle permissions
*/

-- Create a function to reset study data with elevated privileges
CREATE OR REPLACE FUNCTION reset_study_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- First, delete all study session questions
  DELETE FROM study_session_questions;

  -- Then delete all questions
  DELETE FROM questions;

  -- Finally, reset study sessions
  UPDATE study_sessions
  SET 
    completed_at = NULL,
    questions_total = NULL,
    questions_correct = NULL;

EXCEPTION WHEN others THEN
  RAISE EXCEPTION 'Failed to reset study data: %', SQLERRM;
END;
$$;

-- Execute the function to perform the reset
DO $$ 
BEGIN
  PERFORM reset_study_data();
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Error resetting study data: %', SQLERRM;
  RAISE;
END $$;