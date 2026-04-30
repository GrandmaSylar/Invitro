/**
 * React Query hooks for dashboard statistics and chart data.
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

export function useDashboardCharts() {
  return useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: () => dashboardService.getChartData(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // auto-refetch every 5 minutes
  });
}
