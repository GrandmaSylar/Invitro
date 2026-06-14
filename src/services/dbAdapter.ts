import { supabase } from '../lib/supabase';
import { 
  mapPatientRow, 
  mapLabRecordRow, 
  mapLabRecordTestRow, 
  mapPaymentRow, 
  mapTestResultRow,
  mapAuditEventRow,
  mapApiKeyRow,
  mapTestRow,
  mapParameterRow,
  mapAntibioticRow,
  mapDepartmentRow
} from '../lib/mappers';
import { useSettingsStore } from '../stores/useSettingsStore';
import type { 
  Patient, 
  PatientFilters, 
  LabRecord, 
  LabRecordTest, 
  LabRecordFilters, 
  Payment, 
  TestResult, 
  ResultFlag,
  AuditEvent,
  AuditFilters,
  AppSettings,
  ApiKey,
  Test,
  Parameter,
  Antibiotic,
  Department,
  TestFilters
} from '../lib/types';

export interface IDatabaseAdapter {
  patients: {
    getPatients: (filters?: PatientFilters) => Promise<Patient[]>;
    getPatientById: (id: string) => Promise<Patient>;
    createPatient: (patientData: Omit<Patient, 'id' | 'createdAt'>) => Promise<Patient>;
    updatePatient: (id: string, patientData: Partial<Omit<Patient, 'id' | 'createdAt'>>) => Promise<Patient>;
    searchPatients: (query: string) => Promise<Patient[]>;
  };
  labRecords: {
    getLabRecords: (filters?: LabRecordFilters) => Promise<LabRecord[]>;
    getLabRecordById: (id: string) => Promise<LabRecord>;
    getLabRecordByLabNumber: (labNumber: string) => Promise<LabRecord>;
    checkLabNumberExists: (labNumber: string) => Promise<boolean>;
    createLabRecord: (recordData: {
      patientId: string;
      labNumber?: string;
      referralOption?: string;
      referralDoctorId?: string;
      referralHospitalId?: string;
      createdById?: string;
    }) => Promise<LabRecord>;
    updateLabRecord: (
      id: string,
      updates: Partial<{
        status: string;
        referralOption: string;
        referralDoctorId: string;
        referralHospitalId: string;
      }>
    ) => Promise<LabRecord>;
    getTestsForRecord: (labRecordId: string) => Promise<LabRecordTest[]>;
    addTestToRecord: (
      labRecordId: string,
      test: { testId: string; testName: string; department: string; testCost: number }
    ) => Promise<LabRecordTest>;
    removeTestFromRecord: (labRecordTestId: string, labRecordId: string) => Promise<void>;
    getPayments: (labRecordId: string) => Promise<Payment[]>;
    recordPayment: (labRecordId: string, amount: number, receivedById?: string) => Promise<Payment>;
    recalculateStatusAndTotals: (labRecordId: string) => Promise<void>;
    generateLabNumber: () => Promise<string>;
    previewLabNumber: () => Promise<string>;
  };
  results: {
    getResultsByLabRecordTest: (labRecordTestId: string) => Promise<TestResult[]>;
    getResultsByLabRecord: (labRecordId: string) => Promise<TestResult[]>;
    enterResult: (resultData: {
      labRecordTestId: string;
      testName: string;
      department: string;
      referenceRange?: string;
      unit?: string;
      result?: string;
      flag?: ResultFlag;
      enteredById?: string;
    }) => Promise<TestResult>;
    updateResult: (
      id: string,
      updates: Partial<{
        result: string;
        flag: ResultFlag;
        referenceRange: string;
        unit: string;
      }>
    ) => Promise<TestResult>;
    bulkEnterResults: (
      results: Array<{
        labRecordTestId: string;
        testName: string;
        department: string;
        referenceRange?: string;
        unit?: string;
        result?: string;
        flag?: ResultFlag;
        enteredById?: string;
      }>
    ) => Promise<TestResult[]>;
    deleteResult: (id: string) => Promise<void>;
  };
  audit: {
    logEvent: (event: Omit<AuditEvent, 'id' | 'timestamp'>) => Promise<void>;
    getEvents: (filters?: AuditFilters) => Promise<AuditEvent[]>;
    getEventsByActor: (actorId: string, limit?: number) => Promise<AuditEvent[]>;
  };
  settings: {
    getSettings: () => Promise<AppSettings>;
    updateSettings: <K extends keyof AppSettings>(section: K, sectionData: AppSettings[K]) => Promise<void>;
    patchSettings: <K extends keyof AppSettings>(section: K, partialData: Partial<AppSettings[K]>) => Promise<void>;
    getApiKeys: () => Promise<ApiKey[]>;
    createApiKey: (keyData: { name: string; key?: string; permissions: string[] }) => Promise<ApiKey>;
    revokeApiKey: (id: string) => Promise<{ success: boolean }>;
    getSyncStatus: () => Promise<Array<{ status: string; count: number }>>;
  };
  catalog: {
    getTests: (filters?: TestFilters) => Promise<Test[]>;
    getTestById: (id: string) => Promise<Test>;
    createTest: (testData: Omit<Test, 'id' | 'createdAt'>) => Promise<Test>;
    updateTest: (id: string, testData: Partial<Omit<Test, 'id' | 'createdAt'>>) => Promise<Test>;
    deleteTest: (id: string) => Promise<void>;
    getDepartments: () => Promise<Department[]>;
    createDepartment: (name: string) => Promise<Department>;
    updateDepartment: (id: string, name: string) => Promise<Department>;
    deleteDepartment: (id: string) => Promise<void>;
    linkParameter: (testId: string, parameterId: string, sortOrder: number) => Promise<void>;
    unlinkParameter: (testId: string, parameterId: string) => Promise<void>;
    previewTestCode: () => Promise<string>;
    previewParameterCode: () => Promise<string>;
    getParameters: () => Promise<Parameter[]>;
    createParameter: (paramData: Omit<Parameter, 'id' | 'createdAt'>) => Promise<Parameter>;
    updateParameter: (id: string, paramData: Partial<Omit<Parameter, 'id' | 'createdAt'>>) => Promise<Parameter>;
    deleteParameter: (id: string) => Promise<void>;
    getAntibiotics: () => Promise<Antibiotic[]>;
    createAntibiotic: (name: string) => Promise<Antibiotic>;
    updateAntibiotic: (id: string, name: string) => Promise<Antibiotic>;
    deleteAntibiotic: (id: string) => Promise<void>;
  };
}

