import crypto from 'node:crypto';
import sql from 'mssql';
import log from 'electron-log/main';
import bcrypt from 'bcryptjs';
import { getPool } from './mssqlManager.js';

// ── Helper Mappers ──────────────────────────────────────────────

function mapHospital(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    hospitalName: row.hospital_name,
    location: row.location || undefined,
    phoneNumber: row.phone_number || undefined,
    address: row.address || undefined,
    createdAt: row.created_at,
  };
}

function mapDoctor(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    doctorName: row.doctor_name,
    speciality: row.speciality || undefined,
    phoneNumber: row.phone_number || undefined,
    email: row.email || undefined,
    affiliateHospitalId: row.affiliate_hospital_id || undefined,
    location: row.location || undefined,
    address: row.address || undefined,
    createdAt: row.created_at,
  };
}

function mapPatient(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    patientName: row.patient_name,
    gender: row.gender || undefined,
    dob: row.dob || undefined,
    age: row.age !== null && row.age !== undefined ? Number(row.age) : undefined,
    telephone: row.telephone || undefined,
    createdAt: row.created_at,
  };
}

function mapRole(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    label: row.label,
    description: row.description || undefined,
    isSystem: !!row.is_system,
    permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions) : row.permissions || {},
    createdAt: row.created_at,
  };
}

function mapUser(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    username: row.username,
    phone: row.phone || undefined,
    roleId: row.role_id,
    permissionOverrides: typeof row.permission_overrides === 'string' ? JSON.parse(row.permission_overrides) : row.permission_overrides || {},
    themePreset: row.theme_preset || 'default',
    twoFactorEnabled: !!row.two_factor_enabled,
    twoFactorMethod: row.two_factor_method || undefined,
    status: row.status || 'active',
    lastLogin: row.last_login || undefined,
    createdAt: row.created_at,
  };
}

function mapTest(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    testName: row.test_name,
    testCode: row.test_code || undefined,
    department: row.department,
    testCost: Number(row.test_cost),
    resultHeader: row.result_header || undefined,
    includeComprehensive: !!row.include_comprehensive,
    isActive: !!row.is_active,
    createdAt: row.created_at,
  };
}

function mapParameter(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    parameterName: row.parameter_name,
    units: row.units || undefined,
    referenceRange: row.reference_range || undefined,
    parameterCode: row.parameter_code || undefined,
    trimesterType: row.trimester_type || undefined,
    isActive: !!row.is_active,
    createdAt: row.created_at,
  };
}

function mapAntibiotic(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    antibioticName: row.antibiotic_name,
    isActive: !!row.is_active,
    createdAt: row.created_at,
  };
}

function mapDepartment(row: any) {
  if (!row) return null;
  return {
    id: row.id || row.department_name,
    departmentName: row.department_name,
    isActive: row.is_active !== undefined ? !!row.is_active : true,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapLabRecord(row: any, patientRow?: any, testCount?: number) {
  if (!row) return null;
  return {
    id: row.id,
    labNumber: row.lab_number,
    patientId: row.patient_id,
    recordDate: row.record_date,
    status: row.status || 'active',
    referralOption: row.referral_option || undefined,
    referralDoctorId: row.referral_doctor_id || undefined,
    referralHospitalId: row.referral_hospital_id || undefined,
    subtotal: Number(row.subtotal),
    totalCost: Number(row.total_cost),
    amountPaid: Number(row.amount_paid),
    arrears: Number(row.arrears),
    createdById: row.created_by_id || undefined,
    createdAt: row.created_at,
    patient: patientRow ? mapPatient(patientRow) : undefined,
    testCount: testCount !== undefined ? testCount : undefined,
  };
}

function mapLabRecordTest(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    labRecordId: row.lab_record_id,
    testId: row.test_id,
    testName: row.test_name,
    department: row.department,
    testCost: Number(row.test_cost),
    totalCost: Number(row.total_cost),
    amountPaid: Number(row.amount_paid),
    arrears: Number(row.arrears),
  };
}

function mapPayment(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    labRecordId: row.lab_record_id,
    amount: Number(row.amount),
    paymentDate: row.payment_date,
    receivedById: row.received_by_id || undefined,
  };
}

function mapTestResult(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    labRecordTestId: row.lab_record_test_id,
    testName: row.test_name,
    department: row.department,
    referenceRange: row.reference_range || undefined,
    unit: row.unit || undefined,
    result: row.result || undefined,
    flag: row.flag || 'Normal',
    enteredById: row.entered_by_id || undefined,
    enteredAt: row.entered_at,
  };
}

function mapAuditEvent(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    timestamp: row.timestamp,
    actorId: row.actor_id,
    actorName: row.actor_name,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    targetName: row.target_name,
    detail: row.detail || '',
  };
}

function mapApiKey(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    key: row.key,
    createdAt: row.created_at,
    lastUsed: row.last_used || undefined,
    permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions) : row.permissions || [],
  };
}

// ── Sequence Generation & Recalculation ─────────────────────────

async function generateMssqlLabNumber(): Promise<string> {
  const pool = await getPool();
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  const datePrefix = `A${day}${month}${year}`;

  const req = pool.request();
  req.input('pattern', sql.NVarChar(50), `${datePrefix}-%`);
  const res = await req.query(`
    SELECT COUNT(*) AS [count] FROM lab_records WHERE lab_number LIKE @pattern
  `);
  const nextSeq = (res.recordset[0]?.count || 0) + 1;
  return `${datePrefix}-${String(nextSeq).padStart(4, '0')}`;
}

async function recalculateMssqlRecordTotals(labRecordId: string): Promise<void> {
  const pool = await getPool();

  const reqTests = pool.request();
  reqTests.input('rec_id', sql.VarChar(100), labRecordId);
  const testsRes = await reqTests.query('SELECT test_cost FROM lab_record_tests WHERE lab_record_id = @rec_id');
  const totalCost = testsRes.recordset.reduce((sum: number, t: any) => sum + Number(t.test_cost), 0);

  const reqPay = pool.request();
  reqPay.input('rec_id', sql.VarChar(100), labRecordId);
  const payRes = await reqPay.query('SELECT amount FROM payments WHERE lab_record_id = @rec_id');
  const amountPaid = payRes.recordset.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const arrears = Math.max(0, totalCost - amountPaid);

  const reqStatus = pool.request();
  reqStatus.input('rec_id', sql.VarChar(100), labRecordId);
  const recRes = await reqStatus.query('SELECT status FROM lab_records WHERE id = @rec_id');
  let newStatus = recRes.recordset[0]?.status || 'active';

  if (arrears > 0) {
    newStatus = 'Pending';
  } else {
    // Check if test results exist
    const reqResults = pool.request();
    reqResults.input('rec_id', sql.VarChar(100), labRecordId);
    const countRes = await reqResults.query(`
      SELECT 
        (SELECT COUNT(*) FROM lab_record_tests WHERE lab_record_id = @rec_id) AS test_count,
        (SELECT COUNT(*) FROM test_results tr JOIN lab_record_tests lrt ON tr.lab_record_test_id = lrt.id WHERE lrt.lab_record_id = @rec_id) AS result_count
    `);
    const tc = countRes.recordset[0]?.test_count || 0;
    const rc = countRes.recordset[0]?.result_count || 0;
    if (tc > 0 && rc >= tc) {
      newStatus = 'Completed';
    }
  }

  const updateReq = pool.request();
  updateReq.input('rec_id', sql.VarChar(100), labRecordId);
  updateReq.input('subtotal', sql.Decimal(18, 2), totalCost);
  updateReq.input('total_cost', sql.Decimal(18, 2), totalCost);
  updateReq.input('amount_paid', sql.Decimal(18, 2), amountPaid);
  updateReq.input('arrears', sql.Decimal(18, 2), arrears);
  updateReq.input('status', sql.NVarChar(50), newStatus);
  await updateReq.query(`
    UPDATE lab_records
    SET subtotal = @subtotal, total_cost = @total_cost, amount_paid = @amount_paid, arrears = @arrears, status = @status, updated_at = GETDATE()
    WHERE id = @rec_id;
  `);
}

