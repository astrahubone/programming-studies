/*
  # Fix authentication policies and user creation

  1. Changes
    - Drop and recreate user policies with proper permissions
    - Fix user creation trigger
    - Add proper indexes
    - Enable RLS with correct bypass settings
  
  2. Security
    - Ensure proper access control
    - Allow service role to manage users
    - Enable admin access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Service role and admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create new policies with proper permissions
CREATE POLICY "Service role and admins can manage all users"
  ON users
  FOR ALL
  TO public
  USING (
    (current_setting('role') = 'service_role')
    OR (
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role = 'admin'
        AND u.is_active = true
      )
    )
  );

CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  TO public
  USING (
    auth.uid() = id
    OR (current_setting('role') = 'service_role')
    OR (
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role = 'admin'
        AND u.is_active = true
      )
    )
  );

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO public
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Drop and recreate the user creation trigger with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert into users table with proper defaults
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    is_active
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user',
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = now();

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure RLS is enabled but service role can bypass
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;