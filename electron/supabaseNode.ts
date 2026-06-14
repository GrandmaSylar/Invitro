import { createClient } from '@supabase/supabase-js';
import log from 'electron-log/main';

// Safely resolve the environment variables
const supabaseUrl = (import.meta.env?.VITE_SUPABASE_URL) || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta.env?.VITE_SUPABASE_ANON_KEY) || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  log.error('Supabase configuration missing in Electron main process!');
}

export const supabaseNode = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Node server process does not persist sessions to localStorage
    autoRefreshToken: true // Enable auto-refresh using the refresh_token passed to setSession
  }
});

// Authenticate the Node client using the session passed from the renderer process
export async function setMainProcessSession(session: { access_token: string; refresh_token: string }) {
  try {
    const { data, error } = await supabaseNode.auth.setSession(session);
    if (error) throw error;
    log.info('Supabase main process Node client session updated successfully.');
  } catch (err: any) {
    log.error('Failed to update Supabase main process session:', err.message);
  }
}

// Watch for authentication events to automatically sync or log status
supabaseNode.auth.onAuthStateChange((event, session) => {
  log.info(`Supabase Main Process Auth state changed: ${event}`);
});