// Internal helper for online recalculations
async function onlineRecalculateRecordTotals(labRecordId: string): Promise<void> {
  const { data: tests, error: testsError } = await supabase
    .from('lab_record_tests')
    .select('test_cost, total_cost')
    .eq('lab_record_id', labRecordId);

  if (testsError) return;

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

  if (arrears > 0) {
    newStatus = 'Pending';
  } else {
    let requiredResultsCount = 0;
    const { data: testsWithParams } = await supabase
      .from('lab_record_tests')
      .select('id, test_id')
      .eq('lab_record_id', labRecordId);

    if (testsWithParams) {
      for (const t of testsWithParams) {
        const { data: params } = await supabase
          .from('test_parameters')
          .select('id')
          .eq('test_id', t.test_id);
        
        requiredResultsCount += (params && params.length > 0) ? params.length : 1;
      }

      const testIds = testsWithParams.map(t => t.id);
      const { count: actualResultsCount } = await supabase
        .from('test_results')
        .select('*', { count: 'exact', head: true })
        .in('lab_record_test_id', testIds)
        .not('result', 'is', null)
        .not('result', 'eq', '');
      
      if (actualResultsCount !== null && actualResultsCount >= requiredResultsCount) {
        newStatus = 'Closed';
      } else {
        newStatus = 'Active';
      }
    } else {
      newStatus = 'Active';
    }
  }

  await supabase
    .from('lab_records')
    .update({ subtotal, total_cost: totalCost, amount_paid: amountPaid, arrears, status: newStatus })
    .eq('id', labRecordId);
}

// Trigger result helper
async function onlineTriggerRecalculate(labRecordTestId: string) {
  try {
    const { data } = await supabase
      .from('lab_record_tests')
      .select('lab_record_id')
      .eq('id', labRecordTestId)
      .single();
      
    if (data?.lab_record_id) {
      await onlineRecalculateRecordTotals(data.lab_record_id);
    }
  } catch (e) {
    console.error('Failed to trigger record recalculation', e);
  }
}

