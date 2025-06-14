/*
  # Fix admin user configuration

  1. Updates
    - Set role to 'admin' for alan-braulio@hotmail.com
    - Ensure is_active is true
    - Clear any banned_at status
  
  2. Verification
    - Add function to verify admin status
*/

-- First, ensure the user exists and update their role and status
DO $$ 
BEGIN
  UPDATE users
  SET 
    role = 'admin',
    is_active = true,
    banned_at = NULL,
    updated_at = NOW()
  WHERE email = 'alan-braulio@hotmail.com';

  -- Verify the update
  IF NOT EXISTS (
    SELECT 1 
    FROM users 
    WHERE email = 'alan-braulio@hotmail.com' 
    AND role = 'admin' 
    AND is_active = true 
    AND banned_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Failed to update admin user configuration';
  END IF;
END $$;