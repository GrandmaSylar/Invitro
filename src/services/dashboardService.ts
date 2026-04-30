/**
 * Dashboard Service — Aggregated statistics for the main dashboard.
 *
 * Uses direct Supabase queries (not RPC) for simplicity.
 * Can be migrated to a PostgreSQL function later for performance.
 */
import { supabase } from '../lib/supabase';
import type {
  DashboardStats,
  DashboardChartData,
  DailyTrendPoint,
  DepartmentBreakdown,
  RevenueTrendPoint,
  ResultFlagBreakdown,
} from '../lib/types';

// ── Helpers ────────────────────────────────────────────────────

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Service ────────────────────────────────────────────────────

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const todayStart = startOfDay(new Date());
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

  /**
   * Fetch all chart data for the analytics dashboard.
   * Returns 7-day patient/test trends, department breakdown,
   * 30-day revenue trend, and result-flag distribution.
   */
  getChartData: async (): Promise<DashboardChartData> => {
    const now = new Date();

    // Date boundaries
    const sevenDaysAgo = startOfDay(new Date(now.getTime() - 6 * 86400000));
    const thirtyDaysAgo = startOfDay(new Date(now.getTime() - 29 * 86400000));

    const [patientsRes, testsRes, deptRes, revenueRes, flagsRes] = await Promise.all([
      // Patients created in last 7 days
      supabase
        .from('patients')
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true }),

      // Lab record tests in last 7 days (join to lab_records for the date)
      supabase
        .from('lab_record_tests')
        .select('lab_records!inner(record_date)')
        .gte('lab_records.record_date', sevenDaysAgo.toISOString()),

      // Department breakdown — all tests ever ordered
      supabase
        .from('lab_record_tests')
        .select('department'),

      // Revenue over last 30 days
      supabase
        .from('lab_records')
        .select('record_date, amount_paid')
        .gte('record_date', thirtyDaysAgo.toISOString())
        .order('record_date', { ascending: true }),

      // Result flags distribution
      supabase
        .from('test_results')
        .select('flag'),
    ]);

    // ── 1. Daily Patient + Test Trend (7 days) ─────────────────

    const dailyMap = new Map<string, { patients: number; tests: number }>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo.getTime() + i * 86400000);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, { patients: 0, tests: 0 });
    }

    for (const row of patientsRes.data ?? []) {
      const key = new Date(row.created_at).toISOString().slice(0, 10);
      const entry = dailyMap.get(key);
      if (entry) entry.patients++;
    }

    for (const row of testsRes.data ?? []) {
      const recordDate = (row as any).lab_records?.record_date;
      if (!recordDate) continue;
      const key = new Date(recordDate).toISOString().slice(0, 10);
      const entry = dailyMap.get(key);
      if (entry) entry.tests++;
    }

    const dailyTrend: DailyTrendPoint[] = [];
    dailyMap.forEach((val, key) => {
      dailyTrend.push({
        date: formatShortDate(new Date(key + 'T00:00:00')),
        patients: val.patients,
        tests: val.tests,
      });
    });

    // ── 2. Department Breakdown (pie) ──────────────────────────

    const deptCount = new Map<string, number>();
    for (const row of deptRes.data ?? []) {
      const dept = (row as any).department || 'Unknown';
      deptCount.set(dept, (deptCount.get(dept) ?? 0) + 1);
    }
    const departmentBreakdown: DepartmentBreakdown[] = [];
    deptCount.forEach((count, department) => {
      departmentBreakdown.push({ department, count });
    });
    departmentBreakdown.sort((a, b) => b.count - a.count);

    // ── 3. Revenue Trend (30 days) ─────────────────────────────

    const revenueMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo.getTime() + i * 86400000);
      revenueMap.set(d.toISOString().slice(0, 10), 0);
    }

    for (const row of revenueRes.data ?? []) {
      const key = new Date(row.record_date).toISOString().slice(0, 10);
      if (revenueMap.has(key)) {
        revenueMap.set(key, (revenueMap.get(key) ?? 0) + Number(row.amount_paid));
      }
    }

    const revenueTrend: RevenueTrendPoint[] = [];
    revenueMap.forEach((revenue, key) => {
      revenueTrend.push({
        date: formatShortDate(new Date(key + 'T00:00:00')),
        revenue,
      });
    });

    // ── 4. Result Flags (pie) ──────────────────────────────────

    const flagCount = new Map<string, number>();
    for (const row of flagsRes.data ?? []) {
      const flag = (row as any).flag || 'Unknown';
      flagCount.set(flag, (flagCount.get(flag) ?? 0) + 1);
    }
    const resultFlags: ResultFlagBreakdown[] = [];
    flagCount.forEach((count, flag) => {
      resultFlags.push({ flag, count });
    });

    return { dailyTrend, departmentBreakdown, revenueTrend, resultFlags };
  },
};
