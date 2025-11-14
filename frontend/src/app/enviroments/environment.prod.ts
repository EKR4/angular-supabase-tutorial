import { Environment } from './environment.interface';

export const environment: Environment = {
  production: true,
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anon: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    rolekey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
    autoRefreshToken: true,
    persistSession: true
    // Database connection is only included in server-side code
  },
  schema: {
    auth: {
      users: 'auth.users',
      profiles: 'public.users',
      admin_users: 'public.users'
    },
    public: {
      companies: 'public.organizations',
      user_profiles: 'public.users'
    }
  }
};