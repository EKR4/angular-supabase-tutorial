-- ====================================================================
-- MIGRATION: 20251111162326_initial-policies.sql
-- ====================================================================
-- Purpose: Enable Row Level Security (RLS) and define access policies
--
-- This migration depends on:
--   - 20251111154139_initial-schema.sql (tables must exist first)
--   - 20251111162322_initial-functions.sql (helper functions recommended)
--
-- Policies included:
--   - users: Users can read their own profile, admins can read all
--   - user_roles: Admins can manage, users can read their own
--   - roles: Anyone can read, only admins can modify
--   - permissions: Anyone can read, only admins can modify
--   - role_permissions: Admins can manage
--   - sessions: Users can read/manage their own sessions
--   - auth_providers: Users can read/manage their own providers
--   - organizations: Members can read, admins can manage
--   - organization_user_roles: Org admins can manage their org's roles
--
-- Key concepts:
--   - RLS is disabled by default; enable with ALTER TABLE ... ENABLE ROW LEVEL SECURITY
--   - Policies use auth.uid() to get the current authenticated user
--   - SECURITY DEFINER functions bypass RLS; use with caution
--   - Test policies thoroughly in development before deploying to production
-- ====================================================================


-- ====================================================================
-- Enable RLS on all tables
-- ====================================================================

ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS auth_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS organization_user_roles ENABLE ROW LEVEL SECURITY;


-- ====================================================================
-- POLICY: users table
-- ====================================================================

-- Policy: Users can read their own profile
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Admins can read all user profiles
CREATE POLICY "users_select_admin" ON users
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can update any user profile
CREATE POLICY "users_update_admin" ON users
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Authenticated users can insert (for signup trigger)
CREATE POLICY "users_insert_authenticated" ON users
  FOR INSERT
  WITH CHECK (true);  -- Controlled by trigger


-- ====================================================================
-- POLICY: user_roles table (many-to-many)
-- ====================================================================

-- Policy: Users can read their own role assignments
CREATE POLICY "user_roles_select_own" ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins can read all role assignments
CREATE POLICY "user_roles_select_admin" ON user_roles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can insert role assignments
CREATE POLICY "user_roles_insert_admin" ON user_roles
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can delete role assignments
CREATE POLICY "user_roles_delete_admin" ON user_roles
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));


-- ====================================================================
-- POLICY: roles table
-- ====================================================================

-- Policy: Anyone can read roles
CREATE POLICY "roles_select_all" ON roles
  FOR SELECT
  USING (true);

-- Policy: Only admins can insert roles
CREATE POLICY "roles_insert_admin" ON roles
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy: Only admins can update roles
CREATE POLICY "roles_update_admin" ON roles
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Only admins can delete roles
CREATE POLICY "roles_delete_admin" ON roles
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));


-- ====================================================================
-- POLICY: permissions table
-- ====================================================================

-- Policy: Anyone can read permissions
CREATE POLICY "permissions_select_all" ON permissions
  FOR SELECT
  USING (true);

-- Policy: Only admins can insert permissions
CREATE POLICY "permissions_insert_admin" ON permissions
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy: Only admins can update permissions
CREATE POLICY "permissions_update_admin" ON permissions
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Only admins can delete permissions
CREATE POLICY "permissions_delete_admin" ON permissions
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));


-- ====================================================================
-- POLICY: role_permissions table (many-to-many)
-- ====================================================================

-- Policy: Anyone can read role-permission mappings
CREATE POLICY "role_permissions_select_all" ON role_permissions
  FOR SELECT
  USING (true);

-- Policy: Only admins can insert role-permission mappings
CREATE POLICY "role_permissions_insert_admin" ON role_permissions
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy: Only admins can delete role-permission mappings
CREATE POLICY "role_permissions_delete_admin" ON role_permissions
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));


-- ====================================================================
-- POLICY: sessions table
-- ====================================================================

-- Policy: Users can read their own sessions
CREATE POLICY "sessions_select_own" ON sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins can read all sessions
CREATE POLICY "sessions_select_admin" ON sessions
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Users can insert their own sessions
CREATE POLICY "sessions_insert_own" ON sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own sessions (logout)
CREATE POLICY "sessions_delete_own" ON sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Admins can delete any session
CREATE POLICY "sessions_delete_admin" ON sessions
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));


-- ====================================================================
-- POLICY: auth_providers table (OAuth/SSO integrations)
-- ====================================================================

-- Policy: Users can read their own auth provider integrations
CREATE POLICY "auth_providers_select_own" ON auth_providers
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins can read all provider integrations
CREATE POLICY "auth_providers_select_admin" ON auth_providers
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Users can insert their own provider integrations
CREATE POLICY "auth_providers_insert_own" ON auth_providers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own provider integrations
CREATE POLICY "auth_providers_update_own" ON auth_providers
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own provider integrations
CREATE POLICY "auth_providers_delete_own" ON auth_providers
  FOR DELETE
  USING (auth.uid() = user_id);


-- ====================================================================
-- POLICY: organizations table (multi-tenant support)
-- ====================================================================

-- Policy: Anyone can read organizations (public listing)
-- Adjust this if organizations should be private
CREATE POLICY "organizations_select_all" ON organizations
  FOR SELECT
  USING (true);

-- Policy: Only admins can insert organizations
CREATE POLICY "organizations_insert_admin" ON organizations
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy: Only admins can update organizations
CREATE POLICY "organizations_update_admin" ON organizations
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Only admins can delete organizations
CREATE POLICY "organizations_delete_admin" ON organizations
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));


-- ====================================================================
-- POLICY: organization_user_roles table (multi-tenant RBAC)
-- ====================================================================

-- Policy: Users can read their own organization role assignments
CREATE POLICY "org_user_roles_select_own" ON organization_user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Org members with admin role can manage their org's user roles
-- (This requires joining with the org and checking user's role in that org)
CREATE POLICY "org_user_roles_manage_org_admin" ON organization_user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_user_roles oar_check
      INNER JOIN roles r ON oar_check.role_id = r.id
      WHERE oar_check.organization_id = organization_user_roles.organization_id
        AND oar_check.user_id = auth.uid()
        AND r.name = 'admin'
    )
  );

-- Policy: Global admins can manage all organization user roles
CREATE POLICY "org_user_roles_manage_global_admin" ON organization_user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));


-- ====================================================================
-- GRANT PERMISSIONS (for service role and authenticated role)
-- ====================================================================

-- Service role (backend): full access
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;

-- Authenticated users: select + limited by RLS policies above
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT ON users, sessions, auth_providers TO authenticated;
GRANT UPDATE ON users, auth_providers TO authenticated;
GRANT DELETE ON sessions, auth_providers TO authenticated;

-- Anonymous users: very limited read access (optional, adjust as needed)
-- GRANT SELECT ON roles, permissions, role_permissions TO anon;


-- ====================================================================
-- End of initial-policies.sql
-- All tables now have RLS enabled with security policies in place.
-- ====================================================================
