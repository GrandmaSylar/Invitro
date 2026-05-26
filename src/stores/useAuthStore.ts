import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthSession, User, PermissionMap } from '../lib/types';

interface AuthStore extends AuthSession {
  login: (user: User, resolvedPermissions: PermissionMap, loginMethod: string) => void;
  logout: () => void;
  completeTwoFactor: () => void;
  updateResolvedPermissions: (permissions: PermissionMap) => void;
  updateThemePreset: (preset: 'default' | 'ocean-breeze' | 'turquoise-harmony' | 'silent-waters') => void;
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
    (set, get) => ({
      ...initialState,
      login: (user, resolvedPermissions, loginMethod) => {
        set({ user, resolvedPermissions, isAuthenticated: true, loginMethod, pendingTwoFactor: user.twoFactorEnabled });
        import('./useAuditStore').then(({ useAuditStore }) => {
          useAuditStore.getState().addEvent({
            actorId: user.id,
            actorName: user.fullName,
            action: 'LOGIN',
            targetType: 'system',
            targetId: 'system',
            targetName: 'LIMS application',
            detail: `User logged in via ${loginMethod}`
          });
        });
      },
      logout: () => {
        const currentUser = get().user;
        if (currentUser) {
          import('./useAuditStore').then(({ useAuditStore }) => {
            useAuditStore.getState().addEvent({
              actorId: currentUser.id,
              actorName: currentUser.fullName,
              action: 'LOGOUT',
              targetType: 'system',
              targetId: 'system',
              targetName: 'LIMS application',
              detail: 'User logged out'
            });
          });
        }
        set(initialState);
        localStorage.removeItem('lims-auth');
      },
      completeTwoFactor: () => set({ pendingTwoFactor: false }),
      updateResolvedPermissions: (resolvedPermissions) => set({ resolvedPermissions }),
      updateThemePreset: (preset) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, themePreset: preset } });
        }
      },
    }),
    {
      name: 'lims-auth',
    }
  )
);
