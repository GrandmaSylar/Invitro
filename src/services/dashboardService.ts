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
    if (window.electronAPI && (window.electronAPI as any).db) {
      return (window.electronAPI as any).db.dashboard
        ? (window.electronAPI as any).db.dashboard.getStats()
        : (window.electronAPI as any).db.getDashboardStats();
    }

    const todayStart = startOfDay(new Date());
    const todayISO = todayStart.toISOString();

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayISO = yesterdayStart.toISOString();

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthISO = monthStart.toISOString();

    // Run all queries in parallel
    const [
      patientsRes,
      patientsYesterdayRes,
      testsRes,
      testsYesterdayRes,
      pendingRes,
      pendingYesterdayRawRes,
      revenueRes,
      revenueTodayRes,
      revenueYesterdayRes
    ] = await Promise.all([
      // Patients registered today
      supabase
        .from('patients')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayISO),

      // Patients registered yesterday
      supabase
        .from('patients')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', yesterdayISO)
        .lt('created_at', todayISO),

      // Tests ordered today (via lab records created today)
      supabase
        .from('lab_record_tests')
        .select('id, lab_records!inner(record_date)', { count: 'exact', head: true })
        .gte('lab_records.record_date', todayISO),

      // Tests ordered yesterday
      supabase
        .from('lab_record_tests')
        .select('id, lab_records!inner(record_date)', { count: 'exact', head: true })
        .gte('lab_records.record_date', yesterdayISO)
        .lt('lab_records.record_date', todayISO),

      // Pending results: lab_record_tests that have zero test_results
      supabase.rpc('count_pending_results'),

      // Pending results yesterday (fetch tests created before today and their test results to count in memory)
      supabase
        .from('lab_record_tests')
        .select('id, lab_records!inner(record_date), test_results(entered_at)')
        .lt('lab_records.record_date', todayISO),

      // Revenue this month (using actual payment dates!)
      supabase
        .from('payments')
        .select('amount')
        .gte('payment_date', monthISO),

      // Revenue today
      supabase
        .from('payments')
        .select('amount')
        .gte('payment_date', todayISO),

      // Revenue yesterday
      supabase
        .from('payments')
        .select('amount')
        .gte('payment_date', yesterdayISO)
        .lt('payment_date', todayISO),
    ]);

    const revenueThisMonth = (revenueRes.data ?? [])
      .reduce((sum: number, row: any) => sum + Number(row.amount), 0);

    const revenueToday = (revenueTodayRes.data ?? [])
      .reduce((sum: number, row: any) => sum + Number(row.amount), 0);

    const revenueYesterday = (revenueYesterdayRes.data ?? [])
      .reduce((sum: number, row: any) => sum + Number(row.amount), 0);

    const pendingResultsYesterday = (pendingYesterdayRawRes.data ?? []).filter((lrt: any) => {
      if (!lrt.test_results || lrt.test_results.length === 0) return true;
      const enteredAt = lrt.test_results[0].entered_at;
      return new Date(enteredAt) >= todayStart;
    }).length;

    return {
      patientsToday: patientsRes.count ?? 0,
      patientsYesterday: patientsYesterdayRes.count ?? 0,
      testsToday: testsRes.count ?? 0,
      testsYesterday: testsYesterdayRes.count ?? 0,
      pendingResults: typeof pendingRes.data === 'number' ? pendingRes.data : 0,
      pendingResultsYesterday,
      revenueThisMonth,
      revenueToday,
      revenueYesterday,
    };
  },

  /**
   * Fetch all chart data for the analytics dashboard.
   * Returns 7-day patient/test trends, department breakdown,
   * 30-day revenue trend, and result-flag distribution.
   */
  getChartData: async (): Promise<DashboardChartData> => {
    if (window.electronAPI && (window.electronAPI as any).db) {
      return (window.electronAPI as any).db.dashboard
        ? (window.electronAPI as any).db.dashboard.getChartData()
        : (window.electronAPI as any).db.getDashboardChartData();
    }

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

      // Revenue over last 30 days (using actual payment dates!)
      supabase
        .from('payments')
        .select('payment_date, amount')
        .gte('payment_date', thirtyDaysAgo.toISOString())
        .order('payment_date', { ascending: true }),

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
      const key = new Date(row.payment_date).toISOString().slice(0, 10);
      if (revenueMap.has(key)) {
        revenueMap.set(key, (revenueMap.get(key) ?? 0) + Number(row.amount));
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

  getPatientsToday: async (startDate?: string, endDate?: string): Promise<any[]> => {
    if (window.electronAPI && (window.electronAPI as any).db) {
      return (window.electronAPI as any).db.dashboard.getPatientsToday(startDate, endDate);
    }
    
    let startISO: string;
    let endISO: string;
    if (startDate) {
      startISO = new Date(`${startDate}T00:00:00`).toISOString();
    } else {
      startISO = startOfDay(new Date()).toISOString();
    }
    if (endDate) {
      endISO = new Date(`${endDate}T23:59:59.999`).toISOString();
    } else {
      const d = new Date();
      d.setHours(23, 59, 59, 999);
      endISO = d.toISOString();
    }

    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map(row => ({
      id: row.id,
      patientName: row.patient_name,
      gender: row.gender,
      dob: row.dob,
      age: row.age,
      telephone: row.telephone,
      createdAt: row.created_at
    }));
  },

  getTestsToday: async (startDate?: string, endDate?: string): Promise<any[]> => {
    if (window.electronAPI && (window.electronAPI as any).db) {
      return (window.electronAPI as any).db.dashboard.getTestsToday(startDate, endDate);
    }

    let startISO: string;
    let endISO: string;
    if (startDate) {
      startISO = new Date(`${startDate}T00:00:00`).toISOString();
    } else {
      startISO = startOfDay(new Date()).toISOString();
    }
    if (endDate) {
      endISO = new Date(`${endDate}T23:59:59.999`).toISOString();
    } else {
      const d = new Date();
      d.setHours(23, 59, 59, 999);
      endISO = d.toISOString();
    }

    const { data, error } = await supabase
      .from('lab_record_tests')
      .select(`
        id,
        test_id,
        test_name,
        department,
        test_cost,
        lab_records!inner(
          id,
          lab_number,
          record_date,
          patients(
            patient_name
          )
        )
      `)
      .gte('lab_records.record_date', startISO)
      .lte('lab_records.record_date', endISO)
      .order('lab_records(record_date)', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map((row: any) => ({
      id: row.id,
      labRecordId: row.lab_records?.id || '',
      testId: row.test_id,
      testName: row.test_name,
      department: row.department,
      testCost: Number(row.test_cost),
      labNumber: row.lab_records?.lab_number || '',
      recordDate: row.lab_records?.record_date || '',
      patientName: row.lab_records?.patients?.patient_name || 'Unknown'
    }));
  },

  getPendingResults: async (startDate?: string, endDate?: string): Promise<any[]> => {
    if (window.electronAPI && (window.electronAPI as any).db) {
      return (window.electronAPI as any).db.dashboard.getPendingResults(startDate, endDate);
    }

    let query = supabase
      .from('lab_record_tests')
      .select(`
        id,
        test_id,
        test_name,
        department,
        test_cost,
        lab_records!inner(
          id,
          lab_number,
          record_date,
          patients(
            patient_name
          )
        ),
        test_results(id)
      `);

    if (startDate) {
      const startISO = new Date(`${startDate}T00:00:00`).toISOString();
      query = query.gte('lab_records.record_date', startISO);
    }
    if (endDate) {
      const endISO = new Date(`${endDate}T23:59:59.999`).toISOString();
      query = query.lte('lab_records.record_date', endISO);
    }

    const { data, error } = await query.order('lab_records(record_date)', { ascending: false });

    if (error) throw new Error(error.message);
    const pendingTests = (data ?? []).filter((row: any) => !row.test_results || row.test_results.length === 0);

    return pendingTests.map((row: any) => ({
      id: row.id,
      labRecordId: row.lab_records?.id || '',
      testId: row.test_id,
      testName: row.test_name,
      department: row.department,
      testCost: Number(row.test_cost),
      labNumber: row.lab_records?.lab_number || '',
      recordDate: row.lab_records?.record_date || '',
      patientName: row.lab_records?.patients?.patient_name || 'Unknown'
    }));
  },

  getRevenueThisMonth: async (startDate?: string, endDate?: string): Promise<any[]> => {
    if (window.electronAPI && (window.electronAPI as any).db) {
      return (window.electronAPI as any).db.dashboard.getRevenueThisMonth(startDate, endDate);
    }

    let startISO: string;
    let endISO: string;
    if (startDate) {
      startISO = new Date(`${startDate}T00:00:00`).toISOString();
    } else {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      startISO = monthStart.toISOString();
    }
    if (endDate) {
      endISO = new Date(`${endDate}T23:59:59.999`).toISOString();
    } else {
      const d = new Date();
      d.setHours(23, 59, 59, 999);
      endISO = d.toISOString();
    }

    const { data, error } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        payment_date,
        receipt_number,
        received_by_id,
        users(
          full_name
        ),
        lab_records!inner(
          id,
          lab_number,
          patients(
            patient_name
          )
        )
      `)
      .gte('payment_date', startISO)
      .lte('payment_date', endISO)
      .order('payment_date', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map((row: any) => ({
      id: row.id,
      labRecordId: row.lab_records?.id || '',
      amount: Number(row.amount),
      paymentDate: row.payment_date,
      receiptNumber: row.receipt_number,
      labNumber: row.lab_records?.lab_number || '',
      patientName: row.lab_records?.patients?.patient_name || 'Unknown',
      receivedByName: ((row.users?.full_name || '').trim() || 'System').split(' ')[0]
    }));
  },

  getArrearsBreakdown: async (startDate?: string, endDate?: string): Promise<any[]> => {
    if (window.electronAPI && (window.electronAPI as any).db) {
      return (window.electronAPI as any).db.dashboard.getArrearsBreakdown(startDate, endDate);
    }

    let startISO: string;
    let endISO: string;
    if (startDate) {
      startISO = new Date(`${startDate}T00:00:00`).toISOString();
    } else {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      startISO = monthStart.toISOString();
    }
    if (endDate) {
      endISO = new Date(`${endDate}T23:59:59.999`).toISOString();
    } else {
      const d = new Date();
      d.setHours(23, 59, 59, 999);
      endISO = d.toISOString();
    }

    const { data, error } = await supabase
      .from('lab_records')
      .select(`
        id,
        lab_number,
        record_date,
        total_cost,
        amount_paid,
        arrears,
        patients(
          patient_name,
          telephone
        )
      `)
      .gt('arrears', 0)
      .gte('record_date', startISO)
      .lte('record_date', endISO)
      .order('arrears', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map((row: any) => ({
      id: row.id,
      labNumber: row.lab_number,
      recordDate: row.record_date,
      totalCost: Number(row.total_cost),
      amountPaid: Number(row.amount_paid),
      arrears: Number(row.arrears),
      patientName: row.patients?.patient_name || 'Unknown',
      telephone: row.patients?.telephone || '—'
    }));
  },
};
