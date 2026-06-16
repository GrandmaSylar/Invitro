import crypto from 'node:crypto';
import log from 'electron-log/main';
import { getDatabase, getOrCreateDeviceID } from './database.js';

// ── Helper Mappers ──────────────────────────────────────────────

function mapPatient(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    patientName: row.patient_name,
    gender: row.gender || undefined,
    dob: row.dob || undefined,
    age: row.age || undefined,
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
    id: row.id,
    departmentName: row.department_name,
    isActive: !!row.is_active,
    createdAt: row.created_at,
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

function mapLabRecordTest(row: any, parameters?: any[]) {
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
    parameters: parameters || undefined,
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
    receiptNumber: row.receipt_number,
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

function mapNotification(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    isRead: !!row.is_read,
    type: row.type || 'info',
    createdAt: row.created_at,
  };
}

// ── Helper functions for local ID and sequence generation ──────────────────

function localGenerateLabNumber(): string {
  const db = getDatabase();
  const today = new Date();
  const todayDateStr = today.toISOString().slice(0, 10);
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  const todayStr = `${day}${month}${year}`;

  db.prepare(`
    INSERT INTO daily_sequences (seq_date, last_value)
    VALUES (?, 1)
    ON CONFLICT (seq_date)
    DO UPDATE SET last_value = daily_sequences.last_value + 1
  `).run(todayDateStr);

  const row = db.prepare('SELECT last_value FROM daily_sequences WHERE seq_date = ?').get(todayDateStr) as any;
  const seqVal = row ? row.last_value : 1;

  return `A${todayStr}${String(seqVal).padStart(4, '0')}`;
}

function localPreviewLabNumber(): string {
  const db = getDatabase();
  const today = new Date();
  const todayDateStr = today.toISOString().slice(0, 10);
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  const todayStr = `${day}${month}${year}`;

  const row = db.prepare('SELECT last_value FROM daily_sequences WHERE seq_date = ?').get(todayDateStr) as any;
  const seqVal = row ? row.last_value + 1 : 1;

  return `A${todayStr}${String(seqVal).padStart(4, '0')}`;
}

function localGenerateReceiptNumber(): string {
  const db = getDatabase();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // "20260614"
  
  const rows = db.prepare(`
    SELECT receipt_number FROM payments 
    WHERE receipt_number LIKE ?
  `).all(`RCPT-${dateStr}-%`) as any[];
  
  let maxSeq = 0;
  for (const r of rows) {
    const parts = r.receipt_number.split('-');
    const seq = parseInt(parts[2], 10);
    if (!isNaN(seq) && seq > maxSeq) {
      maxSeq = seq;
    }
  }
  
  const nextSeq = maxSeq + 1;
  return `RCPT-${dateStr}-${String(nextSeq).padStart(4, '0')}`;
}

export function localRecalculateRecordTotals(labRecordId: string) {
  const db = getDatabase();
  
  const tests = db.prepare('SELECT test_cost FROM lab_record_tests WHERE lab_record_id = ?').all(labRecordId) as any[];
  const subtotal = tests.reduce((sum, t) => sum + Number(t.test_cost), 0);
  const totalCost = subtotal;
  
  const payments = db.prepare('SELECT amount FROM payments WHERE lab_record_id = ?').all(labRecordId) as any[];
  const amountPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const arrears = Math.max(0, totalCost - amountPaid);
  
  const record = db.prepare('SELECT status FROM lab_records WHERE id = ?').get(labRecordId) as any;
  let newStatus = record?.status || 'active';
  
  if (arrears > 0) {
    newStatus = 'Pending';
  } else {
    let requiredResultsCount = 0;
    const recordTests = db.prepare('SELECT id, test_id FROM lab_record_tests WHERE lab_record_id = ?').all(labRecordId) as any[];
    
    for (const rt of recordTests) {
      const paramsCount = db.prepare('SELECT count(*) as count FROM test_parameters WHERE test_id = ?').get(rt.test_id) as any;
      requiredResultsCount += (paramsCount && paramsCount.count > 0) ? paramsCount.count : 1;
    }
    
    const testIds = recordTests.map(rt => rt.id);
    let actualResultsCount = 0;
    if (testIds.length > 0) {
      const placeholders = testIds.map(() => '?').join(',');
      const actualCountRow = db.prepare(`
        SELECT count(*) as count FROM test_results 
        WHERE lab_record_test_id IN (${placeholders}) 
          AND result IS NOT NULL 
          AND result != ''
      `).get(...testIds) as any;
      actualResultsCount = actualCountRow ? actualCountRow.count : 0;
    }
    
    if (actualResultsCount >= requiredResultsCount && requiredResultsCount > 0) {
      newStatus = 'Closed';
    } else {
      newStatus = 'Active';
    }
  }
  
  db.prepare(`
    UPDATE lab_records 
    SET subtotal = ?, total_cost = ?, amount_paid = ?, arrears = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(subtotal, totalCost, amountPaid, arrears, newStatus, labRecordId);
  
  const deviceId = getOrCreateDeviceID();
  const payload = JSON.stringify({
    status: newStatus,
    subtotal,
    total_cost: totalCost,
    amount_paid: amountPaid,
    arrears
  });
  
  db.prepare(`
    INSERT INTO sync_queue (id, table_name, record_id, operation, payload, device_id)
    VALUES (?, 'lab_records', ?, 'UPDATE', ?, ?)
  `).run(crypto.randomUUID(), labRecordId, payload, deviceId);
}

// ── Handlers Definition ─────────────────────────────────────────

export const dbHandlers: Record<string, Record<string, Function>> = {
  patients: {
    getPatients: async (filters: any) => {
      const db = getDatabase();
      let sql = 'SELECT * FROM patients WHERE 1=1';
      const params: any[] = [];
      
      if (filters?.search) {
        sql += ' AND (patient_name LIKE ? OR telephone LIKE ?)';
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }
      if (filters?.gender) {
        sql += ' AND gender = ?';
        params.push(filters.gender);
      }
      
      const sortBy = filters?.sortBy || 'created_at';
      const direction = filters?.sortDirection === 'asc' ? 'ASC' : 'DESC';
      // Safety check for column names to avoid injection
      const allowedCols = ['created_at', 'patient_name', 'dob', 'age'];
      const finalSortBy = allowedCols.includes(sortBy) ? sortBy : 'created_at';
      sql += ` ORDER BY ${finalSortBy} ${direction}`;
      
      if (filters?.limit) {
        sql += ' LIMIT ?';
        params.push(filters.limit);
        if (filters?.offset) {
          sql += ' OFFSET ?';
          params.push(filters.offset);
        }
      }
      
      const rows = db.prepare(sql).all(...params) as any[];
      return rows.map(mapPatient);
    },

    getPatientById: async (id: string) => {
      const db = getDatabase();
      const row = db.prepare('SELECT * FROM patients WHERE id = ?').get(id);
      if (!row) throw new Error('Patient not found');
      return mapPatient(row);
    },

    createPatient: async (patientData: any) => {
      const db = getDatabase();
      const id = crypto.randomUUID();
      const deviceId = getOrCreateDeviceID();
      
      db.transaction(() => {
        db.prepare(`
          INSERT INTO patients (id, patient_name, gender, dob, age, telephone, device_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(id, patientData.patientName, patientData.gender || null, patientData.dob || null, patientData.age || null, patientData.telephone || null, deviceId);
        
        const payload = JSON.stringify({
          id,
          patient_name: patientData.patientName,
          gender: patientData.gender || null,
          dob: patientData.dob || null,
          age: patientData.age || null,
          telephone: patientData.telephone || null
        });
        db.prepare(`
          INSERT INTO sync_queue (id, table_name, record_id, operation, payload, device_id)
          VALUES (?, 'patients', ?, 'INSERT', ?, ?)
        `).run(crypto.randomUUID(), id, payload, deviceId);
      })();
      
      return dbHandlers.patients.getPatientById(id);
    },

    updatePatient: async (id: string, patientData: any) => {
      const db = getDatabase();
      const deviceId = getOrCreateDeviceID();
      
      db.transaction(() => {
        const sets: string[] = [];
        const params: any[] = [];
        const payload: Record<string, any> = {};
        
        if (patientData.patientName !== undefined) {
          sets.push('patient_name = ?');
          params.push(patientData.patientName);
          payload.patient_name = patientData.patientName;
        }
        if (patientData.gender !== undefined) {
          sets.push('gender = ?');
          params.push(patientData.gender);
          payload.gender = patientData.gender;
        }
        if (patientData.dob !== undefined) {
          sets.push('dob = ?');
          params.push(patientData.dob);
          payload.dob = patientData.dob;
        }
        if (patientData.age !== undefined) {
          sets.push('age = ?');
          params.push(patientData.age);
          payload.age = patientData.age;
        }
        if (patientData.telephone !== undefined) {
          sets.push('telephone = ?');
          params.push(patientData.telephone);
          payload.telephone = patientData.telephone;
        }
        
        if (sets.length === 0) return;
        
        sets.push("updated_at = datetime('now')");
        params.push(id);
        
        db.prepare(`UPDATE patients SET ${sets.join(', ')} WHERE id = ?`).run(...params);
        
        db.prepare(`
          INSERT INTO sync_queue (id, table_name, record_id, operation, payload, device_id)
          VALUES (?, 'patients', ?, 'UPDATE', ?, ?)
        `).run(crypto.randomUUID(), id, JSON.stringify(payload), deviceId);
      })();
      
      return dbHandlers.patients.getPatientById(id);
    },

    searchPatients: async (query: string) => {
      const db = getDatabase();
      const search = `%${query}%`;
      const rows = db.prepare(`
        SELECT * FROM patients
        WHERE patient_name LIKE ? OR telephone LIKE ? OR id LIKE ?
        ORDER BY created_at DESC LIMIT 25
      `).all(search, search, search);
      return rows.map(mapPatient);
    },
  },

  labRecords: {
    getLabRecords: async (filters: any) => {
      const db = getDatabase();
      let sql = 'SELECT * FROM lab_records WHERE 1=1';
      const params: any[] = [];
      
      if (filters?.patientId) {
        sql += ' AND patient_id = ?';
        params.push(filters.patientId);
      }
      if (filters?.status) {
        sql += ' AND status = ?';
        params.push(filters.status);
      }
      if (filters?.dateFrom) {
        sql += ' AND record_date >= ?';
        params.push(filters.dateFrom);
      }
      if (filters?.dateTo) {
        sql += ' AND record_date <= ?';
        params.push(filters.dateTo);
      }
      if (filters?.search) {
        sql += ' AND lab_number LIKE ?';
        params.push(`%${filters.search}%`);
      }
      
      sql += ' ORDER BY record_date DESC';
      
      if (filters?.limit) {
        sql += ' LIMIT ?';
        params.push(filters.limit);
        if (filters?.offset) {
          sql += ' OFFSET ?';
          params.push(filters.offset);
        }
      }
      
      const rows = db.prepare(sql).all(...params) as any[];
      return rows.map(row => {
        const patientRow = db.prepare('SELECT * FROM patients WHERE id = ?').get(row.patient_id);
        const testCountRow = db.prepare('SELECT count(*) as count FROM lab_record_tests WHERE lab_record_id = ?').get(row.id) as any;
        return mapLabRecord(row, patientRow, testCountRow?.count || 0);
      });
    },

    getLabRecordById: async (id: string) => {
      const db = getDatabase();
      const row = db.prepare('SELECT * FROM lab_records WHERE id = ?').get(id) as any;
      if (!row) throw new Error('Lab record not found');
      const patientRow = db.prepare('SELECT * FROM patients WHERE id = ?').get(row.patient_id);
      const testCountRow = db.prepare('SELECT count(*) as count FROM lab_record_tests WHERE lab_record_id = ?').get(row.id) as any;
      return mapLabRecord(row, patientRow, testCountRow?.count || 0);
    },

    getLabRecordByLabNumber: async (labNumber: string) => {
      const db = getDatabase();
      const row = db.prepare('SELECT * FROM lab_records WHERE lab_number = ?').get(labNumber) as any;
      if (!row) throw new Error('Lab record not found');
      const patientRow = db.prepare('SELECT * FROM patients WHERE id = ?').get(row.patient_id);
      const testCountRow = db.prepare('SELECT count(*) as count FROM lab_record_tests WHERE lab_record_id = ?').get(row.id) as any;
      return mapLabRecord(row, patientRow, testCountRow?.count || 0);
    },

    checkLabNumberExists: async (labNumber: string) => {
      const db = getDatabase();
      const row = db.prepare('SELECT id FROM lab_records WHERE lab_number = ?').get(labNumber);
      return !!row;
    },

    createLabRecord: async (recordData: any) => {
      const db = getDatabase();
      const id = crypto.randomUUID();
      const deviceId = getOrCreateDeviceID();
      const labNumber = recordData.labNumber || localGenerateLabNumber();
      
      db.transaction(() => {
        db.prepare(`
          INSERT INTO lab_records (
            id, lab_number, patient_id, record_date, status, referral_option,
            referral_doctor_id, referral_hospital_id, subtotal, total_cost,
            amount_paid, arrears, created_by_id, device_id
          )
          VALUES (?, ?, ?, datetime('now'), 'active', ?, ?, ?, 0, 0, 0, 0, ?, ?)
        `).run(
          id, labNumber, recordData.patientId,
          recordData.referralOption || null,
          recordData.referralDoctorId || null,
          recordData.referralHospitalId || null,
          recordData.createdById || null,
          deviceId
        );
        
        const payload = JSON.stringify({
          id,
          lab_number: labNumber,
          patient_id: recordData.patientId,
          status: 'active',
          referral_option: recordData.referralOption || null,
          referral_doctor_id: recordData.referralDoctorId || null,
          referral_hospital_id: recordData.referralHospitalId || null,
          subtotal: 0,
          total_cost: 0,
          amount_paid: 0,
          arrears: 0,
          created_by_id: recordData.createdById || null
        });
        db.prepare(`
          INSERT INTO sync_queue (id, table_name, record_id, operation, payload, device_id)
          VALUES (?, 'lab_records', ?, 'INSERT', ?, ?)
        `).run(crypto.randomUUID(), id, payload, deviceId);
      })();
      
      return dbHandlers.labRecords.getLabRecordById(id);
    },

    updateLabRecord: async (id: string, updates: any) => {
      const db = getDatabase();
      const deviceId = getOrCreateDeviceID();
      
      db.transaction(() => {
        const sets: string[] = [];
        const params: any[] = [];
        const payload: Record<string, any> = {};
        
        if (updates.status !== undefined) {
          sets.push('status = ?');
          params.push(updates.status);
          payload.status = updates.status;
        }
        if (updates.referralOption !== undefined) {
          sets.push('referral_option = ?');
          params.push(updates.referralOption);
          payload.referral_option = updates.referralOption;
        }
        if (updates.referralDoctorId !== undefined) {
          sets.push('referral_doctor_id = ?');
          params.push(updates.referralDoctorId);
          payload.referral_doctor_id = updates.referralDoctorId;
        }
        if (updates.referralHospitalId !== undefined) {
          sets.push('referral_hospital_id = ?');
          params.push(updates.referralHospitalId);
          payload.referral_hospital_id = updates.referralHospitalId;
        }
        
        if (sets.length === 0) return;
        
        sets.push("updated_at = datetime('now')");
        params.push(id);
        
        db.prepare(`UPDATE lab_records SET ${sets.join(', ')} WHERE id = ?`).run(...params);
        
        db.prepare(`
          INSERT INTO sync_queue (id, table_name, record_id, operation, payload, device_id)
          VALUES (?, 'lab_records', ?, 'UPDATE', ?, ?)
        `).run(crypto.randomUUID(), id, JSON.stringify(payload), deviceId);
      })();
      
      return dbHandlers.labRecords.getLabRecordById(id);
    },

    getTestsForRecord: async (labRecordId: string) => {
      const db = getDatabase();
      const rows = db.prepare('SELECT * FROM lab_record_tests WHERE lab_record_id = ? ORDER BY test_name ASC').all(labRecordId) as any[];
      return rows.map(row => {
        const params = db.prepare(`
          SELECT p.* FROM test_parameters tp
          JOIN parameters p ON tp.parameter_id = p.id
          WHERE tp.test_id = ?
          ORDER BY tp.sort_order ASC
        `).all(row.test_id) as any[];
        return mapLabRecordTest(row, params.map(mapParameter));
      });
    },

    addTestToRecord: async (labRecordId: string, test: any) => {
      const db = getDatabase();
      const id = crypto.randomUUID();
      const deviceId = getOrCreateDeviceID();
      
      db.transaction(() => {
        db.prepare(`
          INSERT INTO lab_record_tests (id, lab_record_id, test_id, test_name, department, test_cost, total_cost, amount_paid, arrears)
          VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
        `).run(id, labRecordId, test.testId, test.testName, test.department, test.testCost, test.testCost, test.testCost);
        
        const payload = JSON.stringify({
          id,
          lab_record_id: labRecordId,
          test_id: test.testId,
          test_name: test.testName,
          department: test.department,
          test_cost: test.testCost,
          total_cost: test.testCost,
          amount_paid: 0,
          arrears: test.testCost
        });
        db.prepare(`
          INSERT INTO sync_queue (id, table_name, record_id, operation, payload, device_id)
          VALUES (?, 'lab_record_tests', ?, 'INSERT', ?, ?)
        `).run(crypto.randomUUID(), id, payload, deviceId);
        
        localRecalculateRecordTotals(labRecordId);
      })();
      
      const row = db.prepare('SELECT * FROM lab_record_tests WHERE id = ?').get(id);
      return mapLabRecordTest(row);
    },

    removeTestFromRecord: async (labRecordTestId: string, labRecordId: string) => {
      const db = getDatabase();
      const deviceId = getOrCreateDeviceID();
      
      db.transaction(() => {
        db.prepare('DELETE FROM lab_record_tests WHERE id = ?').run(labRecordTestId);
        
        db.prepare(`
          INSERT INTO sync_queue (id, table_name, record_id, operation, payload, device_id)
          VALUES (?, 'lab_record_tests', ?, 'DELETE', '{}', ?)
        `).run(crypto.randomUUID(), labRecordTestId, deviceId);
        
        localRecalculateRecordTotals(labRecordId);
      })();
    },

    getPayments: async (labRecordId: string) => {
      const db = getDatabase();
      const rows = db.prepare('SELECT * FROM payments WHERE lab_record_id = ? ORDER BY payment_date DESC').all(labRecordId) as any[];
      return rows.map(mapPayment);
    },

    recordPayment: async (labRecordId: string, amount: number, receivedById?: string) => {
      const db = getDatabase();
      const id = crypto.randomUUID();
      const deviceId = getOrCreateDeviceID();
      const receiptNumber = localGenerateReceiptNumber();
      
      db.transaction(() => {
        db.prepare(`
          INSERT INTO payments (id, lab_record_id, amount, payment_date, received_by_id, receipt_number, device_id)
          VALUES (?, ?, ?, datetime('now'), ?, ?, ?)
        `).run(id, labRecordId, amount, receivedById || null, receiptNumber, deviceId);
        
        const payload = JSON.stringify({
          id,
          lab_record_id: labRecordId,
          amount,
          received_by_id: receivedById || null,
          receipt_number: receiptNumber
        });
        db.prepare(`
          INSERT INTO sync_queue (id, table_name, record_id, operation, payload, device_id)
          VALUES (?, 'payments', ?, 'INSERT', ?, ?)
        `).run(crypto.randomUUID(), id, payload, deviceId);
        
        localRecalculateRecordTotals(labRecordId);
      })();
      
      const row = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
      return mapPayment(row);
    },

    recalculateStatusAndTotals: async (labRecordId: string) => {
      localRecalculateRecordTotals(labRecordId);
    },

    generateLabNumber: async () => {
      return localGenerateLabNumber();
    },

    previewLabNumber: async () => {
      return localPreviewLabNumber();
    },
  },

  results: {
    getResultsByLabRecordTest: async (labRecordTestId: string) => {
      const db = getDatabase();
      const rows = db.prepare('SELECT * FROM test_results WHERE lab_record_test_id = ? ORDER BY entered_at ASC').all(labRecordTestId) as any[];
      return rows.map(mapTestResult);
    },

    getResultsByLabRecord: async (labRecordId: string) => {
      const db = getDatabase();
      const recordTests = db.prepare('SELECT id FROM lab_record_tests WHERE lab_record_id = ?').all(labRecordId) as any[];
      if (recordTests.length === 0) return [];
      
      const ids = recordTests.map(rt => rt.id);
      const placeholders = ids.map(() => '?').join(',');
      const rows = db.prepare(`
        SELECT * FROM test_results 
        WHERE lab_record_test_id IN (${placeholders}) 
        ORDER BY entered_at ASC
      `).all(...ids) as any[];
      return rows.map(mapTestResult);
    },

    enterResult: async (resultData: any) => {
      const db = getDatabase();
      const id = crypto.randomUUID();
      const deviceId = getOrCreateDeviceID();
      
      db.transaction(() => {
        db.prepare(`
          INSERT INTO test_results (
            id, lab_record_test_id, test_name, department, reference_range,
            unit, result, flag, entered_by_id, entered_at, device_id
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
        `).run(
          id, resultData.labRecordTestId, resultData.testName, resultData.department,
          resultData.referenceRange || null, resultData.unit || null, resultData.result || null,
          resultData.flag || 'Normal', resultData.enteredById || null, deviceId
        );
        
        const payload = JSON.stringify({
          id,
          lab_record_test_id: resultData.labRecordTestId,
          test_name: resultData.testName,
          department: resultData.department,
          reference_range: resultData.referenceRange || null,
          unit: resultData.unit || null,
          result: resultData.result || null,
          flag: resultData.flag || 'Normal',
          entered_by_id: resultData.enteredById || null
        });
        db.prepare(`
          INSERT INTO sync_queue (id, table_name, record_id, operation, payload, device_id)
          VALUES (?, 'test_results', ?, 'INSERT', ?, ?)
        `).run(crypto.randomUUID(), id, payload, deviceId);
        
        // Trigger record status recalculation
        const rt = db.prepare('SELECT lab_record_id FROM lab_record_tests WHERE id = ?').get(resultData.labRecordTestId) as any;
        if (rt?.lab_record_id) {
          localRecalculateRecordTotals(rt.lab_record_id);
        }
      })();
      
      const row = db.prepare('SELECT * FROM test_results WHERE id = ?').get(id);
      return mapTestResult(row);
    },

    updateResult: async (id: string, updates: any) => {
      const db = getDatabase();
      const deviceId = getOrCreateDeviceID();
      
      db.transaction(() => {
        const sets: string[] = [];
        const params: any[] = [];
        const payload: Record<string, any> = {};
        
        if (updates.result !== undefined) {
          sets.push('result = ?');
          params.push(updates.result);
          payload.result = updates.result;
        }
        if (updates.flag !== undefined) {
          sets.push('flag = ?');
          params.push(updates.flag);
          payload.flag = updates.flag;
        }
        if (updates.referenceRange !== undefined) {
          sets.push('reference_range = ?');
          params.push(updates.referenceRange);
          payload.reference_range = updates.referenceRange;
        }
        if (updates.unit !== undefined) {
          sets.push('unit = ?');
          params.push(updates.unit);
          payload.unit = updates.unit;
        }
        
        if (sets.length === 0) return;
        
        sets.push("updated_at = datetime('now')");
        params.push(id);
        
        db.prepare(`UPDATE test_results SET ${sets.join(', ')} WHERE id = ?`).run(...params);
        
        db.prepare(`
          INSERT INTO sync_queue (id, table_name, record_id, operation, payload, device_id)
          VALUES (?, 'test_results', ?, 'UPDATE', ?, ?)
        `).run(crypto.randomUUID(), id, JSON.stringify(payload), deviceId);
        
        const existing = db.prepare('SELECT lab_record_test_id FROM test_results WHERE id = ?').get(id) as any;
        if (existing?.lab_record_test_id) {
          const rt = db.prepare('SELECT lab_record_id FROM lab_record_tests WHERE id = ?').get(existing.lab_record_test_id) as any;
          if (rt?.lab_record_id) {
            localRecalculateRecordTotals(rt.lab_record_id);
          }
        }
      })();
      
      const row = db.prepare('SELECT * FROM test_results WHERE id = ?').get(id);
      return mapTestResult(row);
    },

    bulkEnterResults: async (results: any[]) => {
      const db = getDatabase();
      const deviceId = getOrCreateDeviceID();
      const output: any[] = [];
      
      db.transaction(() => {
        for (const r of results) {
          const id = crypto.randomUUID();
          db.prepare(`
            INSERT INTO test_results (
              id, lab_record_test_id, test_name, department, reference_range,
              unit, result, flag, entered_by_id, entered_at, device_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
          `).run(
            id, r.labRecordTestId, r.testName, r.department,
            r.referenceRange || null, r.unit || null, r.result || null,
            r.flag || 'Normal', r.enteredById || null, deviceId
          );
          
          const payload = JSON.stringify({
            id,
            lab_record_test_id: r.labRecordTestId,
            test_name: r.testName,
            department: r.department,
            reference_range: r.referenceRange || null,
            unit: r.unit || null,
            result: r.result || null,
            flag: r.flag || 'Normal',
            entered_by_id: r.enteredById || null
          });
          db.prepare(`
            INSERT INTO sync_queue (id, table_name, record_id, operation, payload, device_id)
            VALUES (?, 'test_results', ?, 'INSERT', ?, ?)
          `).run(crypto.randomUUID(), id, payload, deviceId);
          
          const inserted = db.prepare('SELECT * FROM test_results WHERE id = ?').get(id);
          output.push(mapTestResult(inserted));
        }
        
        if (results.length > 0) {
          const rt = db.prepare('SELECT lab_record_id FROM lab_record_tests WHERE id = ?').get(results[0].labRecordTestId) as any;
          if (rt?.lab_record_id) {
            localRecalculateRecordTotals(rt.lab_record_id);
          }
        }
      })();
      
      return output;
    },

    deleteResult: async (id: string) => {
      const db = getDatabase();
      const deviceId = getOrCreateDeviceID();
      
      db.transaction(() => {
        const existing = db.prepare('SELECT lab_record_test_id FROM test_results WHERE id = ?').get(id) as any;
        
        db.prepare('DELETE FROM test_results WHERE id = ?').run(id);
        
        db.prepare(`
          INSERT INTO sync_queue (id, table_name, record_id, operation, payload, device_id)
          VALUES (?, 'test_results', ?, 'DELETE', '{}', ?)
        `).run(crypto.randomUUID(), id, deviceId);
        
        if (existing?.lab_record_test_id) {
          const rt = db.prepare('SELECT lab_record_id FROM lab_record_tests WHERE id = ?').get(existing.lab_record_test_id) as any;
          if (rt?.lab_record_id) {
            localRecalculateRecordTotals(rt.lab_record_id);
          }
        }
      })();
    },
  },

  audit: {
    logEvent: async (event: any) => {
      const db = getDatabase();
      const id = crypto.randomUUID();
      
      db.prepare(`
        INSERT INTO audit_events (id, actor_id, actor_name, action, target_type, target_id, target_name, detail, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(id, event.actorId, event.actorName, event.action, event.targetType, event.targetId, event.targetName, event.detail || '');
    },

    getEvents: async (filters: any) => {
      const db = getDatabase();
      let sql = 'SELECT * FROM audit_events WHERE 1=1';
      const params: any[] = [];
      
      if (filters?.actorId) {
        sql += ' AND actor_id = ?';
        params.push(filters.actorId);
      }
      if (filters?.action) {
        sql += ' AND action = ?';
        params.push(filters.action);
      }
      if (filters?.targetType) {
        sql += ' AND target_type = ?';
        params.push(filters.targetType);
      }
      if (filters?.dateFrom) {
        sql += ' AND timestamp >= ?';
        params.push(filters.dateFrom);
      }
      if (filters?.dateTo) {
        sql += ' AND timestamp <= ?';
        params.push(filters.dateTo);
      }
      
      sql += ' ORDER BY timestamp DESC';
      
      const limit = filters?.limit || 100;
      const offset = filters?.offset || 0;
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      const rows = db.prepare(sql).all(...params) as any[];
      return rows.map(mapAuditEvent);
    },
  },

  settings: {
    getSettings: async () => {
      const db = getDatabase();
      const row = db.prepare('SELECT settings FROM system_settings WHERE id = 1').get() as any;
      if (!row) {
        // Return default system settings shape
        return {
          general: { appName: 'Bloo LIMS', theme: 'system', language: 'en', timezone: 'UTC', dateFormat: 'YYYY-MM-DD', timeFormat: 'HH:mm' },
          notifications: { emailEnabled: false, smsEnabled: false, inAppEnabled: true },
          security: { sessionTimeoutMinutes: 30, passwordMinLength: 6, twoFactorGlobal: false, maxLoginAttempts: 5, ipWhitelist: [] },
          smtp: { host: '', port: 587, username: '', fromEmail: '', useTLS: true },
          receipt: { paperSize: 'A4', scale: 1, showLogo: true, showWatermark: false }
        };
      }
      return JSON.parse(row.settings);
    },

    updateSettings: async (section: string, sectionData: any) => {
      const db = getDatabase();
      const deviceId = getOrCreateDeviceID();
      
      db.transaction(() => {
        const current = db.prepare('SELECT settings FROM system_settings WHERE id = 1').get() as any;
        let newSettings: Record<string, any> = {};
        if (current) {
          newSettings = JSON.parse(current.settings);
        }
        newSettings[section] = sectionData;
        
        db.prepare(`
          INSERT INTO system_settings (id, settings, updated_at)
          VALUES (1, ?, datetime('now'))
          ON CONFLICT(id) DO UPDATE SET
            settings = excluded.settings,
            updated_at = excluded.updated_at
        `).run(JSON.stringify(newSettings));
        
        // Settings are synced by writing to sync_queue
        db.prepare(`
          INSERT INTO sync_queue (id, table_name, record_id, operation, payload, device_id)
          VALUES (?, 'app_settings', '1', 'UPDATE', ?, ?)
        `).run(crypto.randomUUID(), JSON.stringify(newSettings), deviceId);
      })();
    },

    patchSettings: async (section: string, partialData: any) => {
      const db = getDatabase();
      const current = await dbHandlers.settings.getSettings();
      const merged = { ...current[section], ...partialData };
      await dbHandlers.settings.updateSettings(section, merged);
    },

    getApiKeys: async () => {
      const db = getDatabase();
      const rows = db.prepare('SELECT * FROM api_keys ORDER BY created_at DESC').all() as any[];
      return rows.map(mapApiKey);
    },

    createApiKey: async (keyData: any) => {
      const db = getDatabase();
      const id = crypto.randomUUID();
      const deviceId = getOrCreateDeviceID();
      const newKey = keyData.key || `bloo_${crypto.randomUUID().replace(/-/g, '')}`;
      const permsJson = JSON.stringify(keyData.permissions || []);
      
      db.transaction(() => {
        db.prepare(`
          INSERT INTO api_keys (id, name, key, permissions, created_at, updated_at)
          VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
        `).run(id, keyData.name, newKey, permsJson);
        
        const payload = JSON.stringify({
          id,
          name: keyData.name,
          key: newKey,
          permissions: keyData.permissions || []
        });
        db.prepare(`
          INSERT INTO sync_queue (id, table_name, record_id, operation, payload, device_id)
          VALUES (?, 'api_keys', ?, 'INSERT', ?, ?)
        `).run(crypto.randomUUID(), id, payload, deviceId);
      })();
      
      const row = db.prepare('SELECT * FROM api_keys WHERE id = ?').get(id);
      return mapApiKey(row);
    },

    revokeApiKey: async (id: string) => {
      const db = getDatabase();
      const deviceId = getOrCreateDeviceID();
      
      db.transaction(() => {
        db.prepare('DELETE FROM api_keys WHERE id = ?').run(id);
        
        db.prepare(`
          INSERT INTO sync_queue (id, table_name, record_id, operation, payload, device_id)
          VALUES (?, 'api_keys', ?, 'DELETE', '{}', ?)
        `).run(crypto.randomUUID(), id, deviceId);
      })();
      
      return { success: true };
    },

    getSyncStatus: async () => {
      const db = getDatabase();
      return db.prepare('SELECT status, count(*) as count FROM sync_queue GROUP BY status').all();
    },
  },

  catalog: {
    getTests: async (filters: any) => {
      const db = getDatabase();
      let sql = 'SELECT * FROM tests WHERE is_active = 1';
      const params: any[] = [];
      
      if (filters?.department) {
        sql += ' AND department = ?';
        params.push(filters.department);
      }
      if (filters?.search) {
        sql += ' AND test_name LIKE ?';
        params.push(`%${filters.search}%`);
      }
      
      sql += ' ORDER BY test_name ASC';
      
      if (filters?.limit) {
        sql += ' LIMIT ?';
        params.push(filters.limit);
      }
      
      const rows = db.prepare(sql).all(...params) as any[];
      return rows.map(mapTest);
    },

    getTestById: async (id: string) => {
      const db = getDatabase();
      const row = db.prepare('SELECT * FROM tests WHERE id = ?').get(id);
      if (!row) throw new Error('Test not found');
      
      const params = db.prepare(`
        SELECT p.* FROM test_parameters tp
        JOIN parameters p ON tp.parameter_id = p.id
        WHERE tp.test_id = ?
        ORDER BY tp.sort_order ASC
      `).all(id) as any[];
      
      const test = mapTest(row) as any;
      test.parameters = params.map(mapParameter);
      return test;
    },

    createTest: async (testData: any) => {
      const db = getDatabase();
      const id = crypto.randomUUID();
      const deviceId = getOrCreateDeviceID();
      
      db.transaction(() => {
        db.prepare(`
          INSERT INTO tests (id, test_name, test_code, department, test_cost, result_header, include_comprehensive, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `).run(id, testData.testName, testData.testCode || null, testData.department, testData.testCost, testData.resultHeader || null, testData.includeComprehensive ? 1 : 0);
        
        const payload = JSON.stringify({
          id,
          test_name: testData.testName,
          test_code: testData.testCode || null,
          department: testData.department,
          test_cost: testData.testCost,
          result_header: testData.resultHeader || null,
          include_comprehensive: !!testData.includeComprehensive,
          is_active: true
        });
        db.prepare(`
          INSERT INTO sync_queue (id, table_name, record_id, operation, payload, device_id)
          VALUES (?, 'tests', ?, 'INSERT', ?, ?)
        `).run(crypto.randomUUID(), id, payload, deviceId);
      })();
      
      return dbHandlers.catalog.getTestById(id);
    },

    updateTest: async (id: string, testData: any) => {
      const db = getDatabase();
      const deviceId = getOrCreateDeviceID();
      
      db.transaction(() => {
        const sets: string[] = [];
        const params: any[] = [];
        const payload: Record<string, any> = {};
        
        if (testData.testName !== undefined) {
          sets.push('test_name = ?');
          params.push(testData.testName);
          payload.test_name = testData.testName;
        }
        if (testData.testCode !== undefined) {
          sets.push('test_code = ?');
          params.push(testData.testCode);
          payload.test_code = testData.testCode;
        }
        if (testData.department !== undefined) {
          sets.push('department = ?');
          params.push(testData.department);
          payload.department = testData.department;
        }
        if (testData.testCost !== undefined) {
          sets.push('test_cost = ?');
          params.push(testData.testCost);
          payload.test_cost = testData.testCost;
        }
        if (testData.resultHeader !== undefined) {
          sets.push('result_header = ?');
          params.push(testData.resultHeader);
          payload.result_header = testData.resultHeader;
        }
        if (testData.includeComprehensive !== undefined) {
          sets.push('include_comprehensive = ?');
          params.push(testData.includeComprehensive ? 1 : 0);
          payload.include_comprehensive = !!testData.includeComprehensive;
        }
        
        if (sets.length === 0) return;
        
        sets.push("updated_at = datetime('now')");
        params.push(id);
        
        db.prepare(`UPDATE tests SET ${sets.join(', ')} WHERE id = ?`).run(...params);
        
        db.prepare(`
          INSERT INTO sync_queue (id, table_name, record_id, operation, payload, device_id)
          VALUES (?, 'tests', ?, 'UPDATE', ?, ?)
        `).run(crypto.randomUUID(), id, JSON.stringify(payload), deviceId);
      })();
      
      return dbHandlers.catalog.getTestById(id);
    },

    deleteTest: async (id: string) => {
      const db = getDatabase();
      const deviceId = getOrCreateDeviceID();
      
      db.transaction(() => {
        db.prepare('UPDATE tests SET is_active = 0 WHERE id = ?').run(id);
        
        const payload = JSON.stringify({ is_active: false });
        db.prepare(`
          INSERT INTO sync_queue (id, table_name, record_id, operation, payload, device_id)
          VALUES (?, 'tests', ?, 'UPDATE', ?, ?)
        `).run(crypto.randomUUID(), id, payload, deviceId);
      })();
    },

    getDepartments: async () => {
      const db = getDatabase();
      const rows = db.prepare('SELECT * FROM departments WHERE is_active = 1 ORDER BY department_name ASC').all() as any[];
      return rows.map(mapDepartment);
    },

    createDepartment: async (name: string) => {
      const db = getDatabase();
      const id = crypto.randomUUID();
      const deviceId = getOrCreateDeviceID();
      
      db.transaction(() => {
        db.prepare(`
          INSERT INTO departments (id, department_name, is_active)
          VALUES (?, ?, 1)
        `).run(id, name);
        
        const payload = JSON.stringify({
          id,
          department_name: name,
          is_active: true
        });
        db.prepare(`
          INSERT INTO sync_queue (id, table_name, record_id, operation, payload, device_id)
          VALUES (?, 'departments', ?, 'INSERT', ?, ?)
        `).run(crypto.randomUUID(), id, payload, deviceId);
      })();
      
      const row = db.prepare('SELECT * FROM departments WHERE id = ?').get(id);
      return mapDepartment(row);
    },

    updateDepartment: async (id: string, name: string) => {
      const db = getDatabase();
      const deviceId = getOrCreateDeviceID();
      
      db.transaction(() => {
        db.prepare(`
          UPDATE departments 
          SET department_name = ?, updated_at = datetime('now') 
          WHERE id = ?
        `).run(name, id);
        
        const payload = JSON.stringify({ department_name: name });
        db.prepare(`
          INSERT INTO sync_queue (id, table_name, record_id, operation, payload, device_id)
          VALUES (?, 'departments', ?, 'UPDATE', ?, ?)
        `).run(crypto.randomUUID(), id, payload, deviceId);
      })();
      
      const row = db.prepare('SELECT * FROM departments WHERE id = ?').get(id);
      return mapDepartment(row);
    },

    deleteDepartment: async (id: string) => {
      const db = getDatabase();
      const deviceId = getOrCreateDeviceID();
      
      db.transaction(() => {
        db.prepare('UPDATE departments SET is_active = 0 WHERE id = ?').run(id);
        
        const payload = JSON.stringify({ is_active: false });
        db.prepare(`
          INSERT INTO sync_queue (id, table_name, record_id, operation, payload, device_id)
          VALUES (?, 'departments', ?, 'UPDATE', ?, ?)
        `).run(crypto.randomUUID(), id, payload, deviceId);
      })();
    },

    linkParameter: async (testId: string, parameterId: string, sortOrder: number) => {
      const db = getDatabase();
      const deviceId = getOrCreateDeviceID();
      
      db.transaction(() => {
        db.prepare(`
          INSERT INTO test_parameters (test_id, parameter_id, sort_order)
          VALUES (?, ?, ?)
          ON CONFLICT(test_id, parameter_id) DO UPDATE SET sort_order = excluded.sort_order
        `).run(testId, parameterId, sortOrder);
        
        // Sync is handled by inserting into sync_queue
        const payload = JSON.stringify({
          test_id: testId,
          parameter_id: parameterId,
          sort_order: sortOrder
        });
        db.prepare(`
          INSERT INTO sync_queue (id, table_name, record_id, operation, payload, device_id)
          VALUES (?, 'test_parameters', ?, 'INSERT', ?, ?)
        `).run(crypto.randomUUID(), `${testId}_${parameterId}`, payload, deviceId);
      })();
    },

    unlinkParameter: async (testId: string, parameterId: string) => {
      const db = getDatabase();
      const deviceId = getOrCreateDeviceID();
      
      db.transaction(() => {
        db.prepare('DELETE FROM test_parameters WHERE test_id = ? AND parameter_id = ?').run(testId, parameterId);
        
        db.prepare(`
          INSERT INTO sync_queue (id, table_name, record_id, operation, payload, device_id)
          VALUES (?, 'test_parameters', ?, 'DELETE', '{}', ?)
        `).run(crypto.randomUUID(), `${testId}_${parameterId}`, deviceId);
      })();
    },

    previewTestCode: async () => {
      const db = getDatabase();
      const rows = db.prepare("SELECT test_code FROM tests WHERE test_code LIKE 'TST-%' ORDER BY test_code DESC LIMIT 1").all() as any[];
      if (rows.length === 0) return 'TST-0001';
      
      const last = rows[0].test_code;
      const num = parseInt(last.split('-')[1], 10);
      return `TST-${String(num + 1).padStart(4, '0')}`;
    },

    previewParameterCode: async () => {
      const db = getDatabase();
      const rows = db.prepare("SELECT parameter_code FROM parameters WHERE parameter_code LIKE 'PRM-%' ORDER BY parameter_code DESC LIMIT 1").all() as any[];
      if (rows.length === 0) return 'PRM-0001';
      
      const last = rows[0].parameter_code;
      const num = parseInt(last.split('-')[1], 10);
      return `PRM-${String(num + 1).padStart(4, '0')}`;
    },

    getParameters: async () => {
      const db = getDatabase();
      const rows = db.prepare('SELECT * FROM parameters WHERE is_active = 1 ORDER BY parameter_code ASC').all() as any[];
      return rows.map(mapParameter);
    },

    createParameter: async (paramData: any) => {
      const db = getDatabase();
      const id = crypto.randomUUID();
      const deviceId = getOrCreateDeviceID();
      const parameterCode = await dbHandlers.catalog.previewParameterCode();
      
      db.transaction(() => {
        db.prepare(`
          INSERT INTO parameters (id, parameter_name, units, reference_range, trimester_type, is_active, parameter_code)
          VALUES (?, ?, ?, ?, ?, 1, ?)
        `).run(id, paramData.parameterName, paramData.units || null, paramData.referenceRange || null, paramData.trimesterType || null, parameterCode);
        
        const payload = JSON.stringify({
          id,
          parameter_name: paramData.parameterName,
          units: paramData.units || null,
          reference_range: paramData.referenceRange || null,
          trimester_type: paramData.trimesterType || null,
          is_active: true,
          parameter_code: parameterCode
        });
        db.prepare(`
          INSERT INTO sync_queue (id, table_name, record_id, operation, payload, device_id)
          VALUES (?, 'parameters', ?, 'INSERT', ?, ?)
        `).run(crypto.randomUUID(), id, payload, deviceId);
      })();
      
      const row = db.prepare('SELECT * FROM parameters WHERE id = ?').get(id);
      return mapParameter(row);
    },

    updateParameter: async (id: string, paramData: any) => {
      const db = getDatabase();
      const deviceId = getOrCreateDeviceID();
      
      db.transaction(() => {
        const sets: string[] = [];
        const params: any[] = [];
        const payload: Record<string, any> = {};
        
        if (paramData.parameterName !== undefined) {
          sets.push('parameter_name = ?');
          params.push(paramData.parameterName);
          payload.parameter_name = paramData.parameterName;
        }
        if (paramData.units !== undefined) {
          sets.push('units = ?');
          params.push(paramData.units);
          payload.units = paramData.units;
        }
        if (paramData.referenceRange !== undefined) {
          sets.push('reference_range = ?');
          params.push(paramData.referenceRange);
          payload.reference_range = paramData.referenceRange;
        }
        if (paramData.trimesterType !== undefined) {
          sets.push('trimester_type = ?');
          params.push(paramData.trimesterType);
          payload.trimester_type = paramData.trimesterType;
        }
        
        if (sets.length === 0) return;
        
        sets.push("updated_at = datetime('now')");
        params.push(id);
        
        db.prepare(`UPDATE parameters SET ${sets.join(', ')} WHERE id = ?`).run(...params);
        
        db.prepare(`
          INSERT INTO sync_queue (id, table_name, record_id, operation, payload, device_id)
          VALUES (?, 'parameters', ?, 'UPDATE', ?, ?)
        `).run(crypto.randomUUID(), id, JSON.stringify(payload), deviceId);
      })();
      
      const row = db.prepare('SELECT * FROM parameters WHERE id = ?').get(id);
      return mapParameter(row);
    },

    deleteParameter: async (id: string) => {
      const db = getDatabase();
      const deviceId = getOrCreateDeviceID();
      
      db.transaction(() => {
        db.prepare('UPDATE parameters SET is_active = 0 WHERE id = ?').run(id);
        
        const payload = JSON.stringify({ is_active: false });
        db.prepare(`
          INSERT INTO sync_queue (id, table_name, record_id, operation, payload, device_id)
          VALUES (?, 'parameters', ?, 'UPDATE', ?, ?)
        `).run(crypto.randomUUID(), id, payload, deviceId);
      })();
    },

    getAntibiotics: async () => {
      const db = getDatabase();
      const rows = db.prepare('SELECT * FROM antibiotics WHERE is_active = 1 ORDER BY antibiotic_name ASC').all() as any[];
      return rows.map(mapAntibiotic);
    },

    createAntibiotic: async (name: string) => {
      const db = getDatabase();
      const id = crypto.randomUUID();
      const deviceId = getOrCreateDeviceID();
      
      db.transaction(() => {
        db.prepare(`
          INSERT INTO antibiotics (id, antibiotic_name, is_active)
          VALUES (?, ?, 1)
        `).run(id, name);
        
        const payload = JSON.stringify({
          id,
          antibiotic_name: name,
          is_active: true
        });
        db.prepare(`
          INSERT INTO sync_queue (id, table_name, record_id, operation, payload, device_id)
          VALUES (?, 'antibiotics', ?, 'INSERT', ?, ?)
        `).run(crypto.randomUUID(), id, payload, deviceId);
      })();
      
      const row = db.prepare('SELECT * FROM antibiotics WHERE id = ?').get(id);
      return mapAntibiotic(row);
    },

    updateAntibiotic: async (id: string, name: string) => {
      const db = getDatabase();
      const deviceId = getOrCreateDeviceID();
      
      db.transaction(() => {
        db.prepare(`
          UPDATE antibiotics 
          SET antibiotic_name = ?, updated_at = datetime('now') 
          WHERE id = ?
        `).run(name, id);
        
        const payload = JSON.stringify({ antibiotic_name: name });
        db.prepare(`
          INSERT INTO sync_queue (id, table_name, record_id, operation, payload, device_id)
          VALUES (?, 'antibiotics', ?, 'UPDATE', ?, ?)
        `).run(crypto.randomUUID(), id, payload, deviceId);
      })();
      
      const row = db.prepare('SELECT * FROM antibiotics WHERE id = ?').get(id);
      return mapAntibiotic(row);
    },

    deleteAntibiotic: async (id: string) => {
      const db = getDatabase();
      const deviceId = getOrCreateDeviceID();
      
      db.transaction(() => {
        db.prepare('UPDATE antibiotics SET is_active = 0 WHERE id = ?').run(id);
        
        const payload = JSON.stringify({ is_active: false });
        db.prepare(`
          INSERT INTO sync_queue (id, table_name, record_id, operation, payload, device_id)
          VALUES (?, 'antibiotics', ?, 'UPDATE', ?, ?)
        `).run(crypto.randomUUID(), id, payload, deviceId);
      })();
    },
  },
};
