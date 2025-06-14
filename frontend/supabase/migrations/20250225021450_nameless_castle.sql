/*
  # Clear all active sessions

  1. Actions
    - Delete all sessions from auth.sessions
    - Delete all refresh tokens from auth.refresh_tokens
*/

-- Delete all sessions and refresh tokens
DO $$ 
BEGIN
  -- Delete all refresh tokens
  DELETE FROM auth.refresh_tokens;
  
  -- Delete all sessions
  DELETE FROM auth.sessions;
END $$;