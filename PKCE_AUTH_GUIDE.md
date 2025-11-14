/* PKCE OAuth 2.0 Authentication Flow - Complete Guide */

=============================================================================
1. WHY PKCE?
=============================================================================

PKCE (RFC 7636 - Proof Key for Code Exchange) is the modern OAuth 2.0 standard:

✅ ADVANTAGES:
  - More secure than implicit flow (no tokens in URL)
  - Authorization code is exchanged for tokens securely
  - Prevents authorization code interception attacks
  - Built-in to Supabase Auth (automatic handling)
  - Supports auto token refresh
  - Complies with OAuth 2.0 security best practices

❌ IMPLICIT FLOW (NOT RECOMMENDED):
  - Tokens exposed in URL fragment
  - Vulnerable to token theft/XSS
  - No refresh token support
  - Deprecated by OAuth 2.0 Security Advisory


=============================================================================
2. PKCE FLOW SEQUENCE
=============================================================================

User Sign Up / Sign In Flow:
┌─────────────────────────────────────────────────────────────────┐
│  1. User enters email + password                                │
│  2. Client generates: code_challenge = hash(code_verifier)      │
│  3. Client initiates auth with code_challenge                   │
│  4. Supabase validates code_challenge                           │
│  5. Supabase issues authorization code                          │
│  6. Client exchanges code + code_verifier for tokens            │
│  7. Tokens never exposed in URL (safer)                         │
│  8. Access token used for API calls                             │
│  9. Refresh token auto-refreshes on expiry                      │
│ 10. DB trigger creates public.users profile on signup           │
│ 11. Client loads user profile + roles                           │
└─────────────────────────────────────────────────────────────────┘


=============================================================================
3. IMPLEMENTATION IN ANGULAR
=============================================================================

SETUP (Already done in your project):

1. SupabaseService:
   - Creates client: createClient(url, key)
   - Supabase handles PKCE automatically
   - Exposes: client, getUser(), onAuthStateChange()

2. AuthService (PKCE-enabled):
   - signUp(email, password, displayName?) → creates auth + profile
   - signIn(email, password) → PKCE exchange internally
   - signOut() → revokes session
   - loadProfile() → fetches public.users + roles
   - getRolesForCurrentUser() → user's assigned roles
   - hasRole(roleName) → boolean check
   - assignRoleToUser(userId, roleName) → admin operation
   - Observable streams: currentUser$, isLoading$, error$

3. Auth Guards:
   - authGuard: Redirects unauthenticated users to /auth/login
   - roleGuard: Checks route.data.roles; redirects to /unauthorized

4. Observable Streams:
   - currentUser$: Emits User | null (auto-restores on refresh)
   - isLoading$: Emits boolean during operations
   - error$: Emits error messages

=============================================================================
4. USAGE IN COMPONENTS
=============================================================================

LOGIN COMPONENT EXAMPLE:
─────────────────────────────────────────────────────────────────
import { AuthService } from '@core/services/auth.service';

export class LoginComponent {
  constructor(private auth: AuthService) {}

  async onLogin(email: string, password: string) {
    try {
      const resp = await this.auth.signIn(email, password);
      if (resp?.error) {
        // Error is in error$ stream, displayed in template
        return;
      }
      // Success: currentUser$ emits, can subscribe or redirect
      this.router.navigate(['/dashboard']);
    } catch (err) {
      console.error('Sign in failed:', err);
    }
  }
}

TEMPLATE USAGE:
─────────────────────────────────────────────────────────────────
<div>
  <!-- Error Display -->
  <div *ngIf="auth.error$ | async as error" class="alert-error">
    {{ error }}
    <button (click)="auth.clearError()">✕</button>
  </div>

  <!-- Loading State -->
  <button [disabled]="auth.isLoading$ | async">
    {{ (auth.isLoading$ | async) ? 'Signing in...' : 'Sign In' }}
  </button>

  <!-- User Profile -->
  <div *ngIf="auth.currentUser$ | async as user">
    Welcome, {{ user.displayName || user.email }}!
  </div>
</div>

ROLE-BASED UI EXAMPLE:
─────────────────────────────────────────────────────────────────
import { async } from '@angular/core';

export class DashboardComponent implements OnInit {
  isAdmin = false;

  constructor(private auth: AuthService) {}

  async ngOnInit() {
    this.isAdmin = await this.auth.hasRole('admin');
  }
}

<div>
  <button *ngIf="isAdmin" (click)="onManageUsers()">
    Manage Users
  </button>
</div>

=============================================================================
5. ROUTE PROTECTION WITH GUARDS
=============================================================================

