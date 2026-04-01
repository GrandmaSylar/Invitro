import { useAuthStore } from '../stores/useAuthStore';

export function usePermission(key: string): boolean {
  const user = useAuthStore((state) => state.user);
  const resolvedPermissions = useAuthStore((state) => state.resolvedPermissions);

  if (user?.roleId === 'developer') {
    return true;
  }

  return resolvedPermissions[key] ?? false;
}
