/*
  # Add color column to subjects table

  1. Changes
    - Add color column to subjects table
    - Set default color value
    - Handle existing rows
  
  2. Notes
    - Uses DO block for better error handling
    - Checks for column existence before adding
    - Sets default color to '#60A5FA' (blue)
*/

DO $$ 
BEGIN
  -- Check if the column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'subjects' 
    AND column_name = 'color'
  ) THEN
    -- Add color column with default value
    ALTER TABLE subjects
      ADD COLUMN color text DEFAULT '#60A5FA';
    
    -- Update any existing rows that might have NULL values
    UPDATE subjects 
    SET color = '#60A5FA' 
    WHERE color IS NULL;
  END IF;
EXCEPTION 
  WHEN others THEN
    RAISE NOTICE 'Error adding color column: %', SQLERRM;
    RAISE;
END $$;