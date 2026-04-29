/**
 * Supabase-backed API client.
 * 
 * This replaces the old axios-based apiClient that pointed to localhost:4000.
 * Components that imported `apiClient` from authService can now use this
 * for any remaining custom API calls, but most CRUD goes through
 * Supabase directly via the service modules.
 */
import { supabase } from '../lib/supabase';

export { supabase as apiClient };

/**
 * Helper to get auth headers for any external API calls if still needed.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
