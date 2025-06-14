/*
  # Create questions transaction function

  1. New Functions
    - `create_questions_transaction`: Creates questions in a transaction
      - Parameters:
        - `p_sub_subject_id`: UUID of the sub-subject
        - `p_questions`: JSONB array of question data
      - Returns: Array of created questions

  2. Changes
    - Adds a new database function for atomic question creation
    - Ensures all questions are created successfully or none are created
    - Includes proper error handling and security context
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_questions_transaction;

-- Create the function with proper type handling
CREATE OR REPLACE FUNCTION create_questions_transaction(
  p_sub_subject_id UUID,
  p_questions JSONB
)
RETURNS SETOF questions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_question_record RECORD;
  v_question questions;
  v_options TEXT[];
BEGIN
  -- Verify that the sub_subject_id exists and belongs to the authenticated user
  IF NOT EXISTS (
    SELECT 1 
    FROM sub_subjects ss
    JOIN subjects s ON s.id = ss.subject_id
    WHERE ss.id = p_sub_subject_id 
    AND s.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Invalid sub_subject_id or unauthorized access';
  END IF;

  -- Start transaction
  BEGIN
    -- Insert each question
    FOR v_question_record IN 
      SELECT 
        value->>'content' as content,
        value->>'correctAnswer' as correct_answer,
        value->'options' as options
      FROM jsonb_array_elements(p_questions)
    LOOP
      -- Convert JSONB array to text array
      SELECT array_agg(value#>>'{}')
      INTO v_options
      FROM jsonb_array_elements(v_question_record.options);

      INSERT INTO questions (
        sub_subject_id,
        content,
        correct_answer,
        options
      )
      VALUES (
        p_sub_subject_id,
        v_question_record.content,
        v_question_record.correct_answer,
        v_options
      )
      RETURNING * INTO v_question;

      RETURN NEXT v_question;
    END LOOP;

    -- If we get here, all questions were created successfully
    RETURN;
  EXCEPTION
    WHEN OTHERS THEN
      -- If any error occurs, the transaction will be rolled back
      RAISE EXCEPTION 'Failed to create questions: %', SQLERRM;
  END;
END;
$$;