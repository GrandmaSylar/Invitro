import { useRbacStore } from '../stores/useRbacStore';
import { Role, User, PermissionMap } from '../lib/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = () => delay(Math.floor(Math.random() * 300) + 300);

export const rbacService = {
  getRoles: async (): Promise<Role[]> => {
    await randomDelay();
    return useRbacStore.getState().roles;
  },
  
  updateRolePermissions: async (roleId: string, permissions: PermissionMap) => {
    await randomDelay();
    return useRbacStore.getState().updateRolePermissions(roleId, permissions);
  },
  
  createRole: async (role: Omit<Role, 'id' | 'createdAt'>) => {
    await randomDelay();
    return useRbacStore.getState().createRole(role);
  },
  
  deleteRole: async (roleId: string) => {
    await randomDelay();
    return useRbacStore.getState().deleteRole(roleId);
  },
  
  getUsers: async (): Promise<User[]> => {
    await randomDelay();
    return useRbacStore.getState().users;
  },

  createUser: async (data: Omit<User, 'id' | 'createdAt' | 'permissionOverrides' | 'lastLogin'> & { sendInvite?: boolean }) => {
    await randomDelay();
    const newUser: User = {
      ...data,
      id: 'usr_' + crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      permissionOverrides: {},
      lastLogin: undefined
    };
    useRbacStore.getState().upsertUser(newUser);
    return newUser;
  },
  
  updateUserOverrides: async (userId: string, permissionOverrides: PermissionMap) => {
    await randomDelay();
    return useRbacStore.getState().updateUserOverrides(userId, permissionOverrides);
  },
  
  updateUser: async (userId: string, data: Partial<User>) => {
    await randomDelay();
    return useRbacStore.getState().updateUser(userId, data);
  },
  
  deactivateUser: async (userId: string) => {
    await randomDelay();
    return useRbacStore.getState().deactivateUser(userId);
  }
};
