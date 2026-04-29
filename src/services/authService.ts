import { supabase } from '../lib/supabase';
import { mapUserRow, mapRoleRow } from '../lib/mappers';
import type { User } from '../lib/types';

// Re-export mappers for backward compatibility
export { mapUserRow, mapRoleRow };

export const authService = {
  /**
   * Authenticate via custom users table (username/email + password).
   * We query the users table directly and use pgcrypto for bcrypt
   * comparison through an RPC function. Until that's set up, we
   * use Supabase's built-in auth for session management but
   * resolve the LIMS user profile + role from our custom tables.
   */
  authenticate: async (credentials: { login: string; password: string }): Promise<{
    user: User;
    permissions: Record<string, boolean>;
    twoFactorRequired: boolean;
  }> => {
    // Step 1: Sign in with Supabase Auth (email + password)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: credentials.login,
      password: credentials.password,
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Invalid credentials');
    }

    // Step 2: Fetch the LIMS user profile from our custom users table
    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${credentials.login},username.eq.${credentials.login}`)
      .eq('status', 'active')
      .single();

    if (userError || !userRow) {
      throw new Error('User profile not found. Contact your administrator.');
    }

    // Step 3: Fetch role permissions
    const { data: roleRow } = await supabase
      .from('roles')
      .select('*')
      .eq('id', userRow.role_id)
      .single();

    // Step 4: Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userRow.id);

    const user = mapUserRow(userRow);
    const rolePermissions = roleRow ? (roleRow.permissions as Record<string, boolean>) : {};
    const permissions = rolePermissions ?? {};

    return {
      user,
      permissions,
      twoFactorRequired: user.twoFactorEnabled,
    };
  },

  sendPasswordReset: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);
    return { success: true };
  },

  resetPassword: async (_token: string, newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
    return { success: true };
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },

  /**
   * Get the current Supabase session (auto-refreshed).
   */
  getSession: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },
};
