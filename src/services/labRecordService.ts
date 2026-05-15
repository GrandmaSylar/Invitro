/**
 * Lab Record Service — Lab record lifecycle, attached tests, and payments.
 *
 * A lab record is the central entity that ties a patient visit to
 * one or more lab tests and their payment information.
 */
import { supabase } from '../lib/supabase';
import { mapLabRecordRow, mapLabRecordTestRow, mapPaymentRow } from '../lib/mappers';
import type { LabRecord, LabRecordTest, LabRecordFilters, Payment } from '../lib/types';

// ── Lab Number Generation ──────────────────────────────────────

/**
 * Generates a unique lab number via the Supabase RPC function
 * `generate_lab_number()` which uses a PostgreSQL sequence.
 * Format: "LAB-00001", "LAB-00002", etc.
 *
 * Falls back to a client-side timestamp-based number if the
 * RPC function is not yet deployed.
 */
export async function generateLabNumber(): Promise<string> {
  const { data, error } = await supabase.rpc('generate_lab_number');
  if (error || !data) {
    // Fallback for environments where Migration 003 hasn't been applied
    console.warn('generate_lab_number RPC not available, using fallback:', error?.message);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fallbackSeq = String(Math.floor(Math.random() * 9000) + 1000);
    return `A${dateStr}${fallbackSeq}`;
  }
  return data as string;
}

export async function previewLabNumber(): Promise<string> {
  const { data, error } = await supabase.rpc('preview_lab_number');
  if (error || !data) {
    // Fallback for environments where Migration 003 hasn't been applied
    return generateLabNumber(); // fallback to generate
  }
  return data as string;
}

// ── Service ────────────────────────────────────────────────────