APP ROUTES EXAMPLE:
─────────────────────────────────────────────────────────────────
import { authGuard, roleGuard } from '@core/guards';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      { path: 'login', loadComponent: () => import(...).then(m => m.LoginComponent) },
      { path: 'signup', loadComponent: () => import(...).then(m => m.SignUpComponent) },
    ]
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],  // Must be authenticated
    loadComponent: () => import(...).then(m => m.DashboardComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    canActivateChild: [roleGuard],
    data: { roles: ['admin'] },  // Only admin role allowed
    children: [
      { path: 'users', loadComponent: () => import(...).then(m => m.UsersComponent) }
    ]
  },
  {
    path: 'unauthorized',
    loadComponent: () => import(...).then(m => m.UnauthorizedComponent)
  }
];

=============================================================================
6. AUTOMATIC SESSION RESTORE (CRITICAL!)
=============================================================================

On Page Refresh:
  1. AuthService constructor runs
  2. Calls restoreSession()
  3. Supabase client checks stored tokens
  4. If valid tokens exist, loadProfile() fetches user
  5. currentUser$ emits user data
  6. Components automatically show authenticated state

No manual login needed after page refresh! ✅

=============================================================================
7. ROLE-BASED ACCESS CONTROL (RBAC) FLOW
=============================================================================

Admin assigns role to user:
  1. Admin calls: await auth.assignRoleToUser(userId, 'manager')
  2. AuthService checks: does current user have 'admin' role?
  3. If yes: Insert into user_roles table
  4. User's next getRolesForCurrentUser() includes 'manager'
  5. Components re-render with new permissions

User checks their permissions:
  const hasAccess = await auth.hasRole('manager');
  if (hasAccess) { /* show feature */ }

=============================================================================
8. ERROR HANDLING & USER FEEDBACK
=============================================================================

Error Flow:
  1. Any auth operation catches error
  2. Sets error$ BehaviorSubject with message
  3. Template displays via: *ngIf="error$ | async"
  4. User clicks dismiss → clearError()
  5. Error$ emits null

Loading States:
  1. Operation starts → isLoading$ = true
  2. Template disables button: [disabled]="isLoading$ | async"
  3. Shows spinner if needed
  4. Operation completes → isLoading$ = false

=============================================================================
9. ENVIRONMENT-DRIVEN CONFIG (BUILD-TIME INJECTION)
=============================================================================

.env file:
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...

environment.ts:
  url: import.meta.env.VITE_SUPABASE_URL || ''

Build Time:
  npm run start  → Vite reads .env, injects values
  npm run build  → Uses environment.prod.ts

Security:
  - .env in .gitignore (secrets not committed)
  - Build tool handles injection (safe for SPAs)

=============================================================================
10. SECURITY BEST PRACTICES FOLLOWED
=============================================================================

✅ PKCE Authorization Code Flow
✅ Environment-driven secrets (never hardcoded)
✅ Secure token storage (Supabase handles via httpOnly cookies if possible)
✅ RLS policies on database (row-level access control)
✅ Admin role checks before sensitive operations
✅ Error messages don't leak sensitive info
✅ Session auto-refresh without user action

=============================================================================
11. TESTING THE FLOW MANUALLY
=============================================================================

1. START DEV SERVER:
   cd frontend
   npm run start

2. SIGN UP:
   - Navigate to: http://localhost:4200/auth/signup
   - Fill form with test credentials
   - Check browser console for errors
   - Should redirect to /dashboard on success

3. VERIFY PROFILE CREATED:
   - Open Supabase Dashboard
   - auth.users table: should have new row
   - public.users table: should have synced profile (via trigger)

4. ASSIGN ROLE (admin only):
   - Need existing 'admin' role in database first
   - Insert via Supabase SQL editor:
     INSERT INTO roles (name, description) VALUES ('admin', 'Administrator');
   - Then: INSERT INTO user_roles (user_id, role_id) VALUES (...);

5. TEST ROLE-BASED UI:
   - Call: await auth.hasRole('admin')
   - Should return true if user has admin role

6. SIGN OUT:
   - await auth.signOut()
   - currentUser$ should emit null
   - Router should redirect to /auth/login

7. PAGE REFRESH:
   - User should restore automatically (no re-login needed)
   - Check console: no auth errors

=============================================================================
12. NEXT STEPS / FEATURES TO ADD
=============================================================================

[ ] Email verification flow (confirm email before login)
[ ] Password reset functionality
[ ] Multi-factor authentication (MFA)
[ ] OAuth social login (Google, GitHub, etc.)
[ ] Session management (list active sessions, revoke device)
[ ] Audit logging (log all auth events)
[ ] Rate limiting (prevent brute force attacks)
[ ] Export user data (GDPR compliance)
[ ] Account deletion (soft/hard delete)

=============================================================================
