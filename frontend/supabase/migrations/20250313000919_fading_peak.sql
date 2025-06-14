/*
  # Add subscription and admin system

  1. User Updates
    - Add role column (admin/user)
    - Add is_active flag
    - Add banned_at timestamp

  2. New Tables
    - subscriptions: Store subscription information
    
  3. Security
    - Enable RLS on subscriptions table
    - Add policies for subscription access
    - Add helper functions for subscription and admin checks
*/

-- Add columns to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS banned_at timestamptz DEFAULT NULL;

-- Add check constraint for role
ALTER TABLE users 
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users 
  ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'user'));

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text NOT NULL,
  plan_id text NOT NULL,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add check constraint for status
ALTER TABLE subscriptions 
  DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE subscriptions 
  ADD CONSTRAINT subscriptions_status_check 
  CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid'));

-- Enable RLS on subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can do everything with subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;

-- Create policies for subscriptions table
CREATE POLICY "Admins can do everything with subscriptions"
  ON subscriptions
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ));

CREATE POLICY "Users can view own subscription"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to check active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM subscriptions s
    WHERE s.user_id = user_uuid
    AND s.status = 'active'
    AND s.current_period_end > now()
  );
END;
$$;

-- Create function to check admin status
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
    AND is_active = true
  );
END;
$$;

-- Drop existing subscription access policies
DROP POLICY IF EXISTS "Users must have active subscription to access subjects" ON subjects;
DROP POLICY IF EXISTS "Users must have active subscription to access sub_subjects" ON sub_subjects;
DROP POLICY IF EXISTS "Users must have active subscription to access study_sessions" ON study_sessions;

-- Create policies for subscription access
CREATE POLICY "Users must have active subscription to access subjects"
  ON subjects
  FOR ALL
  TO authenticated
  USING (
    has_active_subscription(auth.uid())
    OR is_admin()
  );

CREATE POLICY "Users must have active subscription to access sub_subjects"
  ON sub_subjects
  FOR ALL
  TO authenticated
  USING (
    has_active_subscription(auth.uid())
    OR is_admin()
  );

CREATE POLICY "Users must have active subscription to access study_sessions"
  ON study_sessions
  FOR ALL
  TO authenticated
  USING (
    has_active_subscription(auth.uid())
    OR is_admin()
  );

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger for updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();