import { useAuthStore } from '../stores/useAuthStore';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const pendingTwoFactor = useAuthStore((state) => state.pendingTwoFactor);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const completeTwoFactor = useAuthStore((state) => state.completeTwoFactor);

  return {
    user,
    isAuthenticated,
    pendingTwoFactor,
    login,
    logout,
    completeTwoFactor,
  };
}
