import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Role, User, PermissionMap } from '../lib/types';
import { SEED_ROLES, SEED_USERS } from '../lib/mockData';
import { useAuditStore } from './useAuditStore';

interface RbacStore {
  roles: Role[];
  users: User[];
  updateRolePermissions: (roleId: string, permissions: PermissionMap) => void;
  updateRoleMetadata: (roleId: string, data: { label?: string; description?: string }) => void;
  createRole: (role: Omit<Role, 'id' | 'createdAt'>) => void;
  deleteRole: (roleId: string) => void;
  upsertUser: (user: User) => void;
  updateUserOverrides: (userId: string, permissionOverrides: PermissionMap) => void;
  updateUser: (userId: string, data: Partial<User>) => void;
  deactivateUser: (userId: string) => void;
}

export const useRbacStore = create<RbacStore>()(
  persist(
    (set, get) => ({
      roles: SEED_ROLES,
      users: SEED_USERS,
      
      updateRolePermissions: (roleId, permissions) => {
        useAuditStore.getState().addEvent({
          actorId: 'system', actorName: 'System', action: 'UPDATE_ROLE_PERMISSIONS',
          targetType: 'role', targetId: roleId, targetName: roleId, detail: 'Updated role permissions'
        });
        set((state) => ({
          roles: state.roles.map(r => r.id === roleId ? { ...r, permissions } : r)
        }));
      },
      
      updateRoleMetadata: (roleId, data) => {
        useAuditStore.getState().addEvent({
          actorId: 'system', actorName: 'System', action: 'UPDATE_ROLE_METADATA',
          targetType: 'role', targetId: roleId, targetName: roleId, detail: 'Updated role metadata'
        });
        set((state) => ({
          roles: state.roles.map(r => r.id === roleId ? { ...r, ...data } : r)
        }));
      },
      
      createRole: (role) => {
        const newRole: Role = {
          ...role,
          id: `role_${crypto.randomUUID()}`,
          createdAt: new Date().toISOString(),
        };
        useAuditStore.getState().addEvent({
          actorId: 'system', actorName: 'System', action: 'CREATE_ROLE',
          targetType: 'role', targetId: newRole.id, targetName: newRole.name, detail: 'Created new role'
        });
        set((state) => ({ roles: [...state.roles, newRole] }));
      },
      
      deleteRole: (roleId) => {
        const state = get();
        const role = state.roles.find(r => r.id === roleId);

        if (!role) {
          throw new Error('Role not found');
        }

        if (role.isSystem) {
          useAuditStore.getState().addEvent({
            actorId: 'system', actorName: 'System', action: 'DELETE_ROLE_FAILED',
            targetType: 'role', targetId: roleId, targetName: roleId, detail: 'Failed to delete system role: Action not permitted'
          });
          throw new Error('Cannot delete a system role');
        }

        if (state.users.some(u => u.roleId === roleId)) {
          useAuditStore.getState().addEvent({
            actorId: 'system', actorName: 'System', action: 'DELETE_ROLE_FAILED',
            targetType: 'role', targetId: roleId, targetName: roleId, detail: 'Failed to delete role: Role is currently assigned to users'
          });
          throw new Error('Cannot delete role currently assigned to users');
        }

        useAuditStore.getState().addEvent({
          actorId: 'system', actorName: 'System', action: 'DELETE_ROLE',
          targetType: 'role', targetId: roleId, targetName: roleId, detail: 'Deleted role'
        });
        set((state) => ({
          roles: state.roles.filter(r => r.id !== roleId)
        }));
      },
      
      upsertUser: (user) => {
        const exists = get().users.some((u) => u.id === user.id);
        if (exists) {
          useAuditStore.getState().addEvent({
            actorId: 'system', actorName: 'System', action: 'UPDATE_USER',
            targetType: 'user', targetId: user.id, targetName: user.fullName, detail: 'Upserted existing user'
          });
          set((state) => ({
            users: state.users.map((u) => u.id === user.id ? { ...u, ...user } : u)
          }));
        } else {
          useAuditStore.getState().addEvent({
            actorId: 'system', actorName: 'System', action: 'CREATE_USER',
            targetType: 'user', targetId: user.id, targetName: user.fullName, detail: 'Created new user'
          });
          set((state) => ({ users: [...state.users, user] }));
        }
      },
      
      updateUserOverrides: (userId, permissionOverrides) => {
        useAuditStore.getState().addEvent({
          actorId: 'system', actorName: 'System', action: 'UPDATE_USER_OVERRIDES',
          targetType: 'user', targetId: userId, targetName: userId, detail: 'Updated user permission overrides'
        });
        set((state) => ({
          users: state.users.map(u => u.id === userId ? { ...u, permissionOverrides } : u)
        }));
      },
      
      updateUser: (userId, data) => {
        useAuditStore.getState().addEvent({
          actorId: 'system', actorName: 'System', action: 'UPDATE_USER',
          targetType: 'user', targetId: userId, targetName: userId, detail: 'Updated user profile'
        });
        set((state) => ({
          users: state.users.map(u => u.id === userId ? { ...u, ...data } : u)
        }));
      },
      
      deactivateUser: (userId) => {
        useAuditStore.getState().addEvent({
          actorId: 'system', actorName: 'System', action: 'DEACTIVATE_USER',
          targetType: 'user', targetId: userId, targetName: userId, detail: 'Deactivated user'
        });
        set((state) => ({
          users: state.users.map(u => u.id === userId ? { ...u, status: 'inactive' } : u)
        }));
      },
    }),
    {
      name: 'lims-rbac',
    }
  )
);