export const dbAdapter: IDatabaseAdapter = {
  patients: {
    getPatients: async (filters) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.getPatients(filters);
      }
      
      let query = supabase
        .from('patients')
        .select('*')
        .order(filters?.sortBy ?? 'created_at', { ascending: filters?.sortDirection === 'asc' });

      if (filters?.search) {
        query = query.or(
          `patient_name.ilike.%${filters.search}%,telephone.ilike.%${filters.search}%`
        );
      }
      if (filters?.gender) {
        query = query.eq('gender', filters.gender);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit ?? 50) - 1);
      }

      const { data, error } = await query;
      if (error) throw new Error(`Failed to fetch patients: ${error.message}`);
      return (data ?? []).map(mapPatientRow);
    },

    getPatientById: async (id) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.getPatientById(id);
      }

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new Error(`Failed to fetch patient: ${error.message}`);
      return mapPatientRow(data);
    },

    createPatient: async (patientData) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.createPatient(patientData);
      }

      const { data, error } = await supabase
        .from('patients')
        .insert({
          patient_name: patientData.patientName,
          gender: patientData.gender ?? null,
          dob: patientData.dob ?? null,
          age: patientData.age ?? null,
          telephone: patientData.telephone ?? null,
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to create patient: ${error.message}`);
      return mapPatientRow(data);
    },

    updatePatient: async (id, patientData) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.updatePatient(id, patientData);
      }

      const updates: Record<string, any> = {};
      if (patientData.patientName !== undefined) updates.patient_name = patientData.patientName;
      if (patientData.gender !== undefined) updates.gender = patientData.gender;
      if (patientData.dob !== undefined) updates.dob = patientData.dob;
      if (patientData.age !== undefined) updates.age = patientData.age;
      if (patientData.telephone !== undefined) updates.telephone = patientData.telephone;

      const { data, error } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(`Failed to update patient: ${error.message}`);
      return mapPatientRow(data);
    },

    searchPatients: async (query) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.searchPatients(query);
      }

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .or(`patient_name.ilike.%${query}%,telephone.ilike.%${query}%,id.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(25);

      if (error) throw new Error(`Failed to search patients: ${error.message}`);
      return (data ?? []).map(mapPatientRow);
    },
  },

  labRecords: {
    getLabRecords: async (filters) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.getLabRecords(filters);
      }

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

    getLabRecordById: async (id) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.getLabRecordById(id);
      }

      const { data, error } = await supabase
        .from('lab_records')
        .select('*, patients(*), lab_record_tests(count)')
        .eq('id', id)
        .single();

      if (error) throw new Error(`Failed to fetch lab record: ${error.message}`);
      return mapLabRecordRow(data);
    },

    getLabRecordByLabNumber: async (labNumber) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.getLabRecordByLabNumber(labNumber);
      }

      const { data, error } = await supabase
        .from('lab_records')
        .select('*, patients(*), lab_record_tests(count)')
        .eq('lab_number', labNumber)
        .single();

      if (error) throw new Error(`Failed to fetch lab record: ${error.message}`);
      return mapLabRecordRow(data);
    },

    checkLabNumberExists: async (labNumber) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.checkLabNumberExists(labNumber);
      }

      const { data, error } = await supabase
        .from('lab_records')
        .select('id')
        .eq('lab_number', labNumber)
        .maybeSingle();
        
      if (error) return false;
      return !!data;
    },

    createLabRecord: async (recordData) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.createLabRecord(recordData);
      }

      const labNumber = recordData.labNumber ?? await dbAdapter.labRecords.generateLabNumber();

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

    updateLabRecord: async (id, updates) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.updateLabRecord(id, updates);
      }

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

    getTestsForRecord: async (labRecordId) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.getTestsForRecord(labRecordId);
      }

      const { data, error } = await supabase
        .from('lab_record_tests')
        .select('*, tests(*, test_parameters(sort_order, parameters(*)))')
        .eq('lab_record_id', labRecordId)
        .order('test_name', { ascending: true });

      if (error) throw new Error(`Failed to fetch record tests: ${error.message}`);
      return (data ?? []).map(mapLabRecordTestRow);
    },

    addTestToRecord: async (labRecordId, test) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.addTestToRecord(labRecordId, test);
      }

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

      await onlineRecalculateRecordTotals(labRecordId);
      return mapLabRecordTestRow(data);
    },

    removeTestFromRecord: async (labRecordTestId, labRecordId) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.removeTestFromRecord(labRecordTestId, labRecordId);
      }

      const { error } = await supabase
        .from('lab_record_tests')
        .delete()
        .eq('id', labRecordTestId);

      if (error) throw new Error(`Failed to remove test from record: ${error.message}`);
      await onlineRecalculateRecordTotals(labRecordId);
    },

    getPayments: async (labRecordId) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.getPayments(labRecordId);
      }

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('lab_record_id', labRecordId)
        .order('payment_date', { ascending: false });

      if (error) throw new Error(`Failed to fetch payments: ${error.message}`);
      return (data ?? []).map(mapPaymentRow);
    },

    recordPayment: async (labRecordId, amount, receivedById) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.recordPayment(labRecordId, amount, receivedById);
      }

      const { data: receiptNumber, error: receiptError } = await supabase.rpc('generate_receipt_number');
      if (receiptError) throw new Error(`Failed to generate receipt: ${receiptError.message}`);

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

      await onlineRecalculateRecordTotals(labRecordId);
      return mapPaymentRow(payment);
    },

    recalculateStatusAndTotals: async (labRecordId) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.recalculateStatusAndTotals(labRecordId);
      }
      await onlineRecalculateRecordTotals(labRecordId);
    },

    generateLabNumber: async () => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.generateLabNumber();
      }

      const { data, error } = await supabase.rpc('generate_lab_number');
      if (error || !data) {
        console.warn('generate_lab_number RPC not available, using fallback:', error?.message);
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const fallbackSeq = String(Math.floor(Math.random() * 9000) + 1000);
        return `A${dateStr}${fallbackSeq}`;
      }
      return data as string;
    },

    previewLabNumber: async () => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.previewLabNumber();
      }

      const { data, error } = await supabase.rpc('preview_lab_number');
      if (error || !data) {
        return dbAdapter.labRecords.generateLabNumber();
      }
      return data as string;
    },
  },

  results: {
    getResultsByLabRecordTest: async (labRecordTestId) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.getResultsByLabRecordTest(labRecordTestId);
      }

      const { data, error } = await supabase
        .from('test_results')
        .select('*')
        .eq('lab_record_test_id', labRecordTestId)
        .order('entered_at', { ascending: true });

      if (error) throw new Error(`Failed to fetch results: ${error.message}`);
      return (data ?? []).map(mapTestResultRow);
    },

    getResultsByLabRecord: async (labRecordId) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.getResultsByLabRecord(labRecordId);
      }

      const { data: recordTests, error: rtError } = await supabase
        .from('lab_record_tests')
        .select('id')
        .eq('lab_record_id', labRecordId);

      if (rtError) throw new Error(`Failed to fetch record tests: ${rtError.message}`);
      if (!recordTests || recordTests.length === 0) return [];

      const ids = recordTests.map((rt: any) => rt.id);
      const { data, error } = await supabase
        .from('test_results')
        .select('*')
        .in('lab_record_test_id', ids)
        .order('entered_at', { ascending: true });

      if (error) throw new Error(`Failed to fetch results: ${error.message}`);
      return (data ?? []).map(mapTestResultRow);
    },

    enterResult: async (resultData) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.enterResult(resultData);
      }

      const { data, error } = await supabase
        .from('test_results')
        .insert({
          lab_record_test_id: resultData.labRecordTestId,
          test_name: resultData.testName,
          department: resultData.department,
          reference_range: resultData.referenceRange ?? null,
          unit: resultData.unit ?? null,
          result: resultData.result ?? null,
          flag: resultData.flag ?? 'Normal',
          entered_by_id: resultData.enteredById ?? null,
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to enter result: ${error.message}`);
      
      await onlineTriggerRecalculate(resultData.labRecordTestId);
      return mapTestResultRow(data);
    },

    updateResult: async (id, updates) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.updateResult(id, updates);
      }

      const { data: existing } = await supabase
        .from('test_results')
        .select('lab_record_test_id')
        .eq('id', id)
        .single();

      const dbUpdates: Record<string, any> = {};
      if (updates.result !== undefined) dbUpdates.result = updates.result;
      if (updates.flag !== undefined) dbUpdates.flag = updates.flag;
      if (updates.referenceRange !== undefined) dbUpdates.reference_range = updates.referenceRange;
      if (updates.unit !== undefined) dbUpdates.unit = updates.unit;

      const { data, error } = await supabase
        .from('test_results')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(`Failed to update result: ${error.message}`);
      
      if (existing?.lab_record_test_id) {
        await onlineTriggerRecalculate(existing.lab_record_test_id);
      }
      return mapTestResultRow(data);
    },

    bulkEnterResults: async (results) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.bulkEnterResults(results);
      }

      const rows = results.map((r) => ({
        lab_record_test_id: r.labRecordTestId,
        test_name: r.testName,
        department: r.department,
        reference_range: r.referenceRange ?? null,
        unit: r.unit ?? null,
        result: r.result ?? null,
        flag: r.flag ?? 'Normal',
        entered_by_id: r.enteredById ?? null,
      }));

      const { data, error } = await supabase
        .from('test_results')
        .insert(rows)
        .select();

      if (error) throw new Error(`Failed to bulk enter results: ${error.message}`);
      
      if (results.length > 0) {
        await onlineTriggerRecalculate(results[0].labRecordTestId);
      }
      
      return (data ?? []).map(mapTestResultRow);
    },

    deleteResult: async (id) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.deleteResult(id);
      }

      const { data: existing } = await supabase
        .from('test_results')
        .select('lab_record_test_id')
        .eq('id', id)
        .single();

      const { error } = await supabase.from('test_results').delete().eq('id', id);
      if (error) throw new Error(`Failed to delete result: ${error.message}`);
      
      if (existing?.lab_record_test_id) {
        await onlineTriggerRecalculate(existing.lab_record_test_id);
      }
    },
  },

  audit: {
    logEvent: async (event) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.logEvent(event);
      }

      const { error } = await supabase
        .from('audit_logs')
        .insert({
          actor_id: event.actorId,
          actor_name: event.actorName,
          action: event.action,
          target_type: event.targetType,
          target_id: event.targetId,
          target_name: event.targetName,
          detail: event.detail ?? '',
        });

      if (error) {
        console.error(`Audit log failed: ${error.message}`);
      }
    },

    getEvents: async (filters) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.getEvents(filters);
      }

      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (filters?.actorId) {
        query = query.eq('actor_id', filters.actorId);
      }
      if (filters?.action) {
        query = query.eq('action', filters.action);
      }
      if (filters?.targetType) {
        query = query.eq('target_type', filters.targetType);
      }
      if (filters?.dateFrom) {
        query = query.gte('timestamp', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('timestamp', filters.dateTo);
      }

      const limit = filters?.limit ?? 100;
      const offset = filters?.offset ?? 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;
      if (error) throw new Error(`Failed to fetch audit events: ${error.message}`);
      return (data ?? []).map(mapAuditEventRow);
    },

    getEventsByActor: async (actorId, limit = 50) => {
      return dbAdapter.audit.getEvents({ actorId, limit });
    },
  },

  settings: {
    getSettings: async () => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.getSettings();
      }

      const { data, error } = await supabase
        .from('system_settings')
        .select('settings')
        .eq('id', 1)
        .single();

      if (error || !data) {
        console.warn('Failed to fetch settings from Supabase, using local store:', error?.message);
        return useSettingsStore.getState().settings;
      }

      return data.settings as AppSettings;
    },

    updateSettings: async (section, sectionData) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        await (window.electronAPI as any).db.updateSettings(section, sectionData);
        useSettingsStore.getState().updateSection(section, sectionData);
        return;
      }

      const currentSettings = await dbAdapter.settings.getSettings();
      const newSettings = { ...currentSettings, [section]: sectionData };

      const { error } = await supabase
        .from('system_settings')
        .update({ settings: newSettings as any, updated_at: new Date().toISOString() })
        .eq('id', 1);

      if (error) throw new Error(`Failed to update settings: ${error.message}`);
      useSettingsStore.getState().updateSection(section, sectionData);
    },

    patchSettings: async (section, partialData) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        await (window.electronAPI as any).db.patchSettings(section, partialData);
        useSettingsStore.getState().patchSection(section, partialData);
        return;
      }

      const currentSettings = await dbAdapter.settings.getSettings();
      const mergedSection = { ...currentSettings[section], ...partialData };
      const newSettings = { ...currentSettings, [section]: mergedSection };

      const { error } = await supabase
        .from('system_settings')
        .update({ settings: newSettings as any, updated_at: new Date().toISOString() })
        .eq('id', 1);

      if (error) throw new Error(`Failed to patch settings: ${error.message}`);
      useSettingsStore.getState().patchSection(section, partialData);
    },

    getApiKeys: async () => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.getApiKeys();
      }

      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Failed to fetch API keys: ${error.message}`);
      return (data ?? []).map(mapApiKeyRow);
    },

    createApiKey: async (keyData) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.createApiKey(keyData);
      }

      const newKey = keyData.key || `bloo_${crypto.randomUUID().replace(/-/g, '')}`;

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          name: keyData.name,
          key: newKey,
          permissions: keyData.permissions as any,
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to create API key: ${error.message}`);
      return mapApiKeyRow(data);
    },

    revokeApiKey: async (id) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.revokeApiKey(id);
      }

      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw new Error(`Failed to revoke API key: ${error.message}`);
      return { success: true };
    },

    getSyncStatus: async () => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.settings.getSyncStatus();
      }
      return [];
    },
  },

  catalog: {
    getTests: async (filters) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.getTests(filters);
      }

      let query = supabase
        .from('tests')
        .select('*')
        .eq('is_active', true)
        .order('test_name', { ascending: true });

      if (filters?.department) {
        query = query.eq('department', filters.department);
      }
      if (filters?.search) {
        query = query.ilike('test_name', `%${filters.search}%`);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw new Error(`Failed to fetch tests: ${error.message}`);
      return (data ?? []).map(mapTestRow);
    },

    getTestById: async (id) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.getTestById(id);
      }

      const { data, error } = await supabase
        .from('tests')
        .select('*, test_parameters(sort_order, parameter_id, parameters(*))')
        .eq('id', id)
        .maybeSingle();

      if (error) throw new Error(`Failed to fetch test: ${error.message}`);
      if (!data) throw new Error(`Test not found`);

      const test = mapTestRow(data);
      test.parameters = (data.test_parameters ?? [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((tp: any) => mapParameterRow(tp.parameters));

      return test;
    },

    createTest: async (testData) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.createTest(testData);
      }

      const { data, error } = await supabase
        .from('tests')
        .insert({
          test_name: testData.testName,
          test_code: testData.testCode ?? null,
          department: testData.department,
          test_cost: testData.testCost,
          result_header: testData.resultHeader ?? null,
          include_comprehensive: testData.includeComprehensive ?? false,
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to create test: ${error.message}`);
      return mapTestRow(data);
    },

    updateTest: async (id, testData) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.updateTest(id, testData);
      }

      const updates: Record<string, any> = {};
      if (testData.testName !== undefined) updates.test_name = testData.testName;
      if (testData.testCode !== undefined) updates.test_code = testData.testCode;
      if (testData.department !== undefined) updates.department = testData.department;
      if (testData.testCost !== undefined) updates.test_cost = testData.testCost;
      if (testData.resultHeader !== undefined) updates.result_header = testData.resultHeader;
      if (testData.includeComprehensive !== undefined) updates.include_comprehensive = testData.includeComprehensive;

      const { data, error } = await supabase
        .from('tests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(`Failed to update test: ${error.message}`);
      return mapTestRow(data);
    },

    deleteTest: async (id) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.deleteTest(id);
      }

      const { error } = await supabase.from('tests').update({ is_active: false }).eq('id', id);
      if (error) throw new Error(`Failed to delete test: ${error.message}`);
    },

    getDepartments: async () => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.getDepartments();
      }

      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('department_name', { ascending: true });

      if (error) throw new Error(`Failed to fetch departments: ${error.message}`);
      return (data ?? []).map(mapDepartmentRow);
    },

    createDepartment: async (name) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.createDepartment(name);
      }

      const { data, error } = await supabase
        .from('departments')
        .insert({ department_name: name })
        .select()
        .single();

      if (error) throw new Error(`Failed to create department: ${error.message}`);
      return mapDepartmentRow(data);
    },

    updateDepartment: async (id, name) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.updateDepartment(id, name);
      }

      const { data, error } = await supabase
        .from('departments')
        .update({ department_name: name })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(`Failed to update department: ${error.message}`);
      return mapDepartmentRow(data);
    },

    deleteDepartment: async (id) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.deleteDepartment(id);
      }

      const { error } = await supabase.from('departments').update({ is_active: false }).eq('id', id);
      if (error) throw new Error(`Failed to delete department: ${error.message}`);
    },

    linkParameter: async (testId, parameterId, sortOrder) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.linkParameter(testId, parameterId, sortOrder);
      }

      const { error } = await supabase
        .from('test_parameters')
        .insert({ test_id: testId, parameter_id: parameterId, sort_order: sortOrder });

      if (error) throw new Error(`Failed to link parameter: ${error.message}`);
    },

    unlinkParameter: async (testId, parameterId) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.unlinkParameter(testId, parameterId);
      }

      const { error } = await supabase
        .from('test_parameters')
        .delete()
        .eq('test_id', testId)
        .eq('parameter_id', parameterId);

      if (error) throw new Error(`Failed to unlink parameter: ${error.message}`);
    },

    previewTestCode: async () => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.previewTestCode();
      }

      const { data, error } = await supabase.rpc('generate_next_test_code');
      if (error) throw new Error(`Failed to preview test code: ${error.message}`);
      return data;
    },

    previewParameterCode: async () => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.previewParameterCode();
      }

      const { data, error } = await supabase.rpc('generate_next_parameter_code');
      if (error) throw new Error(`Failed to preview parameter code: ${error.message}`);
      return data;
    },

    getParameters: async () => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.getParameters();
      }

      const { data, error } = await supabase
        .from('parameters')
        .select('*')
        .eq('is_active', true)
        .order('parameter_code', { ascending: true });

      if (error) throw new Error(`Failed to fetch parameters: ${error.message}`);
      return (data ?? []).map(mapParameterRow);
    },

    createParameter: async (paramData) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.createParameter(paramData);
      }

      const { data, error } = await supabase
        .from('parameters')
        .insert({
          parameter_name: paramData.parameterName,
          units: paramData.units ?? null,
          reference_range: paramData.referenceRange ?? null,
          trimester_type: paramData.trimesterType ?? null,
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to create parameter: ${error.message}`);
      return mapParameterRow(data);
    },

    updateParameter: async (id, paramData) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.updateParameter(id, paramData);
      }

      const updates: Record<string, any> = {};
      if (paramData.parameterName !== undefined) updates.parameter_name = paramData.parameterName;
      if (paramData.units !== undefined) updates.units = paramData.units;
      if (paramData.referenceRange !== undefined) updates.reference_range = paramData.referenceRange;
      if (paramData.trimesterType !== undefined) updates.trimester_type = paramData.trimesterType;

      const { data, error } = await supabase
        .from('parameters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(`Failed to update parameter: ${error.message}`);
      return mapParameterRow(data);
    },

    deleteParameter: async (id) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.deleteParameter(id);
      }

      const { error } = await supabase.from('parameters').update({ is_active: false }).eq('id', id);
      if (error) throw new Error(`Failed to delete parameter: ${error.message}`);
    },

    getAntibiotics: async () => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.getAntibiotics();
      }

      const { data, error } = await supabase
        .from('antibiotics')
        .select('*')
        .eq('is_active', true)
        .order('antibiotic_name', { ascending: true });

      if (error) throw new Error(`Failed to fetch antibiotics: ${error.message}`);
      return (data ?? []).map(mapAntibioticRow);
    },

    createAntibiotic: async (name) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.createAntibiotic(name);
      }

      const { data, error } = await supabase
        .from('antibiotics')
        .insert({ antibiotic_name: name })
        .select()
        .single();

      if (error) throw new Error(`Failed to create antibiotic: ${error.message}`);
      return mapAntibioticRow(data);
    },

    updateAntibiotic: async (id, name) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.updateAntibiotic(id, name);
      }

      const { data, error } = await supabase
        .from('antibiotics')
        .update({ antibiotic_name: name })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(`Failed to update antibiotic: ${error.message}`);
      return mapAntibioticRow(data);
    },

    deleteAntibiotic: async (id) => {
      if (window.electronAPI && (window.electronAPI as any).db) {
        return (window.electronAPI as any).db.deleteAntibiotic(id);
      }

      const { error } = await supabase.from('antibiotics').update({ is_active: false }).eq('id', id);
      if (error) throw new Error(`Failed to delete antibiotic: ${error.message}`);
    },
  },
};
