import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '⚠️  Missing Supabase environment variables.\n' +
    '   Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.'
  );
}

/**
 * Supabase client singleton.
 * 
 * We use a plain (untyped) client here for maximum flexibility.
 * Row-level type safety is handled via the mapper functions in
 * authService.ts (mapUserRow, mapRoleRow) and explicit interfaces.
 */
export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storageKey: 'lims-supabase-auth',
    },
  }
);