export const labRecordService = {
  getLabRecords: async (filters?: LabRecordFilters): Promise<LabRecord[]> => {
    let query = supabase
      .from('lab_records')
      .select('*, patients(*), lab_record_tests(count)')
      .order('record_date', { ascending: false });

    if (filters?.patientId) {
      query = query.eq('patient_id', filters.patientId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.dateFrom) {
      query = query.gte('record_date', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('record_date', filters.dateTo);
    }
    if (filters?.search) {
      query = query.ilike('lab_number', `%${filters.search}%`);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit ?? 50) - 1);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch lab records: ${error.message}`);
    return (data ?? []).map(mapLabRecordRow);
  },

  getLabRecordById: async (id: string): Promise<LabRecord> => {
    const { data, error } = await supabase
      .from('lab_records')
      .select('*, patients(*), lab_record_tests(count)')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Failed to fetch lab record: ${error.message}`);
    return mapLabRecordRow(data);
  },

  getLabRecordByLabNumber: async (labNumber: string): Promise<LabRecord> => {
    const { data, error } = await supabase
      .from('lab_records')
      .select('*, patients(*), lab_record_tests(count)')
      .eq('lab_number', labNumber)
      .single();

    if (error) throw new Error(`Failed to fetch lab record: ${error.message}`);
    return mapLabRecordRow(data);
  },

  checkLabNumberExists: async (labNumber: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('lab_records')
      .select('id')
      .eq('lab_number', labNumber)
      .maybeSingle();
      
    if (error) return false;
    return !!data;
  },

  createLabRecord: async (recordData: {
    patientId: string;
    labNumber?: string;
    referralOption?: string;
    referralDoctorId?: string;
    referralHospitalId?: string;
    createdById?: string;
  }): Promise<LabRecord> => {
    // Generate lab number server-side if not provided
    const labNumber = recordData.labNumber ?? await generateLabNumber();

    const { data, error } = await supabase
      .from('lab_records')
      .insert({
        lab_number: labNumber,
        patient_id: recordData.patientId,
        status: 'active',
        referral_option: recordData.referralOption ?? null,
        referral_doctor_id: recordData.referralDoctorId ?? null,
        referral_hospital_id: recordData.referralHospitalId ?? null,
        subtotal: 0,
        total_cost: 0,
        amount_paid: 0,
        arrears: 0,
        created_by_id: recordData.createdById ?? null,
      })
      .select('*, patients(*), lab_record_tests(count)')
      .single();

    if (error) throw new Error(`Failed to create lab record: ${error.message}`);
    return mapLabRecordRow(data);
  },

  updateLabRecord: async (
    id: string,
    updates: Partial<{
      status: string;
      referralOption: string;
      referralDoctorId: string;
      referralHospitalId: string;
    }>
  ): Promise<LabRecord> => {
    const dbUpdates: Record<string, any> = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.referralOption !== undefined) dbUpdates.referral_option = updates.referralOption;
    if (updates.referralDoctorId !== undefined) dbUpdates.referral_doctor_id = updates.referralDoctorId;
    if (updates.referralHospitalId !== undefined) dbUpdates.referral_hospital_id = updates.referralHospitalId;

    const { data, error } = await supabase
      .from('lab_records')
      .update(dbUpdates)
      .eq('id', id)
      .select('*, patients(*), lab_record_tests(count)')
      .single();

    if (error) throw new Error(`Failed to update lab record: ${error.message}`);
    return mapLabRecordRow(data);
  },

  // ── Attached Tests ───────────────────────────────────────────

  getTestsForRecord: async (labRecordId: string): Promise<LabRecordTest[]> => {
    const { data, error } = await supabase
      .from('lab_record_tests')
      .select('*, tests(*, test_parameters(sort_order, parameters(*)))')
      .eq('lab_record_id', labRecordId)
      .order('test_name', { ascending: true });

    if (error) throw new Error(`Failed to fetch record tests: ${error.message}`);
    return (data ?? []).map(mapLabRecordTestRow);
  },

  addTestToRecord: async (
    labRecordId: string,
    test: { testId: string; testName: string; department: string; testCost: number }
  ): Promise<LabRecordTest> => {
    const { data, error } = await supabase
      .from('lab_record_tests')
      .insert({
        lab_record_id: labRecordId,
        test_id: test.testId,
        test_name: test.testName,
        department: test.department,
        test_cost: test.testCost,
        total_cost: test.testCost,
        amount_paid: 0,
        arrears: test.testCost,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to add test to record: ${error.message}`);

    // Recalculate totals on the parent record
    await recalculateRecordTotals(labRecordId);
    return mapLabRecordTestRow(data);
  },

  removeTestFromRecord: async (labRecordTestId: string, labRecordId: string): Promise<void> => {
    const { error } = await supabase
      .from('lab_record_tests')
      .delete()
      .eq('id', labRecordTestId);

    if (error) throw new Error(`Failed to remove test from record: ${error.message}`);
    await recalculateRecordTotals(labRecordId);
  },

  // ── Payments ─────────────────────────────────────────────────

  getPayments: async (labRecordId: string): Promise<Payment[]> => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('lab_record_id', labRecordId)
      .order('payment_date', { ascending: false });

    if (error) throw new Error(`Failed to fetch payments: ${error.message}`);
    return (data ?? []).map(mapPaymentRow);
  },

  recordPayment: async (labRecordId: string, amount: number, receivedById?: string): Promise<Payment> => {
    // 1. Generate receipt number
    const { data: receiptNumber, error: receiptError } = await supabase.rpc('generate_receipt_number');
    if (receiptError) throw new Error(`Failed to generate receipt: ${receiptError.message}`);

    // 2. Insert payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        lab_record_id: labRecordId,
        amount,
        received_by_id: receivedById || null,
        receipt_number: receiptNumber
      })
      .select()
      .single();

    if (paymentError) throw new Error(`Failed to record payment: ${paymentError.message}`);

    // 3. Recalculate totals which sums payments and updates amount_paid and arrears
    await recalculateRecordTotals(labRecordId);

    return mapPaymentRow(payment);
  },

  recalculateStatusAndTotals: async (labRecordId: string): Promise<void> => {
    await recalculateRecordTotals(labRecordId);
  },
};

// ── Internal Helpers ───────────────────────────────────────────

/**
 * Recalculates subtotal, total_cost, and arrears on a lab record
 * based on its attached tests. Called after adding/removing tests.
 */
async function recalculateRecordTotals(labRecordId: string): Promise<void> {
  const { data: tests, error: testsError } = await supabase
    .from('lab_record_tests')
    .select('test_cost, total_cost')
    .eq('lab_record_id', labRecordId);

  if (testsError) return; // Silent fail — totals will be stale but not crash

  const subtotal = (tests ?? []).reduce((sum, t) => sum + Number(t.test_cost), 0);
  const totalCost = (tests ?? []).reduce((sum, t) => sum + Number(t.total_cost), 0);

  const { data: payments } = await supabase
    .from('payments')
    .select('amount')
    .eq('lab_record_id', labRecordId);

  const amountPaid = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const arrears = Math.max(0, totalCost - amountPaid);

  const { data: record } = await supabase
    .from('lab_records')
    .select('status')
    .eq('id', labRecordId)
    .single();

  let newStatus = record?.status || 'Active';

  // Compute status based on definitions
  if (arrears > 0) {
    newStatus = 'Pending';
  } else {
    // Check if there are pending results
    // First, find all required results count
    let requiredResultsCount = 0;
    
    // We need the tests with parameters to know the required count
    const { data: testsWithParams } = await supabase
      .from('lab_record_tests')
      .select('id, test_id, tests(id)')
      .eq('lab_record_id', labRecordId);

    if (testsWithParams) {
      for (const t of testsWithParams) {
        const { data: params } = await supabase
          .from('test_parameters')
          .select('id')
          .eq('test_id', t.test_id);
        
        requiredResultsCount += (params && params.length > 0) ? params.length : 1;
      }

      // Now get actual results count
      const testIds = testsWithParams.map(t => t.id);
      const { count: actualResultsCount } = await supabase
        .from('test_results')
        .select('*', { count: 'exact', head: true })
        .in('lab_record_test_id', testIds);
      
      if (actualResultsCount !== null && actualResultsCount >= requiredResultsCount) {
        newStatus = 'Closed';
      } else {
        newStatus = 'Active';
      }
    } else {
      // Fallback
      newStatus = 'Active';
    }
  }

  await supabase
    .from('lab_records')
    .update({ subtotal, total_cost: totalCost, amount_paid: amountPaid, arrears, status: newStatus })
    .eq('id', labRecordId);
}
