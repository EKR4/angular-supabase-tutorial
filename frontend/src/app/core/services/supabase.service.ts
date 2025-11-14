import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, Session, User as SupabaseUser } from '@supabase/supabase-js';
import { environment } from '../../enviroments/environment';

/**
 * SupabaseService
 * - Initializes the Supabase client using environment config
 * - Exposes the raw client for direct queries in other services
 *
 * Note: Set SUPABASE_URL and SUPABASE_ANON_KEY in .env and they will be read from environment.ts
 */
@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  client: SupabaseClient;

  constructor() {
    const url = environment.supabase.url;
    const key = environment.supabase.anon;

    if (!url || !key) {
      console.error(
        'SupabaseService: SUPABASE_URL or SUPABASE_ANON_KEY not found in environment config. ' +
        'Please set these in your .env file and restart the dev server.'
      );
    }

    this.client = createClient(url, key, {
      auth: {
        autoRefreshToken: environment.supabase.autoRefreshToken ?? true,
        persistSession: environment.supabase.persistSession ?? true
      }
    });
  }

  // Convenience wrappers for commonly-used auth methods
  async getUser(): Promise<SupabaseUser | null> {
    const { data } = await this.client.auth.getUser();
    return data?.user ?? null;
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return this.client.auth.onAuthStateChange((event: string, session: Session | null) => callback(event, session));
  }
}