// ── Service Handlers ────────────────────────────────────────────

export const dbHandlers: Record<string, Record<string, Function>> = {
  patients: {
    getPatients: async (filters: any = {}) => {
      const pool = await getPool();
      const req = pool.request();
      let sqlQuery = 'SELECT * FROM patients WHERE 1=1';

      if (filters.query) {
        req.input('search', sql.NVarChar(200), `%${filters.query}%`);
        sqlQuery += ' AND (patient_name LIKE @search OR telephone LIKE @search)';
      }
      if (filters.gender) {
        req.input('gender', sql.NVarChar(50), filters.gender);
        sqlQuery += ' AND gender = @gender';
      }
      sqlQuery += ' ORDER BY created_at DESC';

      const res = await req.query(sqlQuery);
      return res.recordset.map(mapPatient);
    },

    getPatientById: async (id: string) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      const res = await req.query('SELECT * FROM patients WHERE id = @id');
      if (res.recordset.length === 0) throw new Error('Patient not found');
      return mapPatient(res.recordset[0]);
    },

    createPatient: async (patientData: any) => {
      const pool = await getPool();
      const id = patientData.id || crypto.randomUUID();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      req.input('patient_name', sql.NVarChar(200), patientData.patientName);
      req.input('gender', sql.NVarChar(50), patientData.gender || null);
      req.input('dob', sql.NVarChar(50), patientData.dob || null);
      req.input('age', sql.Int, patientData.age !== undefined ? Number(patientData.age) : null);
      req.input('telephone', sql.NVarChar(50), patientData.telephone || null);

      await req.query(`
        INSERT INTO patients (id, patient_name, gender, dob, age, telephone, created_at, updated_at)
        VALUES (@id, @patient_name, @gender, @dob, @age, @telephone, GETDATE(), GETDATE());
      `);

      const getReq = pool.request();
      getReq.input('id', sql.VarChar(100), id);
      const res = await getReq.query('SELECT * FROM patients WHERE id = @id');
      return mapPatient(res.recordset[0]);
    },

    updatePatient: async (id: string, patientData: any) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      
      const setClauses: string[] = [];

      if (patientData.patientName !== undefined) {
        req.input('patient_name', sql.NVarChar(200), patientData.patientName || null);
        setClauses.push('patient_name = @patient_name');
      }
      if (patientData.gender !== undefined) {
        req.input('gender', sql.NVarChar(50), patientData.gender || null);
        setClauses.push('gender = @gender');
      }
      if (patientData.dob !== undefined) {
        req.input('dob', sql.NVarChar(50), patientData.dob || null);
        setClauses.push('dob = @dob');
      }
      if (patientData.age !== undefined) {
        req.input('age', sql.Int, (patientData.age !== null && patientData.age !== undefined && patientData.age !== '') ? Number(patientData.age) : null);
        setClauses.push('age = @age');
      }
      if (patientData.telephone !== undefined) {
        req.input('telephone', sql.NVarChar(50), patientData.telephone || null);
        setClauses.push('telephone = @telephone');
      }

      setClauses.push('updated_at = GETDATE()');

      if (setClauses.length > 1) {
        await req.query(`
          UPDATE patients
          SET ${setClauses.join(', ')}
          WHERE id = @id;
        `);
      }

      const getReq = pool.request();
      getReq.input('id', sql.VarChar(100), id);
      const res = await getReq.query('SELECT * FROM patients WHERE id = @id');
      return mapPatient(res.recordset[0]);
    },

    searchPatients: async (query: string) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('search', sql.NVarChar(200), `%${query}%`);
      const res = await req.query(`
        SELECT TOP (20) * FROM patients
        WHERE patient_name LIKE @search OR telephone LIKE @search
        ORDER BY created_at DESC;
      `);
      return res.recordset.map(mapPatient);
    }
  },

  labRecords: {
    getLabRecords: async (filters: any = {}) => {
      const pool = await getPool();
      const req = pool.request();
      let sqlQuery = `
        SELECT r.*, 
               p.patient_name, p.gender, p.dob, p.age, p.telephone,
               (SELECT COUNT(*) FROM lab_record_tests WHERE lab_record_id = r.id) AS test_count
        FROM lab_records r
        LEFT JOIN patients p ON r.patient_id = p.id
        WHERE 1=1
      `;

      if (filters.patientId) {
        req.input('pid', sql.VarChar(100), filters.patientId);
        sqlQuery += ' AND r.patient_id = @pid';
      }
      if (filters.status) {
        req.input('status', sql.NVarChar(50), filters.status);
        sqlQuery += ' AND r.status = @status';
      }
      if (filters.labNumber) {
        req.input('lab_num', sql.NVarChar(50), `%${filters.labNumber}%`);
        sqlQuery += ' AND r.lab_number LIKE @lab_num';
      }

      sqlQuery += ' ORDER BY r.record_date DESC';
      const res = await req.query(sqlQuery);
      return res.recordset.map((r: any) => mapLabRecord(r, r, r.test_count));
    },

    getLabRecordById: async (id: string) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      const res = await req.query(`
        SELECT r.*, p.patient_name, p.gender, p.dob, p.age, p.telephone,
               (SELECT COUNT(*) FROM lab_record_tests WHERE lab_record_id = r.id) AS test_count
        FROM lab_records r
        LEFT JOIN patients p ON r.patient_id = p.id
        WHERE r.id = @id;
      `);
      if (res.recordset.length === 0) throw new Error('Lab record not found');
      const r = res.recordset[0];
      return mapLabRecord(r, r, r.test_count);
    },

    getLabRecordByLabNumber: async (labNumber: string) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('num', sql.NVarChar(50), labNumber);
      const res = await req.query(`
        SELECT r.*, p.patient_name, p.gender, p.dob, p.age, p.telephone,
               (SELECT COUNT(*) FROM lab_record_tests WHERE lab_record_id = r.id) AS test_count
        FROM lab_records r
        LEFT JOIN patients p ON r.patient_id = p.id
        WHERE r.lab_number = @num;
      `);
      if (res.recordset.length === 0) throw new Error('Lab record not found');
      const r = res.recordset[0];
      return mapLabRecord(r, r, r.test_count);
    },

    checkLabNumberExists: async (labNumber: string) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('num', sql.NVarChar(50), labNumber);
      const res = await req.query('SELECT COUNT(*) AS [count] FROM lab_records WHERE lab_number = @num');
      return (res.recordset[0]?.count || 0) > 0;
    },

    createLabRecord: async (recordData: any) => {
      const pool = await getPool();
      const id = recordData.id || crypto.randomUUID();
      const labNumber = recordData.labNumber || await generateMssqlLabNumber();

      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      req.input('lab_number', sql.NVarChar(50), labNumber);
      req.input('patient_id', sql.VarChar(100), recordData.patientId);
      req.input('referral_option', sql.NVarChar(50), recordData.referralOption || null);
      req.input('referral_doctor_id', sql.VarChar(100), recordData.referralDoctorId || null);
      req.input('referral_hospital_id', sql.VarChar(100), recordData.referralHospitalId || null);
      req.input('created_by_id', sql.VarChar(100), recordData.createdById || null);

      await req.query(`
        INSERT INTO lab_records (
          id, lab_number, patient_id, record_date, status, 
          referral_option, referral_doctor_id, referral_hospital_id,
          subtotal, total_cost, amount_paid, arrears, created_by_id, created_at, updated_at
        )
        VALUES (
          @id, @lab_number, @patient_id, GETDATE(), 'Pending',
          @referral_option, @referral_doctor_id, @referral_hospital_id,
          0, 0, 0, 0, @created_by_id, GETDATE(), GETDATE()
        );
      `);

      return await dbHandlers.labRecords.getLabRecordById(id);
    },

    updateLabRecord: async (id: string, updates: any) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      req.input('status', sql.NVarChar(50), updates.status || null);
      req.input('referral_option', sql.NVarChar(50), updates.referralOption || null);
      req.input('referral_doctor_id', sql.VarChar(100), updates.referralDoctorId || null);
      req.input('referral_hospital_id', sql.VarChar(100), updates.referralHospitalId || null);

      await req.query(`
        UPDATE lab_records
        SET 
          status = COALESCE(@status, status),
          referral_option = COALESCE(@referral_option, referral_option),
          referral_doctor_id = COALESCE(@referral_doctor_id, referral_doctor_id),
          referral_hospital_id = COALESCE(@referral_hospital_id, referral_hospital_id),
          updated_at = GETDATE()
        WHERE id = @id;
      `);

      return await dbHandlers.labRecords.getLabRecordById(id);
    },

    getTestsForRecord: async (labRecordId: string) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('rec_id', sql.VarChar(100), labRecordId);
      const res = await req.query('SELECT * FROM lab_record_tests WHERE lab_record_id = @rec_id');
      return res.recordset.map(mapLabRecordTest);
    },

    addTestToRecord: async (labRecordId: string, test: any) => {
      const pool = await getPool();
      const id = crypto.randomUUID();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      req.input('lab_record_id', sql.VarChar(100), labRecordId);
      req.input('test_id', sql.VarChar(100), test.testId);
      req.input('test_name', sql.NVarChar(200), test.testName);
      req.input('department', sql.NVarChar(100), test.department);
      req.input('test_cost', sql.Decimal(18, 4), Number(test.testCost));

      await req.query(`
        INSERT INTO lab_record_tests (id, lab_record_id, test_id, test_name, department, test_cost, total_cost, amount_paid, arrears)
        VALUES (@id, @lab_record_id, @test_id, @test_name, @department, @test_cost, @test_cost, 0, @test_cost);
      `);

      await recalculateMssqlRecordTotals(labRecordId);

      const getReq = pool.request();
      getReq.input('id', sql.VarChar(100), id);
      const res = await getReq.query('SELECT * FROM lab_record_tests WHERE id = @id');
      return mapLabRecordTest(res.recordset[0]);
    },

    removeTestFromRecord: async (labRecordTestId: string, labRecordId: string) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('id', sql.VarChar(100), labRecordTestId);
      await req.query('DELETE FROM lab_record_tests WHERE id = @id');
      await recalculateMssqlRecordTotals(labRecordId);
    },

    getPayments: async (labRecordId: string) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('rec_id', sql.VarChar(100), labRecordId);
      const res = await req.query('SELECT * FROM payments WHERE lab_record_id = @rec_id ORDER BY payment_date ASC');
      return res.recordset.map(mapPayment);
    },

    recordPayment: async (labRecordId: string, amount: number, receivedById?: string) => {
      const pool = await getPool();
      const id = crypto.randomUUID();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      req.input('rec_id', sql.VarChar(100), labRecordId);
      req.input('amount', sql.Decimal(18, 4), amount);
      req.input('recv_id', sql.VarChar(100), receivedById || null);

      await req.query(`
        INSERT INTO payments (id, lab_record_id, amount, payment_date, received_by_id)
        VALUES (@id, @rec_id, @amount, GETDATE(), @recv_id);
      `);

      await recalculateMssqlRecordTotals(labRecordId);

      const getReq = pool.request();
      getReq.input('id', sql.VarChar(100), id);
      const res = await getReq.query('SELECT * FROM payments WHERE id = @id');
      return mapPayment(res.recordset[0]);
    },

    recalculateStatusAndTotals: async (labRecordId: string) => {
      await recalculateMssqlRecordTotals(labRecordId);
    },

    generateLabNumber: async () => {
      return await generateMssqlLabNumber();
    },

    previewLabNumber: async () => {
      return await generateMssqlLabNumber();
    }
  },

  results: {
    getResultsByLabRecordTest: async (labRecordTestId: string) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('lrt_id', sql.VarChar(100), labRecordTestId);
      const res = await req.query('SELECT * FROM test_results WHERE lab_record_test_id = @lrt_id');
      return res.recordset.map(mapTestResult);
    },

    getResultsByLabRecord: async (labRecordId: string) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('rec_id', sql.VarChar(100), labRecordId);
      const res = await req.query(`
        SELECT tr.*
        FROM test_results tr
        JOIN lab_record_tests lrt ON tr.lab_record_test_id = lrt.id
        WHERE lrt.lab_record_id = @rec_id
      `);
      return res.recordset.map(mapTestResult);
    },

    enterResult: async (resultData: any) => {
      const pool = await getPool();
      const id = crypto.randomUUID();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      req.input('lrt_id', sql.VarChar(100), resultData.labRecordTestId);
      req.input('test_name', sql.NVarChar(200), resultData.testName);
      req.input('department', sql.NVarChar(100), resultData.department);
      req.input('ref_range', sql.NVarChar(200), resultData.referenceRange || null);
      req.input('unit', sql.NVarChar(50), resultData.unit || null);
      req.input('result', sql.NVarChar(sql.MAX), resultData.result || null);
      req.input('flag', sql.NVarChar(50), resultData.flag || 'Normal');
      req.input('entered_by', sql.VarChar(100), resultData.enteredById || null);

      await req.query(`
        INSERT INTO test_results (id, lab_record_test_id, test_name, department, reference_range, unit, result, flag, entered_by_id, entered_at)
        VALUES (@id, @lrt_id, @test_name, @department, @ref_range, @unit, @result, @flag, @entered_by, GETDATE());
      `);

      const getReq = pool.request();
      getReq.input('id', sql.VarChar(100), id);
      const res = await getReq.query('SELECT * FROM test_results WHERE id = @id');
      return mapTestResult(res.recordset[0]);
    },

    updateResult: async (id: string, updates: any) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      req.input('result', sql.NVarChar(sql.MAX), updates.result !== undefined ? updates.result : null);
      req.input('flag', sql.NVarChar(50), updates.flag || null);
      req.input('ref_range', sql.NVarChar(200), updates.referenceRange || null);
      req.input('unit', sql.NVarChar(50), updates.unit || null);

      await req.query(`
        UPDATE test_results
        SET 
          result = COALESCE(@result, result),
          flag = COALESCE(@flag, flag),
          reference_range = COALESCE(@ref_range, reference_range),
          unit = COALESCE(@unit, unit)
        WHERE id = @id;
      `);

      const getReq = pool.request();
      getReq.input('id', sql.VarChar(100), id);
      const res = await getReq.query('SELECT * FROM test_results WHERE id = @id');
      return mapTestResult(res.recordset[0]);
    },

    bulkEnterResults: async (results: any[]) => {
      const pool = await getPool();
      const output: any[] = [];

      for (const r of results) {
        const id = crypto.randomUUID();
        const req = pool.request();
        req.input('id', sql.VarChar(100), id);
        req.input('lrt_id', sql.VarChar(100), r.labRecordTestId);
        req.input('test_name', sql.NVarChar(200), r.testName);
        req.input('department', sql.NVarChar(100), r.department);
        req.input('ref_range', sql.NVarChar(200), r.referenceRange || null);
        req.input('unit', sql.NVarChar(50), r.unit || null);
        req.input('result', sql.NVarChar(sql.MAX), r.result || null);
        req.input('flag', sql.NVarChar(50), r.flag || 'Normal');
        req.input('entered_by', sql.VarChar(100), r.enteredById || null);

        await req.query(`
          INSERT INTO test_results (id, lab_record_test_id, test_name, department, reference_range, unit, result, flag, entered_by_id, entered_at)
          VALUES (@id, @lrt_id, @test_name, @department, @ref_range, @unit, @result, @flag, @entered_by, GETDATE());
        `);

        const getReq = pool.request();
        getReq.input('id', sql.VarChar(100), id);
        const res = await getReq.query('SELECT * FROM test_results WHERE id = @id');
        output.push(mapTestResult(res.recordset[0]));
      }

      return output;
    },

    deleteResult: async (id: string) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      await req.query('DELETE FROM test_results WHERE id = @id');
    }
  },

  audit: {
    logEvent: async (event: any) => {
      try {
        const pool = await getPool();
        const id = crypto.randomUUID();
        const req = pool.request();
        req.input('id', sql.VarChar(100), id);
        req.input('actor_id', sql.VarChar(100), event.actorId);
        req.input('actor_name', sql.NVarChar(200), event.actorName);
        req.input('action', sql.NVarChar(100), event.action);
        req.input('target_type', sql.NVarChar(100), event.targetType);
        req.input('target_id', sql.VarChar(100), event.targetId);
        req.input('target_name', sql.NVarChar(200), event.targetName);
        req.input('detail', sql.NVarChar(sql.MAX), event.detail || '');

        await req.query(`
          INSERT INTO audit_events (id, timestamp, actor_id, actor_name, action, target_type, target_id, target_name, detail)
          VALUES (@id, GETDATE(), @actor_id, @actor_name, @action, @target_type, @target_id, @target_name, @detail);
        `);
      } catch (err: any) {
        log.warn('Audit logging error:', err.message);
      }
    },

    getEvents: async (filters: any = {}) => {
      const pool = await getPool();
      const limit = filters.limit ? Number(filters.limit) : 50;
      const req = pool.request();
      req.input('limit', sql.Int, limit);

      let query = 'SELECT TOP (@limit) * FROM audit_events WHERE 1=1';
      if (filters.action) {
        req.input('action', sql.NVarChar(100), filters.action);
        query += ' AND action = @action';
      }
      if (filters.actorId) {
        req.input('actor_id', sql.VarChar(100), filters.actorId);
        query += ' AND actor_id = @actor_id';
      }
      query += ' ORDER BY timestamp DESC';

      const res = await req.query(query);
      return res.recordset.map(mapAuditEvent);
    },

    getEventsByActor: async (actorId: string, limit = 50) => {
      return await dbHandlers.audit.getEvents({ actorId, limit });
    }
  },

  settings: {
    getSettings: async () => {
      const pool = await getPool();
      const res = await pool.request().query('SELECT * FROM app_settings WHERE id = 1');
      if (res.recordset.length === 0) {
        return {
          general: { appName: 'Invitro LIMS' },
          notifications: {},
          security: {},
          smtp: {},
          receipt: {}
        };
      }
      const r = res.recordset[0];
      return {
        general: typeof r.general === 'string' ? JSON.parse(r.general) : r.general || {},
        notifications: typeof r.notifications === 'string' ? JSON.parse(r.notifications) : r.notifications || {},
        security: typeof r.security === 'string' ? JSON.parse(r.security) : r.security || {},
        smtp: typeof r.smtp === 'string' ? JSON.parse(r.smtp) : r.smtp || {},
        receipt: typeof r.receipt === 'string' ? JSON.parse(r.receipt) : r.receipt || {}
      };
    },

    updateSettings: async (section: string, sectionData: any) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('data', sql.NVarChar(sql.MAX), JSON.stringify(sectionData));
      await req.query(`
        UPDATE app_settings
        SET [${section}] = @data, updated_at = GETDATE()
        WHERE id = 1;
      `);
    },

    patchSettings: async (section: string, partialData: any) => {
      const current = await dbHandlers.settings.getSettings();
      const merged = { ...current[section], ...partialData };
      await dbHandlers.settings.updateSettings(section, merged);
    },

    getApiKeys: async () => {
      const pool = await getPool();
      const res = await pool.request().query('SELECT * FROM api_keys ORDER BY created_at DESC');
      return res.recordset.map(mapApiKey);
    },

    createApiKey: async (keyData: any) => {
      const pool = await getPool();
      const id = crypto.randomUUID();
      const generatedKey = keyData.key || `key_${crypto.randomBytes(16).toString('hex')}`;
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      req.input('name', sql.NVarChar(150), keyData.name);
      req.input('key', sql.NVarChar(255), generatedKey);
      req.input('permissions', sql.NVarChar(sql.MAX), JSON.stringify(keyData.permissions || []));

      await req.query(`
        INSERT INTO api_keys (id, name, [key], created_at, permissions)
        VALUES (@id, @name, @key, GETDATE(), @permissions);
      `);

      const getReq = pool.request();
      getReq.input('id', sql.VarChar(100), id);
      const res = await getReq.query('SELECT * FROM api_keys WHERE id = @id');
      return mapApiKey(res.recordset[0]);
    },

    revokeApiKey: async (id: string) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      await req.query('DELETE FROM api_keys WHERE id = @id');
      return { success: true };
    },

    getSyncStatus: async () => {
      // In direct MSSQL mode, operations execute synchronously; return empty queue
      return [];
    }
  },

  catalog: {
    getTests: async (filters: any = {}) => {
      const pool = await getPool();
      const req = pool.request();
      let query = 'SELECT * FROM tests WHERE is_active = 1';
      if (filters.department) {
        req.input('dept', sql.NVarChar(100), filters.department);
        query += ' AND department = @dept';
      }
      if (filters.query) {
        req.input('q', sql.NVarChar(200), `%${filters.query}%`);
        query += ' AND (test_name LIKE @q OR test_code LIKE @q)';
      }
      query += ' ORDER BY test_name ASC';
      const res = await req.query(query);
      return res.recordset.map(mapTest);
    },

    getTestById: async (id: string) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      const res = await req.query('SELECT * FROM tests WHERE id = @id');
      if (res.recordset.length === 0) throw new Error('Test not found');
      return mapTest(res.recordset[0]);
    },

    createTest: async (testData: any) => {
      const pool = await getPool();
      const id = crypto.randomUUID();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      req.input('name', sql.NVarChar(200), testData.testName);
      req.input('dept', sql.NVarChar(100), testData.department);
      req.input('cost', sql.Decimal(18, 4), Number(testData.testCost || 0));
      req.input('header', sql.NVarChar(200), testData.resultHeader || null);
      req.input('ref', sql.NVarChar(200), testData.referenceRange || null);
      req.input('comp', sql.Bit, testData.includeComprehensive ? 1 : 0);
      req.input('code', sql.NVarChar(50), testData.testCode || null);

      await req.query(`
        INSERT INTO tests (id, test_name, department, test_cost, result_header, reference_range, include_comprehensive, is_active, test_code, created_at, updated_at)
        VALUES (@id, @name, @dept, @cost, @header, @ref, @comp, 1, @code, GETDATE(), GETDATE());
      `);

      return await dbHandlers.catalog.getTestById(id);
    },

    updateTest: async (id: string, testData: any) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      req.input('name', sql.NVarChar(200), testData.testName || null);
      req.input('dept', sql.NVarChar(100), testData.department || null);
      req.input('cost', sql.Decimal(18, 4), testData.testCost !== undefined ? Number(testData.testCost) : null);
      req.input('header', sql.NVarChar(200), testData.resultHeader || null);
      req.input('ref', sql.NVarChar(200), testData.referenceRange || null);
      req.input('comp', sql.Bit, testData.includeComprehensive !== undefined ? (testData.includeComprehensive ? 1 : 0) : null);
      req.input('code', sql.NVarChar(50), testData.testCode || null);

      await req.query(`
        UPDATE tests
        SET 
          test_name = COALESCE(@name, test_name),
          department = COALESCE(@dept, department),
          test_cost = COALESCE(@cost, test_cost),
          result_header = COALESCE(@header, result_header),
          reference_range = COALESCE(@ref, reference_range),
          include_comprehensive = COALESCE(@comp, include_comprehensive),
          test_code = COALESCE(@code, test_code),
          updated_at = GETDATE()
        WHERE id = @id;
      `);

      return await dbHandlers.catalog.getTestById(id);
    },

    deleteTest: async (id: string) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      await req.query('UPDATE tests SET is_active = 0, updated_at = GETDATE() WHERE id = @id');
    },

    getDepartments: async () => {
      const pool = await getPool();
      const res = await pool.request().query('SELECT DISTINCT department AS department_name FROM tests WHERE department IS NOT NULL');
      return res.recordset.map(mapDepartment);
    },

    createDepartment: async (name: string) => {
      return { id: name, departmentName: name, isActive: true, createdAt: new Date().toISOString() };
    },

    getParameters: async (testId?: string) => {
      const pool = await getPool();
      const req = pool.request();
      if (testId) {
        req.input('test_id', sql.VarChar(100), testId);
        const res = await req.query(`
          SELECT p.*, tp.sort_order 
          FROM parameters p
          JOIN test_parameters tp ON p.id = tp.parameter_id
          WHERE tp.test_id = @test_id AND p.is_active = 1
          ORDER BY tp.sort_order ASC
        `);
        return res.recordset.map(mapParameter);
      } else {
        const res = await req.query('SELECT * FROM parameters WHERE is_active = 1 ORDER BY parameter_name ASC');
        return res.recordset.map(mapParameter);
      }
    },

    getParameterById: async (id: string) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      const res = await req.query('SELECT * FROM parameters WHERE id = @id');
      if (res.recordset.length === 0) throw new Error('Parameter not found');
      return mapParameter(res.recordset[0]);
    },

    createParameter: async (paramData: any) => {
      const pool = await getPool();
      const id = crypto.randomUUID();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      req.input('name', sql.NVarChar(200), paramData.parameterName);
      req.input('units', sql.NVarChar(50), paramData.units || null);
      req.input('ref', sql.NVarChar(200), paramData.referenceRange || null);
      req.input('code', sql.NVarChar(50), paramData.parameterCode || null);
      req.input('trimester', sql.NVarChar(50), paramData.trimesterType || null);

      await req.query(`
        INSERT INTO parameters (id, parameter_name, units, reference_range, is_active, parameter_code, trimester_type, created_at, updated_at)
        VALUES (@id, @name, @units, @ref, 1, @code, @trimester, GETDATE(), GETDATE());
      `);

      return await dbHandlers.catalog.getParameterById(id);
    },

    updateParameter: async (id: string, paramData: any) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      req.input('name', sql.NVarChar(200), paramData.parameterName || null);
      req.input('units', sql.NVarChar(50), paramData.units || null);
      req.input('ref', sql.NVarChar(200), paramData.referenceRange || null);
      req.input('code', sql.NVarChar(50), paramData.parameterCode || null);

      await req.query(`
        UPDATE parameters
        SET 
          parameter_name = COALESCE(@name, parameter_name),
          units = COALESCE(@units, units),
          reference_range = COALESCE(@ref, reference_range),
          parameter_code = COALESCE(@code, parameter_code),
          updated_at = GETDATE()
        WHERE id = @id;
      `);

      return await dbHandlers.catalog.getParameterById(id);
    },

    deleteParameter: async (id: string) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      await req.query('UPDATE parameters SET is_active = 0, updated_at = GETDATE() WHERE id = @id');
    },

    linkParameterToTest: async (testId: string, parameterId: string, sortOrder = 0) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('tid', sql.VarChar(100), testId);
      req.input('pid', sql.VarChar(100), parameterId);
      req.input('sort', sql.Int, sortOrder);
      await req.query(`
        IF NOT EXISTS (SELECT * FROM test_parameters WHERE test_id = @tid AND parameter_id = @pid)
        BEGIN
          INSERT INTO test_parameters (test_id, parameter_id, sort_order)
          VALUES (@tid, @pid, @sort);
        END
      `);
    },

    unlinkParameterFromTest: async (testId: string, parameterId: string) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('tid', sql.VarChar(100), testId);
      req.input('pid', sql.VarChar(100), parameterId);
      await req.query('DELETE FROM test_parameters WHERE test_id = @tid AND parameter_id = @pid');
    },

    getAntibiotics: async () => {
      const pool = await getPool();
      const res = await pool.request().query('SELECT * FROM antibiotics WHERE is_active = 1 ORDER BY antibiotic_name ASC');
      return res.recordset.map(mapAntibiotic);
    },

    createAntibiotic: async (name: string) => {
      const pool = await getPool();
      const id = crypto.randomUUID();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      req.input('name', sql.NVarChar(200), name);
      await req.query('INSERT INTO antibiotics (id, antibiotic_name, is_active, created_at, updated_at) VALUES (@id, @name, 1, GETDATE(), GETDATE())');
      return { id, antibioticName: name, isActive: true, createdAt: new Date().toISOString() };
    },

    updateAntibiotic: async (id: string, name: string) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      req.input('name', sql.NVarChar(200), name);
      await req.query('UPDATE antibiotics SET antibiotic_name = @name, updated_at = GETDATE() WHERE id = @id');
      return { id, antibioticName: name, isActive: true, createdAt: new Date().toISOString() };
    },

    deleteAntibiotic: async (id: string) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      await req.query('UPDATE antibiotics SET is_active = 0, updated_at = GETDATE() WHERE id = @id');
    }
  },

  rbac: {
    getRoles: async () => {
      const pool = await getPool();
      const res = await pool.request().query('SELECT * FROM roles ORDER BY name ASC');
      return res.recordset.map(mapRole);
    },

    getRoleById: async (id: string) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      const res = await req.query('SELECT * FROM roles WHERE id = @id');
      if (res.recordset.length === 0) throw new Error('Role not found');
      return mapRole(res.recordset[0]);
    },

    createRole: async (roleData: any) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('id', sql.VarChar(100), roleData.id || roleData.name);
      req.input('name', sql.NVarChar(100), roleData.name);
      req.input('label', sql.NVarChar(150), roleData.label);
      req.input('desc', sql.NVarChar(sql.MAX), roleData.description || null);
      req.input('perms', sql.NVarChar(sql.MAX), JSON.stringify(roleData.permissions || {}));

      await req.query(`
        INSERT INTO roles (id, name, label, description, is_system, permissions, created_at, updated_at)
        VALUES (@id, @name, @label, @desc, 0, @perms, GETDATE(), GETDATE());
      `);

      return await dbHandlers.rbac.getRoleById(roleData.id || roleData.name);
    },

    updateRole: async (id: string, roleData: any) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      req.input('label', sql.NVarChar(150), roleData.label || null);
      req.input('desc', sql.NVarChar(sql.MAX), roleData.description || null);
      req.input('perms', sql.NVarChar(sql.MAX), roleData.permissions ? JSON.stringify(roleData.permissions) : null);

      await req.query(`
        UPDATE roles
        SET 
          label = COALESCE(@label, label),
          description = COALESCE(@desc, description),
          permissions = COALESCE(@perms, permissions),
          updated_at = GETDATE()
        WHERE id = @id;
      `);

      return await dbHandlers.rbac.getRoleById(id);
    },

    deleteRole: async (id: string) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      await req.query('DELETE FROM roles WHERE id = @id AND is_system = 0');
    },

    getUsers: async (filters: any = {}) => {
      const pool = await getPool();
      const req = pool.request();
      let query = 'SELECT * FROM users WHERE 1=1';
      if (filters.status) {
        req.input('status', sql.NVarChar(50), filters.status);
        query += ' AND status = @status';
      }
      if (filters.roleId) {
        req.input('role_id', sql.VarChar(100), filters.roleId);
        query += ' AND role_id = @role_id';
      }
      query += ' ORDER BY full_name ASC';
      const res = await req.query(query);
      return res.recordset.map(mapUser);
    },

    getUserById: async (id: string) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      const res = await req.query('SELECT * FROM users WHERE id = @id');
      if (res.recordset.length === 0) throw new Error('User not found');
      return mapUser(res.recordset[0]);
    },

    createUser: async (userData: any) => {
      const pool = await getPool();
      const id = crypto.randomUUID();
      const passwordHash = await bcrypt.hash(userData.password || 'changeme123', 10);
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      req.input('name', sql.NVarChar(200), userData.fullName);
      req.input('email', sql.NVarChar(200), userData.email);
      req.input('username', sql.NVarChar(100), userData.username);
      req.input('pass', sql.NVarChar(255), passwordHash);
      req.input('phone', sql.NVarChar(50), userData.phone || null);
      req.input('role_id', sql.VarChar(100), userData.roleId);
      req.input('overrides', sql.NVarChar(sql.MAX), JSON.stringify(userData.permissionOverrides || {}));

      await req.query(`
        INSERT INTO users (id, full_name, email, username, password_hash, phone, role_id, permission_overrides, status, created_at, updated_at)
        VALUES (@id, @name, @email, @username, @pass, @phone, @role_id, @overrides, 'active', GETDATE(), GETDATE());
      `);

      return await dbHandlers.rbac.getUserById(id);
    },

    updateUser: async (id: string, userData: any) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      req.input('name', sql.NVarChar(200), userData.fullName || null);
      req.input('phone', sql.NVarChar(50), userData.phone || null);
      req.input('role_id', sql.VarChar(100), userData.roleId || null);
      req.input('status', sql.NVarChar(50), userData.status || null);
      req.input('theme', sql.NVarChar(50), userData.themePreset || null);
      req.input('overrides', sql.NVarChar(sql.MAX), userData.permissionOverrides ? JSON.stringify(userData.permissionOverrides) : null);

      let passHash = null;
      if (userData.password) {
        passHash = await bcrypt.hash(userData.password, 10);
      }
      req.input('pass', sql.NVarChar(255), passHash);

      await req.query(`
        UPDATE users
        SET 
          full_name = COALESCE(@name, full_name),
          phone = COALESCE(@phone, phone),
          role_id = COALESCE(@role_id, role_id),
          status = COALESCE(@status, status),
          theme_preset = COALESCE(@theme, theme_preset),
          permission_overrides = COALESCE(@overrides, permission_overrides),
          password_hash = COALESCE(@pass, password_hash),
          updated_at = GETDATE()
        WHERE id = @id;
      `);

      return await dbHandlers.rbac.getUserById(id);
    },

    deleteUser: async (id: string) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      await req.query("UPDATE users SET status = 'inactive', updated_at = GETDATE() WHERE id = @id");
    },

    authenticate: async (login: string, password: string) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('login', sql.NVarChar(200), login);

      const res = await req.query(`
        SELECT u.*, r.permissions AS role_permissions
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE (u.email = @login OR u.username = @login) AND u.status = 'active'
      `);

      if (res.recordset.length === 0) {
        throw new Error('Invalid username or password');
      }

      const user = res.recordset[0];
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        throw new Error('Invalid username or password');
      }

      // Update last_login timestamp upon successful authentication
      const nowIso = new Date().toISOString();
      try {
        const updateReq = pool.request();
        updateReq.input('id', sql.VarChar(100), user.id);
        updateReq.input('last_login', sql.NVarChar(100), nowIso);
        await updateReq.query(`
          UPDATE users
          SET last_login = @last_login, updated_at = GETDATE()
          WHERE id = @id;
        `);
        user.last_login = nowIso;
      } catch (err) {
        log.error('Failed to update user last_login timestamp:', err);
      }

      const rolePerms = typeof user.role_permissions === 'string' ? JSON.parse(user.role_permissions) : user.role_permissions || {};
      const userOverrides = typeof user.permission_overrides === 'string' ? JSON.parse(user.permission_overrides) : user.permission_overrides || {};

      return {
        user: mapUser(user),
        permissions: { ...rolePerms, ...userOverrides }
      };
    }
  },

  hospitals: {
    getHospitals: async () => {
      const pool = await getPool();
      const res = await pool.request().query('SELECT * FROM hospitals ORDER BY hospital_name ASC');
      return res.recordset.map(mapHospital);
    },

    getHospitalById: async (id: string) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      const res = await req.query('SELECT * FROM hospitals WHERE id = @id');
      if (res.recordset.length === 0) throw new Error('Hospital not found');
      return mapHospital(res.recordset[0]);
    },

    createHospital: async (hospitalData: any) => {
      const pool = await getPool();
      const id = crypto.randomUUID();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      req.input('name', sql.NVarChar(200), hospitalData.hospitalName);
      req.input('loc', sql.NVarChar(200), hospitalData.location || null);
      req.input('phone', sql.NVarChar(50), hospitalData.phoneNumber || null);
      req.input('addr', sql.NVarChar(sql.MAX), hospitalData.address || null);

      await req.query(`
        INSERT INTO hospitals (id, hospital_name, location, phone_number, address, created_at, updated_at)
        VALUES (@id, @name, @loc, @phone, @addr, GETDATE(), GETDATE());
      `);

      return await dbHandlers.hospitals.getHospitalById(id);
    },

    updateHospital: async (id: string, hospitalData: any) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      req.input('name', sql.NVarChar(200), hospitalData.hospitalName || null);
      req.input('loc', sql.NVarChar(200), hospitalData.location || null);
      req.input('phone', sql.NVarChar(50), hospitalData.phoneNumber || null);
      req.input('addr', sql.NVarChar(sql.MAX), hospitalData.address || null);

      await req.query(`
        UPDATE hospitals
        SET 
          hospital_name = COALESCE(@name, hospital_name),
          location = COALESCE(@loc, location),
          phone_number = COALESCE(@phone, phone_number),
          address = COALESCE(@addr, address),
          updated_at = GETDATE()
        WHERE id = @id;
      `);

      return await dbHandlers.hospitals.getHospitalById(id);
    },

    deleteHospital: async (id: string) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      await req.query('DELETE FROM hospitals WHERE id = @id');
    }
  },

  doctors: {
    getDoctors: async () => {
      const pool = await getPool();
      const res = await pool.request().query('SELECT * FROM doctors ORDER BY doctor_name ASC');
      return res.recordset.map(mapDoctor);
    },

    getDoctorById: async (id: string) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      const res = await req.query('SELECT * FROM doctors WHERE id = @id');
      if (res.recordset.length === 0) throw new Error('Doctor not found');
      return mapDoctor(res.recordset[0]);
    },

    createDoctor: async (doctorData: any) => {
      const pool = await getPool();
      const id = crypto.randomUUID();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      req.input('name', sql.NVarChar(200), doctorData.doctorName);
      req.input('spec', sql.NVarChar(150), doctorData.speciality || null);
      req.input('phone', sql.NVarChar(50), doctorData.phoneNumber || null);
      req.input('email', sql.NVarChar(200), doctorData.email || null);
      req.input('hosp_id', sql.VarChar(100), doctorData.affiliateHospitalId || null);
      req.input('loc', sql.NVarChar(200), doctorData.location || null);
      req.input('addr', sql.NVarChar(sql.MAX), doctorData.address || null);

      await req.query(`
        INSERT INTO doctors (id, doctor_name, speciality, phone_number, email, affiliate_hospital_id, location, address, created_at, updated_at)
        VALUES (@id, @name, @spec, @phone, @email, @hosp_id, @loc, @addr, GETDATE(), GETDATE());
      `);

      return await dbHandlers.doctors.getDoctorById(id);
    },

    updateDoctor: async (id: string, doctorData: any) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      req.input('name', sql.NVarChar(200), doctorData.doctorName || null);
      req.input('spec', sql.NVarChar(150), doctorData.speciality || null);
      req.input('phone', sql.NVarChar(50), doctorData.phoneNumber || null);
      req.input('email', sql.NVarChar(200), doctorData.email || null);
      req.input('hosp_id', sql.VarChar(100), doctorData.affiliateHospitalId || null);

      await req.query(`
        UPDATE doctors
        SET 
          doctor_name = COALESCE(@name, doctor_name),
          speciality = COALESCE(@spec, speciality),
          phone_number = COALESCE(@phone, phone_number),
          email = COALESCE(@email, email),
          affiliate_hospital_id = COALESCE(@hosp_id, affiliate_hospital_id),
          updated_at = GETDATE()
        WHERE id = @id;
      `);

      return await dbHandlers.doctors.getDoctorById(id);
    },

    deleteDoctor: async (id: string) => {
      const pool = await getPool();
      const req = pool.request();
      req.input('id', sql.VarChar(100), id);
      await req.query('DELETE FROM doctors WHERE id = @id');
    }
  },

  dashboard: {
    getStats: async (_dateRange: any) => {
      const pool = await getPool();
      const res = await pool.request().query(`
        SELECT 
          (SELECT COUNT(*) FROM patients WHERE CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)) AS patients_today,
          (SELECT COUNT(*) FROM patients WHERE CAST(created_at AS DATE) = CAST(DATEADD(DAY, -1, GETDATE()) AS DATE)) AS patients_yesterday,
          
          (SELECT COUNT(lrt.id) FROM lab_record_tests lrt JOIN lab_records lr ON lrt.lab_record_id = lr.id WHERE CAST(lr.record_date AS DATE) = CAST(GETDATE() AS DATE)) AS tests_today,
          (SELECT COUNT(lrt.id) FROM lab_record_tests lrt JOIN lab_records lr ON lrt.lab_record_id = lr.id WHERE CAST(lr.record_date AS DATE) = CAST(DATEADD(DAY, -1, GETDATE()) AS DATE)) AS tests_yesterday,
          
          (SELECT COUNT(*) FROM lab_record_tests lrt WHERE NOT EXISTS (SELECT 1 FROM test_results tr WHERE tr.lab_record_test_id = lrt.id)) AS pending_results,
          (SELECT COUNT(*) FROM lab_record_tests lrt JOIN lab_records lr ON lrt.lab_record_id = lr.id WHERE CAST(lr.record_date AS DATE) < CAST(GETDATE() AS DATE) AND NOT EXISTS (SELECT 1 FROM test_results tr WHERE tr.lab_record_test_id = lrt.id)) AS pending_results_yesterday,
          
          (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE MONTH(payment_date) = MONTH(GETDATE()) AND YEAR(payment_date) = YEAR(GETDATE())) AS revenue_this_month,
          (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE CAST(payment_date AS DATE) = CAST(GETDATE() AS DATE)) AS revenue_today,
          (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE CAST(payment_date AS DATE) = CAST(DATEADD(DAY, -1, GETDATE()) AS DATE)) AS revenue_yesterday
      `);
      const row = res.recordset[0] || {};
      return {
        patientsToday: Number(row.patients_today || 0),
        patientsYesterday: Number(row.patients_yesterday || 0),
        testsToday: Number(row.tests_today || 0),
        testsYesterday: Number(row.tests_yesterday || 0),
        pendingResults: Number(row.pending_results || 0),
        pendingResultsYesterday: Number(row.pending_results_yesterday || 0),
        revenueThisMonth: Number(row.revenue_this_month || 0),
        revenueToday: Number(row.revenue_today || 0),
        revenueYesterday: Number(row.revenue_yesterday || 0),
      };
    },

    getCharts: async (_dateRange: any) => {
      const pool = await getPool();

      // Daily trend (last 7 days)
      const dailyMap = new Map<string, { patients: number; tests: number }>();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const key = d.toISOString().slice(0, 10);
        dailyMap.set(key, { patients: 0, tests: 0 });
      }

      const pRes = await pool.request().query(`
        SELECT CAST(created_at AS DATE) AS [date], COUNT(*) AS [count]
        FROM patients
        WHERE created_at >= DATEADD(DAY, -7, GETDATE())
        GROUP BY CAST(created_at AS DATE)
      `);
      for (const r of pRes.recordset) {
        const key = new Date(r.date).toISOString().slice(0, 10);
        const entry = dailyMap.get(key);
        if (entry) entry.patients = Number(r.count);
      }

      const tRes = await pool.request().query(`
        SELECT CAST(record_date AS DATE) AS [date], COUNT(*) AS [count]
        FROM lab_records
        WHERE record_date >= DATEADD(DAY, -7, GETDATE())
        GROUP BY CAST(record_date AS DATE)
      `);
      for (const r of tRes.recordset) {
        const key = new Date(r.date).toISOString().slice(0, 10);
        const entry = dailyMap.get(key);
        if (entry) entry.tests = Number(r.count);
      }

      const dailyTrend: any[] = [];
      dailyMap.forEach((val, key) => {
        const dateObj = new Date(key + 'T00:00:00');
        dailyTrend.push({
          date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          patients: val.patients,
          tests: val.tests
        });
      });

      // Department breakdown
      const deptRes = await pool.request().query(`
        SELECT department, COUNT(*) AS [count]
        FROM lab_record_tests
        GROUP BY department
        ORDER BY [count] DESC
      `);
      const departmentBreakdown = deptRes.recordset.map((r: any) => ({
        department: r.department || 'Unknown',
        count: Number(r.count)
      }));

      // Revenue trend (last 30 days)
      const revRes = await pool.request().query(`
        SELECT CAST(payment_date AS DATE) AS [date], SUM(amount) AS [revenue]
        FROM payments
        WHERE payment_date >= DATEADD(DAY, -30, GETDATE())
        GROUP BY CAST(payment_date AS DATE)
        ORDER BY [date] ASC
      `);
      const revenueTrend = revRes.recordset.map((r: any) => ({
        date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: Number(r.revenue)
      }));

      // Result flags
      const flagRes = await pool.request().query(`
        SELECT flag, COUNT(*) AS [count]
        FROM test_results
        GROUP BY flag
      `);
      const resultFlags = flagRes.recordset.map((r: any) => ({
        flag: r.flag || 'Normal',
        count: Number(r.count)
      }));

      return { dailyTrend, departmentBreakdown, revenueTrend, resultFlags };
    },

    getChartData: async (dateRange?: any) => {
      return await dbHandlers.dashboard.getCharts(dateRange);
    },

    getPatientsToday: async (startDate?: string, endDate?: string) => {
      const pool = await getPool();
      const req = pool.request();
      let sqlQuery = `SELECT * FROM patients WHERE 1=1`;
      if (startDate) {
        req.input('start', sql.NVarChar, startDate + 'T00:00:00');
        sqlQuery += ` AND created_at >= @start`;
      } else {
        sqlQuery += ` AND CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)`;
      }
      if (endDate) {
        req.input('end', sql.NVarChar, endDate + 'T23:59:59.999');
        sqlQuery += ` AND created_at <= @end`;
      }
      sqlQuery += ` ORDER BY created_at DESC`;
      const res = await req.query(sqlQuery);
      return res.recordset.map(mapPatient);
    },

    getTestsToday: async (startDate?: string, endDate?: string) => {
      const pool = await getPool();
      const req = pool.request();
      let sqlQuery = `
        SELECT lrt.id, lrt.test_id, lrt.test_name, lrt.department, lrt.test_cost,
               lr.id AS lab_record_id, lr.lab_number, lr.record_date, p.patient_name
        FROM lab_record_tests lrt
        JOIN lab_records lr ON lrt.lab_record_id = lr.id
        LEFT JOIN patients p ON lr.patient_id = p.id
        WHERE 1=1
      `;
      if (startDate) {
        req.input('start', sql.NVarChar, startDate + 'T00:00:00');
        sqlQuery += ` AND lr.record_date >= @start`;
      } else {
        sqlQuery += ` AND CAST(lr.record_date AS DATE) = CAST(GETDATE() AS DATE)`;
      }
      if (endDate) {
        req.input('end', sql.NVarChar, endDate + 'T23:59:59.999');
        sqlQuery += ` AND lr.record_date <= @end`;
      }
      sqlQuery += ` ORDER BY lr.record_date DESC`;
      const res = await req.query(sqlQuery);
      return res.recordset.map((r: any) => ({
        id: r.id,
        labRecordId: r.lab_record_id,
        testId: r.test_id,
        testName: r.test_name,
        department: r.department,
        testCost: Number(r.test_cost),
        labNumber: r.lab_number,
        recordDate: r.record_date,
        patientName: r.patient_name || 'Unknown'
      }));
    },

    getPendingResults: async (startDate?: string, endDate?: string) => {
      const pool = await getPool();
      const req = pool.request();
      let sqlQuery = `
        SELECT lrt.id, lrt.test_id, lrt.test_name, lrt.department, lrt.test_cost,
               lr.id AS lab_record_id, lr.lab_number, lr.record_date, p.patient_name
        FROM lab_record_tests lrt
        JOIN lab_records lr ON lrt.lab_record_id = lr.id
        LEFT JOIN patients p ON lr.patient_id = p.id
        WHERE NOT EXISTS (SELECT 1 FROM test_results tr WHERE tr.lab_record_test_id = lrt.id)
      `;
      if (startDate) {
        req.input('start', sql.NVarChar, startDate + 'T00:00:00');
        sqlQuery += ` AND lr.record_date >= @start`;
      }
      if (endDate) {
        req.input('end', sql.NVarChar, endDate + 'T23:59:59.999');
        sqlQuery += ` AND lr.record_date <= @end`;
      }
      sqlQuery += ` ORDER BY lr.record_date DESC`;
      const res = await req.query(sqlQuery);
      return res.recordset.map((r: any) => ({
        id: r.id,
        labRecordId: r.lab_record_id,
        testId: r.test_id,
        testName: r.test_name,
        department: r.department,
        testCost: Number(r.test_cost),
        labNumber: r.lab_number,
        recordDate: r.record_date,
        patientName: r.patient_name || 'Unknown'
      }));
    },

    getRevenueThisMonth: async (startDate?: string, endDate?: string) => {
      const pool = await getPool();
      const req = pool.request();
      let sqlQuery = `
        SELECT pm.id, pm.amount, pm.payment_date, pm.receipt_number,
               lr.id AS lab_record_id, lr.lab_number, p.patient_name, u.full_name AS received_by_name
        FROM payments pm
        JOIN lab_records lr ON pm.lab_record_id = lr.id
        LEFT JOIN patients p ON lr.patient_id = p.id
        LEFT JOIN users u ON pm.received_by_id = u.id
        WHERE 1=1
      `;
      if (startDate) {
        req.input('start', sql.NVarChar, startDate + 'T00:00:00');
        sqlQuery += ` AND pm.payment_date >= @start`;
      } else {
        sqlQuery += ` AND MONTH(pm.payment_date) = MONTH(GETDATE()) AND YEAR(pm.payment_date) = YEAR(GETDATE())`;
      }
      if (endDate) {
        req.input('end', sql.NVarChar, endDate + 'T23:59:59.999');
        sqlQuery += ` AND pm.payment_date <= @end`;
      }
      sqlQuery += ` ORDER BY pm.payment_date DESC`;
      const res = await req.query(sqlQuery);
      return res.recordset.map((r: any) => ({
        id: r.id,
        labRecordId: r.lab_record_id,
        amount: Number(r.amount),
        paymentDate: r.payment_date,
        receiptNumber: r.receipt_number,
        labNumber: r.lab_number,
        patientName: r.patient_name || 'Unknown',
        receivedByName: ((r.received_by_name || '').trim() || 'System').split(' ')[0]
      }));
    },

    getArrearsBreakdown: async (startDate?: string, endDate?: string) => {
      const pool = await getPool();
      const req = pool.request();
      let sqlQuery = `
        SELECT lr.id, lr.lab_number, lr.record_date, lr.total_cost, lr.amount_paid, lr.arrears,
               p.patient_name, p.telephone
        FROM lab_records lr
        LEFT JOIN patients p ON lr.patient_id = p.id
        WHERE lr.arrears > 0
      `;
      if (startDate) {
        req.input('start', sql.NVarChar, startDate + 'T00:00:00');
        sqlQuery += ` AND lr.record_date >= @start`;
      }
      if (endDate) {
        req.input('end', sql.NVarChar, endDate + 'T23:59:59.999');
        sqlQuery += ` AND lr.record_date <= @end`;
      }
      sqlQuery += ` ORDER BY lr.arrears DESC`;
      const res = await req.query(sqlQuery);
      return res.recordset.map((r: any) => ({
        id: r.id,
        labNumber: r.lab_number,
        recordDate: r.record_date,
        totalCost: Number(r.total_cost),
        amountPaid: Number(r.amount_paid),
        arrears: Number(r.arrears),
        patientName: r.patient_name || 'Unknown',
        telephone: r.telephone || '—'
      }));
    }
  }
};
