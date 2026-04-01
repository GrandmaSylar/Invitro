import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthSession, User, PermissionMap } from '../lib/types';

interface AuthStore extends AuthSession {
  login: (user: User, resolvedPermissions: PermissionMap, loginMethod: string) => void;
  logout: () => void;
  completeTwoFactor: () => void;
  updateResolvedPermissions: (permissions: PermissionMap) => void;
}

const initialState: AuthSession = {
  user: null,
  resolvedPermissions: {},
  isAuthenticated: false,
  pendingTwoFactor: false,
  loginMethod: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,
      login: (user, resolvedPermissions, loginMethod) => 
        set({ user, resolvedPermissions, isAuthenticated: true, loginMethod, pendingTwoFactor: user.twoFactorEnabled }),
      logout: () => {
        set(initialState);
        localStorage.removeItem('lims-auth');
      },
      completeTwoFactor: () => set({ pendingTwoFactor: false }),
      updateResolvedPermissions: (resolvedPermissions) => set({ resolvedPermissions }),
    }),
    {
      name: 'lims-auth',
    }
  )
);
