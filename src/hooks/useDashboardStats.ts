/**
 * React Query hook for dashboard statistics.
 */
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats(),
    staleTime: 1000 * 30, // refresh every 30 seconds
    refetchInterval: 1000 * 60, // auto-refetch every minute
  });
}
