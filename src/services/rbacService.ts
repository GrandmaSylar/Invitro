/**
 * RBAC Service — Users & Roles CRUD via Supabase.
 *
 * This service is a pure data layer. It does NOT touch Zustand stores.
 * Stores/hooks call this service and update themselves on success.
 */
import { supabase } from '../lib/supabase';
import { mapUserRow, mapRoleRow } from '../lib/mappers';
import type { Role, User, PermissionMap } from '../lib/types';

export const rbacService = {
  // ── ROLES ────────────────────────────────────────────────────

  getRoles: async (): Promise<Role[]> => {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to fetch roles: ${error.message}`);
    return (data ?? []).map(mapRoleRow);
  },

  updateRolePermissions: async (roleId: string, permissions: PermissionMap): Promise<Role> => {
    const { data, error } = await supabase
      .from('roles')
      .update({ permissions: permissions as any })
      .eq('id', roleId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update role permissions: ${error.message}`);
    return mapRoleRow(data);
  },

  createRole: async (role: Omit<Role, 'id' | 'createdAt'>): Promise<Role> => {
    const newId = `role_${crypto.randomUUID()}`;
    const { data, error } = await supabase
      .from('roles')
      .insert({
        id: newId,
        name: role.name,
        label: role.label,
        description: role.description ?? null,
        is_system: role.isSystem ?? false,
        permissions: (role.permissions ?? {}) as any,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create role: ${error.message}`);
    return mapRoleRow(data);
  },

  deleteRole: async (roleId: string): Promise<void> => {
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', roleId);

    if (error) throw new Error(`Failed to delete role: ${error.message}`);
  },

  // ── USERS ────────────────────────────────────────────────────

  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to fetch users: ${error.message}`);
    return (data ?? []).map(mapUserRow);
  },

  createUser: async (
    userData: Omit<User, 'id' | 'createdAt' | 'permissionOverrides' | 'lastLogin'> & {
      sendInvite?: boolean;
      password?: string;
    }
  ): Promise<User> => {
    const password = userData.password || 'tempPassword123!';

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password,
      options: {
        data: {
          full_name: userData.fullName,
          username: userData.username,
        },
      },
    });

    if (authError) throw new Error(`Auth signup failed: ${authError.message}`);

    const userId = authData.user?.id
      || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        full_name: userData.fullName,
        email: userData.email,
        username: userData.username,
        password_hash: '(managed_by_supabase_auth)',
        phone: userData.phone ?? null,
        role_id: userData.roleId,
        permission_overrides: {},
        two_factor_enabled: userData.twoFactorEnabled ?? false,
        two_factor_method: userData.twoFactorMethod ?? null,
        status: userData.status ?? 'active',
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create user profile: ${error.message}`);
    return mapUserRow(data);
  },

  updateUser: async (userId: string, userData: Partial<User>): Promise<User> => {
    const updates: Record<string, any> = {};
    if (userData.fullName !== undefined) updates.full_name = userData.fullName;
    if (userData.email !== undefined) updates.email = userData.email;
    if (userData.username !== undefined) updates.username = userData.username;
    if (userData.phone !== undefined) updates.phone = userData.phone;
    if (userData.roleId !== undefined) updates.role_id = userData.roleId;
    if (userData.permissionOverrides !== undefined) updates.permission_overrides = userData.permissionOverrides;
    if (userData.twoFactorEnabled !== undefined) updates.two_factor_enabled = userData.twoFactorEnabled;
    if (userData.twoFactorMethod !== undefined) updates.two_factor_method = userData.twoFactorMethod;
    if (userData.status !== undefined) updates.status = userData.status;

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update user: ${error.message}`);
    return mapUserRow(data);
  },

  updateUserOverrides: async (userId: string, permissionOverrides: PermissionMap): Promise<User> => {
    const { data, error } = await supabase
      .from('users')
      .update({ permission_overrides: permissionOverrides as any })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update user overrides: ${error.message}`);
    return mapUserRow(data);
  },

  deactivateUser: async (userId: string): Promise<User> => {
    const { data, error } = await supabase
      .from('users')
      .update({ status: 'inactive' })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(`Failed to deactivate user: ${error.message}`);
    return mapUserRow(data);
  },
};
