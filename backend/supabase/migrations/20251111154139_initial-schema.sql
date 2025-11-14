-- ====================================================================
-- MIGRATION: 20251111154139_initial-schema.sql
-- ====================================================================
-- Purpose: Create tables, foreign key constraints, and indexes
--
-- SCHEMA DESIGN: Supabase Auth Integration
-- This migration aligns with Supabase Auth best practices:
--
-- 1. Authentication layer (managed by Supabase):
--    - auth.users: Contains email, password_hash, and auth metadata
--    - Managed by Supabase Auth (JWT tokens, sessions, etc.)
--
-- 2. Application layer (public schema):
--    - public.users: User profiles synced from auth.users via trigger
--    - Stores additional app-specific data (display_name, avatar_url, etc.)
--    - Links to roles, permissions, and organizations via foreign keys
--
-- 3. RBAC (Role-Based Access Control):
--    - roles: Define roles (admin, user, editor, etc.)
--    - permissions: Define fine-grained permissions (read:orders, write:products)
--    - user_roles: Many-to-many users <-> roles
--    - role_permissions: Many-to-many roles <-> permissions
--    - organization_user_roles: Scoped roles per organization (multi-tenant support)
--
-- 4. Sessions & External Auth:
--    - sessions: Track active sessions and refresh tokens
--    - auth_providers: Store OAuth/SSO provider integrations
--
-- See initial-functions.sql for triggers and helper functions.
-- See initial-policies.sql for Row Level Security (RLS) policies.
-- ====================================================================

-- Ensure pgcrypto is available for gen_random_uuid(); Supabase supports this extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- Users table (application profile data synced from auth.users via trigger)
-- The id matches auth.users.id; Supabase Auth manages password & authentication
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,                 -- references auth.users(id), no auto-generate
  email text NOT NULL,                 -- synced from auth.users.email
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_login timestamptz,
  metadata jsonb,                      -- store extra profile/claims from auth metadata
  display_name text,                   -- optional: user's display name
  avatar_url text                      -- optional: profile picture URL
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,                  -- e.g. 'admin', 'user', 'editor'
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Associative table: users <> roles (many-to-many)
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid NOT NULL,
  role_id uuid NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

-- Permissions table (optional; useful for fine-grained RBAC)
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,                  -- e.g. 'read:orders', 'write:products'
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Associative table: roles <> permissions (many-to-many)
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id uuid NOT NULL,
  permission_id uuid NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

-- Sessions / Refresh tokens (to test token revocation etc.)
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token_hash text NOT NULL,            -- hashed token stored for lookup
  user_agent text,
  ip_addr text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz
);

-- External auth providers (OAuth, SSO - stores provider-specific tokens and metadata)
CREATE TABLE IF NOT EXISTS auth_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL,              -- e.g. 'google', 'github', 'microsoft'
  provider_user_id text NOT NULL,      -- provider's user id
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  provider_metadata jsonb,             -- store additional provider info
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_user_id)
);

-- Organizations / Tenants (for multi-tenant support and role scoping)
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  description text,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Organization members with scoped roles (user_id -> organization_id -> role_id)
CREATE TABLE IF NOT EXISTS organization_user_roles (
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role_id uuid NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id, role_id)
);

-- --------------------------------------------------------------------
-- Foreign key constraints and tuning
-- --------------------------------------------------------------------


-- Users: unique email and set up FK to auth.users
ALTER TABLE IF EXISTS users
  ADD CONSTRAINT users_email_unique UNIQUE (email),
  ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- user_roles: reference users and roles
ALTER TABLE IF EXISTS user_roles
  ADD CONSTRAINT user_roles_user_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT user_roles_role_fkey FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;

-- role_permissions: reference roles and permissions
ALTER TABLE IF EXISTS role_permissions
  ADD CONSTRAINT role_permissions_role_fkey FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  ADD CONSTRAINT role_permissions_permission_fkey FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE;

-- sessions: reference users
ALTER TABLE IF EXISTS sessions
  ADD CONSTRAINT sessions_user_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- auth_providers: reference users
ALTER TABLE IF EXISTS auth_providers
  ADD CONSTRAINT auth_providers_user_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- organization_user_roles: reference organizations, users, and roles
ALTER TABLE IF EXISTS organization_user_roles
  ADD CONSTRAINT org_user_roles_org_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  ADD CONSTRAINT org_user_roles_user_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT org_user_roles_role_fkey FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;



-- --------------------------------------------------------------------
-- Optional useful indexes for query performance
-- These help with common lookups and improve query speed
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_providers_user_id ON auth_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_providers_provider ON auth_providers(provider);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_user_roles_org_id ON organization_user_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_user_roles_user_id ON organization_user_roles(user_id);
-- ====================================================================
-- End of initial-schema.sql
-- Next: See initial-functions.sql for triggers and helper functions
-- ====================================================================
