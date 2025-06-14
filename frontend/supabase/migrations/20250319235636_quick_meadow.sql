/*
  # List all current policies in the database
  
  This migration creates a function that returns all policies for our tables.
  It's a read-only migration that helps us audit our current security setup.
*/

-- Create a function to list all policies
CREATE OR REPLACE FUNCTION list_all_policies()
RETURNS TABLE (
  schema_name text,
  table_name text,
  policy_name text,
  roles text[],
  cmd text,
  qual text,
  with_check text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    schemaname::text as schema_name,
    tablename::text as table_name,
    policyname::text as policy_name,
    roles::text[] as roles,
    cmd::text,
    qual::text,
    with_check::text
  FROM pg_policies
  WHERE schemaname = 'public'
  ORDER BY
    schemaname,
    tablename,
    policyname;
$$;

-- Create a view to make it easier to query policies
CREATE OR REPLACE VIEW policy_list AS
SELECT * FROM list_all_policies();

-- Grant access to the function and view
GRANT EXECUTE ON FUNCTION list_all_policies() TO postgres;
GRANT SELECT ON policy_list TO postgres;

-- Add a comment explaining how to use
COMMENT ON FUNCTION list_all_policies() IS 'Lists all policies in the public schema with their details';
COMMENT ON VIEW policy_list IS 'View for easily querying all current policies';

-- Example query to list all policies:
-- SELECT * FROM policy_list;