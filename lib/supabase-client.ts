// lib/supabase-client.ts
// Centralized Supabase client configuration with singleton pattern

import { createClient } from '@supabase/supabase-js';

// Create a single Supabase client instance to be reused across the app
// This prevents "Multiple GoTrueClient instances" warnings
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseInstance;
}

// Helper function to check if user is authenticated
export async function checkAuthentication() {
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

