import { supabase } from '../lib/supabase';
import { mapUserRow, mapRoleRow } from '../lib/mappers';
import type { User } from '../lib/types';
import { useAuthStore } from '../stores/useAuthStore';

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
    try {
      let loginEmail = credentials.login;

      // Resolve username to email address if it doesn't look like an email
      if (!loginEmail.includes('@')) {
        const { data: userProfile, error: profileErr } = await supabase
          .from('users')
          .select('email')
          .eq('username', credentials.login)
          .single();

        if (profileErr || !userProfile?.email) {
          throw new Error('Invalid credentials or user profile not found.');
        }
        loginEmail = userProfile.email;
      }

      // Step 1: Sign in with Supabase Auth (email + password)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: credentials.password,
      });

      if (authError) {
        // If it's a credentials error, throw immediately. If it's network, let it propagate to catch block.
        if (authError.status === 400 || authError.message.includes('Invalid') || authError.message.includes('credentials')) {
          throw new Error(authError.message || 'Invalid credentials');
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Invalid credentials');
      }

      // Step 2: Fetch the LIMS user profile from our custom users table
      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', loginEmail)
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

      // Step 4: Update last login and register device session (non-critical, ignore error)
      try {
        let deviceId = 'web-browser';
        if (window.electronAPI?.getDeviceId) {
          deviceId = await window.electronAPI.getDeviceId();
        } else {
          let localId = localStorage.getItem('device_id');
          if (!localId) {
            localId = 'web-' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('device_id', localId);
          }
          deviceId = localId;
        }

        const currentOverrides = userRow.permission_overrides || {};
        const newOverrides = {
          ...currentOverrides,
          _active_device_id: deviceId
        };

        await supabase
          .from('users')
          .update({ 
            last_login: new Date().toISOString(),
            permission_overrides: newOverrides
          })
          .eq('id', userRow.id);
        
        userRow.permission_overrides = newOverrides;
      } catch (e) {
        console.warn('Non-critical: Failed to update session details and active device ID', e);
      }

      // Cache credentials locally in Electron if available
      if (window.electronAPI?.cacheUserCredentials) {
        try {
          await window.electronAPI.cacheUserCredentials(userRow, roleRow, credentials.password);
        } catch (cacheErr) {
          console.error('Failed to cache credentials locally:', cacheErr);
        }
      }

      const user = mapUserRow(userRow);
      const rolePermissions = roleRow ? (roleRow.permissions as Record<string, boolean>) : {};
      const permissions = {
        ...rolePermissions,
        ...(user.permissionOverrides || {})
      };

      return {
        user,
        permissions,
        twoFactorRequired: user.twoFactorEnabled,
      };
    } catch (err: any) {
      // If we are running in Electron and the error looks like a network failure, fall back to offline login:
      const isNetworkError = err.message?.includes('fetch') || 
                             err.message?.includes('Network') || 
                             err.message?.includes('load') ||
                             !navigator.onLine;

      if (window.electronAPI?.offlineLogin && isNetworkError) {
        console.warn('Network offline or fetch failed. Attempting offline authentication fallback.');
        const result = await window.electronAPI.offlineLogin(credentials);
        if (result.success && result.user) {
          return {
            user: result.user,
            permissions: result.permissions || {},
            twoFactorRequired: result.user.twoFactorEnabled,
          };
        } else {
          throw new Error(result.error || 'Offline login failed');
        }
      }

      throw err;
    }
  },

  refreshSession: async () => {
    const state = useAuthStore.getState();
    if (!state.user) return;
    
    // Fetch the LIMS user profile from our custom users table
    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', state.user.id)
      .single();

    if (userError || !userRow) return;

    // Fetch role permissions
    const { data: roleRow } = await supabase
      .from('roles')
      .select('*')
      .eq('id', userRow.role_id)
      .single();

    const user = mapUserRow(userRow);
    const rolePermissions = roleRow ? (roleRow.permissions as Record<string, boolean>) : {};
    const permissions = {
      ...rolePermissions,
      ...(user.permissionOverrides || {})
    };

    state.updateResolvedPermissions(permissions);
    state.login(user, permissions, state.loginMethod || '');
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
