-- ====================================================================
-- MIGRATION: 20251111162322_initial-functions.sql
-- ====================================================================
-- Purpose: Create triggers and helper functions for authentication and RBAC
--
-- This migration depends on:
--   - 20251111154139_initial-schema.sql (tables must exist first)
--
-- Functions included:
--   1. handle_new_user() - syncs auth.users -> public.users on signup
--   2. record_user_login() - records last login timestamp (callable)
--   3. handle_user_signin_update() - optional: updates last_login on auth.users change
--
-- Triggers included:
--   1. on_auth_signup - fires on auth.users INSERT
--   2. on_auth_user_update - fires on auth.users UPDATE (if applicable)
-- ====================================================================


-- ====================================================================
-- SIGNUP SYNC: Insert into public.users when a new row is created in auth.users
-- ====================================================================

-- Function: sync new auth.users -> public.users
-- Called automatically when a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert basic profile; if the user already exists update email/updated_at
  INSERT INTO public.users (id, email, created_at, updated_at, metadata)
  VALUES (
    NEW.id,
    NEW.email,
    now(),
    now(),
    CASE
      WHEN COALESCE(NEW.raw_user_meta_data, '') = '' THEN NULL
      ELSE NEW.raw_user_meta_data::jsonb
    END
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: after insert on auth.users -> call handle_new_user()
-- This automatically creates a public.users row when Supabase Auth creates a new user
DROP TRIGGER IF EXISTS on_auth_signup ON auth.users;
CREATE TRIGGER on_auth_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ====================================================================
-- LOGIN HELPER: Callable function to record last_login
-- ====================================================================

-- Function: record_user_login(uuid)
-- Purpose: Update the last_login timestamp for a user
-- Usage: Call this from your backend after successful sign-in:
--   SELECT public.record_user_login('<user-uuid>');
CREATE OR REPLACE FUNCTION public.record_user_login(p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET last_login = now(), updated_at = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ====================================================================
-- OPTIONAL: UPDATE trigger on auth.users (guarded by schema check)
-- ====================================================================

-- This block creates an UPDATE trigger on auth.users only if:
--   - The auth.users table has a last_sign_in-like column
--   - This guards against schema differences between Supabase versions
-- If no matching column exists, the trigger is not created (no error)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'auth'
      AND table_name = 'users'
      AND column_name IN ('last_sign_in', 'last_sign_in_at', 'last_sign_in_at_utc')
  ) THEN
    -- Create a trigger function that updates public.users.last_login on auth.users changes
    CREATE OR REPLACE FUNCTION public.handle_user_signin_update()
    RETURNS trigger AS $$
    BEGIN
      UPDATE public.users
      SET last_login = now(), updated_at = now()
      WHERE id = NEW.id;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Remove old trigger if exists and create a new one
    BEGIN
      EXECUTE 'DROP TRIGGER IF EXISTS on_auth_user_update ON auth.users';
    EXCEPTION WHEN others THEN
      NULL;
    END;

    EXECUTE '
      CREATE TRIGGER on_auth_user_update
      AFTER UPDATE ON auth.users
      FOR EACH ROW
      WHEN (OLD IS DISTINCT FROM NEW)
      EXECUTE PROCEDURE public.handle_user_signin_update()
    ';
  END IF;
END;
$$;


-- ====================================================================
-- HELPER FUNCTIONS FOR ROLE/PERMISSION QUERIES (RBAC utilities)
-- ====================================================================

-- Function: get_user_roles(uuid)
-- Purpose: Get all roles assigned to a user
-- Usage: SELECT public.get_user_roles('<user-uuid>');
CREATE OR REPLACE FUNCTION public.get_user_roles(p_user_id uuid)
RETURNS TABLE(role_id uuid, role_name text, description text) AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, r.name, r.description
  FROM roles r
  INNER JOIN user_roles ur ON r.id = ur.role_id
  WHERE ur.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function: get_user_permissions(uuid)
-- Purpose: Get all permissions granted to a user (via their roles)
-- Usage: SELECT public.get_user_permissions('<user-uuid>');
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id uuid)
RETURNS TABLE(permission_id uuid, permission_name text, description text) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.id, p.name, p.description
  FROM permissions p
  INNER JOIN role_permissions rp ON p.id = rp.permission_id
  INNER JOIN user_roles ur ON rp.role_id = ur.role_id
  WHERE ur.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function: has_role(uuid, text)
-- Purpose: Check if a user has a specific role by name
-- Usage: SELECT public.has_role('<user-uuid>', 'admin');
CREATE OR REPLACE FUNCTION public.has_role(p_user_id uuid, p_role_name text)
RETURNS boolean AS $$
DECLARE
  v_has_role boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM user_roles ur
    INNER JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id AND r.name = p_role_name
  ) INTO v_has_role;
  
  RETURN COALESCE(v_has_role, false);
END;
$$ LANGUAGE plpgsql;

-- Function: has_permission(uuid, text)
-- Purpose: Check if a user has a specific permission (via their roles)
-- Usage: SELECT public.has_permission('<user-uuid>', 'write:products');
CREATE OR REPLACE FUNCTION public.has_permission(p_user_id uuid, p_permission_name text)
RETURNS boolean AS $$
DECLARE
  v_has_permission boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM permissions p
    INNER JOIN role_permissions rp ON p.id = rp.permission_id
    INNER JOIN user_roles ur ON rp.role_id = ur.role_id
    WHERE ur.user_id = p_user_id AND p.name = p_permission_name
  ) INTO v_has_permission;
  
  RETURN COALESCE(v_has_permission, false);
END;
$$ LANGUAGE plpgsql;


-- ====================================================================
-- End of initial-functions.sql
-- Next: See initial-policies.sql for Row Level Security (RLS) policies
-- ====================================================================
