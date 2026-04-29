/**
 * Dashboard Service — Aggregated statistics for the main dashboard.
 *
 * Uses direct Supabase queries (not RPC) for simplicity.
 * Can be migrated to a PostgreSQL function later for performance.
 */
import { supabase } from '../lib/supabase';
import type { DashboardStats } from '../lib/types';

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthISO = monthStart.toISOString();

    // Run all queries in parallel
    const [patientsRes, testsRes, pendingRes, revenueRes] = await Promise.all([
      // Patients registered today
      supabase
        .from('patients')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayISO),

      // Tests ordered today (via lab records created today)
      supabase
        .from('lab_record_tests')
        .select('id, lab_records!inner(record_date)', { count: 'exact', head: true })
        .gte('lab_records.record_date', todayISO),

      // Pending results: lab_record_tests that have zero test_results
      supabase.rpc('count_pending_results'),

      // Revenue this month
      supabase
        .from('lab_records')
        .select('amount_paid')
        .gte('record_date', monthISO),
    ]);

    const revenueThisMonth = (revenueRes.data ?? [])
      .reduce((sum: number, row: any) => sum + Number(row.amount_paid), 0);

    return {
      patientsToday: patientsRes.count ?? 0,
      testsToday: testsRes.count ?? 0,
      pendingResults: typeof pendingRes.data === 'number' ? pendingRes.data : 0,
      revenueThisMonth,
    };
  },
};
