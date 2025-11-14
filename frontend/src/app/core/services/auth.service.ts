import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { User } from '../models';

/**
 * AuthService - Implements PKCE OAuth 2.0 Flow
 * 
 * PKCE (Proof Key for Code Exchange) is the modern, secure standard for SPAs:
 * - More secure than implicit flow (authorization code with code challenge)
 * - Prevents authorization code interception attacks
 * - Supported natively by Supabase Auth
 * 
 * Flow:
 * 1. SignUp: User creates account → DB trigger creates public.users profile
 * 2. SignIn: PKCE exchange → JWT tokens stored → Profile loaded
 * 3. Auto-restore: On service init, attempts to restore user from stored session
 * 4. Roles: Query user_roles → roles RPC (fallback: manual join)
 * 5. SignOut: Revoke session → Clear local state
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _currentUser$ = new BehaviorSubject<User | null>(null);
  private _isLoading$ = new BehaviorSubject<boolean>(false);
  private _error$ = new BehaviorSubject<string | null>(null);

  constructor(private supabase: SupabaseService) {
    // Listen to auth state changes (auto-restore on page refresh)
    this.supabase.onAuthStateChange(async (_event: string, session: any) => {
      if (session?.access_token) {
        await this.loadProfile();
      } else {
        this._currentUser$.next(null);
      }
    });

    // Try to restore user on service init (handles page refresh)
    this.restoreSession().catch(() => {});
  }

  // Observable streams for components
  get currentUser$(): Observable<User | null> {
    return this._currentUser$.asObservable();
  }

  get isLoading$(): Observable<boolean> {
    return this._isLoading$.asObservable();
  }

  get error$(): Observable<string | null> {
    return this._error$.asObservable();
  }

  /**
   * Restore user session from stored tokens (on page refresh)
   * Supabase PKCE flow automatically handles token refresh
   */
  async restoreSession(): Promise<User | null> {
    try {
      const user = await this.supabase.getUser();
      if (user) {
        return await this.loadProfile();
      }
      return null;
    } catch (err) {
      console.warn('Failed to restore session:', err);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.supabase.getUser();
    return !!user;
  }

  /**
   * Sign up with PKCE flow
   * - Creates auth.users entry
   * - Trigger creates public.users profile
   * - Optionally auto-confirms email (depends on Supabase settings)
   */
  async signUp(email: string, password: string, displayName?: string) {
    this._isLoading$.next(true);
    this._error$.next(null);
    
    try {
      const resp = await this.supabase.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0]
          }
          // If you have email confirmation, set redirectTo:
          // redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (resp.error) {
        this._error$.next(resp.error.message);
        throw resp.error;
      }

      // If sign up auto-confirms, load profile
      if (resp.data?.session?.access_token) {
        await this.loadProfile();
      }

      return resp;
    } catch (err: any) {
      const msg = err?.message || 'Sign up failed';
      this._error$.next(msg);
      throw err;
    } finally {
      this._isLoading$.next(false);
    }
  }

  /**
   * Sign in with PKCE flow
   * - Client initiates PKCE challenge
   * - Exchange code for tokens (secure, not exposed in URL)
   * - Supabase handles token refresh automatically
   */
  async signIn(email: string, password: string) {
    this._isLoading$.next(true);
    this._error$.next(null);

    try {
      const resp = await this.supabase.client.auth.signInWithPassword({
        email,
        password
      });

      if (resp.error) {
        this._error$.next(resp.error.message);
        throw resp.error;
      }

      // Load user profile and roles
      if (resp.data?.session?.access_token) {
        await this.loadProfile();
      }

      return resp;
    } catch (err: any) {
      const msg = err?.message || 'Sign in failed';
      this._error$.next(msg);
      throw err;
    } finally {
      this._isLoading$.next(false);
    }
  }

  /**
   * Sign out: revoke session and clear state
   */
  async signOut() {
    this._isLoading$.next(true);
    this._error$.next(null);

    try {
      await this.supabase.client.auth.signOut();
      this._currentUser$.next(null);
    } catch (err: any) {
      const msg = err?.message || 'Sign out failed';
      this._error$.next(msg);
      console.error('Sign out error:', err);
    } finally {
      this._isLoading$.next(false);
    }
  }

  /**
   * Load user profile from public.users
   * Called after sign in, on page restore, and when profile updates
   */
  async loadProfile(): Promise<User | null> {
    try {
      const supUser = await this.supabase.getUser();
      if (!supUser) {
        this._currentUser$.next(null);
        return null;
      }

      const { data, error } = await this.supabase.client
        .from('users')
        .select('*')
        .eq('id', supUser.id)
        .single();

      if (error || !data) {
        // If no profile exists yet, create a minimal one
        // (DB trigger should create it, but fallback here)
        const minimalUser = new User({
          id: supUser.id,
          email: supUser.email ?? '',
          displayName: (supUser.user_metadata as any)?.display_name
        });
        this._currentUser$.next(minimalUser);
        return minimalUser;
      }

      const profile = User.fromJson(data);
      this._currentUser$.next(profile);
      return profile;
    } catch (err) {
      console.error('Failed to load profile:', err);
      return null;
    }
  }

  /**
   * Update user profile in public.users
   */
  async updateProfile(updates: Partial<User>): Promise<User | null> {
    try {
      const supUser = await this.supabase.getUser();
      if (!supUser) throw new Error('Not authenticated');

      const { data, error } = await this.supabase.client
        .from('users')
        .update({
          display_name: updates.displayName,
          avatar_url: updates.avatarUrl,
          metadata: updates.metadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', supUser.id)
        .select('*')
        .single();

      if (error) throw error;

      const updated = User.fromJson(data);
      this._currentUser$.next(updated);
      return updated;
    } catch (err: any) {
      this._error$.next(err?.message || 'Update profile failed');
      throw err;
    }
  }

  /**
   * Get all roles assigned to current user
   * Prefers RPC get_user_roles (defined in initial-functions.sql)
   * Falls back to manual join if RPC unavailable
   */
  async getRolesForCurrentUser(): Promise<string[]> {
    try {
      const supUser = await this.supabase.getUser();
      if (!supUser) return [];

      // Try RPC first (more efficient)
      try {
        const { data, error } = await this.supabase.client.rpc('get_user_roles', {
          p_user_id: supUser.id
        });

        if (!error && data) {
          return (data as any[]).map(r => r.name || r.role_name).filter(Boolean);
        }
      } catch (_) {
        // RPC not available, use fallback
      }

      // Fallback: manual join user_roles -> roles
      const { data } = await this.supabase.client
        .from('user_roles')
        .select('role_id, roles(name)')
        .eq('user_id', supUser.id);

      if (!data) return [];
      return (data as any[])
        .map((d: any) => d.roles?.name)
        .filter(Boolean);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      return [];
    }
  }

  /**
   * Check if current user has a specific role
   */
  async hasRole(roleName: string): Promise<boolean> {
    const roles = await this.getRolesForCurrentUser();
    return roles.includes(roleName);
  }

  /**
   * Assign a role to a user (admin operation)
   * Checks if current user is admin before allowing
   */
  async assignRoleToUser(userId: string, roleName: string): Promise<any> {
    try {
      // Check if current user is admin
      const isAdmin = await this.hasRole('admin');
      if (!isAdmin) {
        throw new Error('Only admins can assign roles');
      }

      // Get role by name
      const { data: role, error: roleError } = await this.supabase.client
        .from('roles')
        .select('*')
        .eq('name', roleName)
        .maybeSingle();

      if (roleError || !role) {
        throw new Error(`Role '${roleName}' not found`);
      }

      // Insert user-role mapping
      const { data, error } = await this.supabase.client
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: role.id
        })
        .select();

      if (error) throw error;

      return data;
    } catch (err: any) {
      this._error$.next(err?.message || 'Assign role failed');
      throw err;
    }
  }

  /**
   * Remove a role from a user (admin operation)
   */
  async removeRoleFromUser(userId: string, roleName: string): Promise<any> {
    try {
      // Check if current user is admin
      const isAdmin = await this.hasRole('admin');
      if (!isAdmin) {
        throw new Error('Only admins can remove roles');
      }

      // Get role by name
      const { data: role, error: roleError } = await this.supabase.client
        .from('roles')
        .select('*')
        .eq('name', roleName)
        .maybeSingle();

      if (roleError || !role) {
        throw new Error(`Role '${roleName}' not found`);
      }

      // Delete user-role mapping
      const { error } = await this.supabase.client
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_id', role.id);

      if (error) throw error;

      return { success: true };
    } catch (err: any) {
      this._error$.next(err?.message || 'Remove role failed');
      throw err;
    }
  }

  /**
   * List all users (admin operation, for user management)
   */
  async listUsers(limit = 50, offset = 0): Promise<User[]> {
    try {
      const isAdmin = await this.hasRole('admin');
      if (!isAdmin) {
        throw new Error('Only admins can list users');
      }

      const { data, error } = await this.supabase.client
        .from('users')
        .select('*')
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(u => User.fromJson(u));
    } catch (err: any) {
      this._error$.next(err?.message || 'List users failed');
      throw err;
    }
  }

  /**
   * Clear error state (call from components after handling errors)
   */
  clearError(): void {
    this._error$.next(null);
  }
}
