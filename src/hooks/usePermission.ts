import { useAuthStore } from '../stores/useAuthStore';

export function usePermission(key: string): boolean {
  const user = useAuthStore((state) => state.user);
  const resolvedPermissions = useAuthStore((state) => state.resolvedPermissions);

  if (user?.roleId === 'developer') {
    return true;
  }

  // Developer and Admin have default access to all 4 dashboard analytics drilldowns
  if (user?.roleId === 'admin' && (
    key === 'dashboard.view_patients_today' ||
    key === 'dashboard.view_tests_today' ||
    key === 'dashboard.view_pending_results' ||
    key === 'dashboard.view_revenue_month'
  )) {
    return true;
  }

  return resolvedPermissions[key] ?? false;
}
