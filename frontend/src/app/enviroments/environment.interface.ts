export interface Environment {
  production: boolean;
  supabase: {
    url: string;
    anon: string;
    rolekey: string;
    autoRefreshToken?: boolean;
    persistSession?: boolean;
    database?: {
      url?: string; // Optional for client-side code
    };
  };
  schema: {
    auth: {
      users: string;
      profiles: string;
      admin_users: string;
    };
    public: {
      companies: string;
      user_profiles: string;
    };
  };
}