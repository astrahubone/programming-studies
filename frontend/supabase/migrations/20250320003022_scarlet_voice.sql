/*
  # Add function to update subject with sub-subjects

  1. New Functions
    - update_subject_with_sub_subjects: Updates a subject and its sub-subjects in a transaction
      - Parameters:
        - p_subject_id: UUID of the subject
        - p_user_id: UUID of the user
        - p_title: New title (optional)
        - p_color: New color (optional)
        - p_sub_subjects: JSON array of sub-subjects (optional)
      - Returns: Updated subject with sub-subjects

  2. Security
    - Function runs with security definer
    - Proper error handling and validation
*/

CREATE OR REPLACE FUNCTION update_subject_with_sub_subjects(
  p_subject_id UUID,
  p_user_id UUID,
  p_title TEXT DEFAULT NULL,
  p_color TEXT DEFAULT NULL,
  p_sub_subjects JSONB DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  color TEXT,
  sub_subjects JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subject_record RECORD;
  v_sub_subject RECORD;
  v_sub_subjects_array JSONB;
BEGIN
  -- Verify the subject exists and belongs to the user
  SELECT * INTO v_subject_record
  FROM subjects
  WHERE id = p_subject_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subject not found or unauthorized';
  END IF;

  -- Start transaction
  BEGIN
    -- Update subject if title or color provided
    IF p_title IS NOT NULL OR p_color IS NOT NULL THEN
      UPDATE subjects
      SET
        title = COALESCE(p_title, title),
        color = COALESCE(p_color, color)
      WHERE id = p_subject_id;
    END IF;

    -- Handle sub-subjects if provided
    IF p_sub_subjects IS NOT NULL AND jsonb_array_length(p_sub_subjects) > 0 THEN
      -- Delete existing sub-subjects
      DELETE FROM sub_subjects
      WHERE subject_id = p_subject_id;

      -- Insert new sub-subjects
      v_sub_subjects_array := '[]'::jsonb;
      
      FOR v_sub_subject IN 
        SELECT *
        FROM jsonb_array_elements(p_sub_subjects)
      LOOP
        INSERT INTO sub_subjects (
          subject_id,
          title,
          difficulty
        )
        VALUES (
          p_subject_id,
          v_sub_subject.value->>'title',
          (v_sub_subject.value->>'difficulty')::difficulty_level_pt
        )
        RETURNING jsonb_build_object(
          'id', id,
          'title', title,
          'difficulty', difficulty
        ) INTO v_sub_subjects_array;
      END LOOP;
    END IF;

    -- Return updated subject with sub-subjects
    RETURN QUERY
    SELECT 
      s.id,
      s.title,
      s.color,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', ss.id,
            'title', ss.title,
            'difficulty', ss.difficulty
          )
        ) FILTER (WHERE ss.id IS NOT NULL),
        '[]'::jsonb
      ) AS sub_subjects
    FROM subjects s
    LEFT JOIN sub_subjects ss ON ss.subject_id = s.id
    WHERE s.id = p_subject_id
    GROUP BY s.id, s.title, s.color;

  EXCEPTION
    WHEN others THEN
      RAISE EXCEPTION 'Failed to update subject: %', SQLERRM;
  END;
END;
$$;