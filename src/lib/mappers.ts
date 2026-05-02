/**
 * Centralized row → model mappers for all Supabase tables.
 *
 * Every DB table uses snake_case columns. Every TypeScript model
 * uses camelCase properties. These functions bridge the gap.
 *
 * Rules:
 *  - Each mapper accepts a raw Supabase row (`any`) and returns a typed model.
 *  - Nullable DB columns map to `undefined` on the model side.
 *  - JSON columns are cast to their expected TS type.
 */

import type {
  User,
  Role,
  Patient,
  Hospital,
  Doctor,
  Test,
  Parameter,
  Antibiotic,
  LabRecord,
  LabRecordTest,
  TestResult,
  AuditEvent,
  ApiKey,
} from './types';

// ── Users & Roles ──────────────────────────────────────────────

export function mapUserRow(row: any): User {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    username: row.username,
    phone: row.phone ?? undefined,
    roleId: row.role_id,
    permissionOverrides: (row.permission_overrides as Record<string, boolean>) ?? {},
    twoFactorEnabled: row.two_factor_enabled ?? false,
    twoFactorMethod: row.two_factor_method ?? undefined,
    status: row.status ?? 'active',
    lastLogin: row.last_login ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapRoleRow(row: any): Role {
  return {
    id: row.id,
    name: row.name,
    label: row.label,
    description: row.description ?? undefined,
    isSystem: row.is_system ?? false,
    permissions: (row.permissions as Record<string, boolean>) ?? {},
    createdAt: row.created_at,
  };
}

// ── Patients ───────────────────────────────────────────────────

export function mapPatientRow(row: any): Patient {
  return {
    id: row.id,
    patientName: row.patient_name,
    gender: row.gender ?? undefined,
    dob: row.dob ?? undefined,
    age: row.age ?? undefined,
    telephone: row.telephone ?? undefined,
    createdAt: row.created_at,
  };
}

// ── Hospitals & Doctors ────────────────────────────────────────

export function mapHospitalRow(row: any): Hospital {
  return {
    id: row.id,
    hospitalName: row.hospital_name,
    location: row.location ?? undefined,
    phoneNumber: row.phone_number ?? undefined,
    address: row.address ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapDoctorRow(row: any): Doctor {
  return {
    id: row.id,
    doctorName: row.doctor_name,
    speciality: row.speciality ?? undefined,
    phoneNumber: row.phone_number ?? undefined,
    email: row.email ?? undefined,
    affiliateHospitalId: row.affiliate_hospital_id ?? undefined,
    location: row.location ?? undefined,
    address: row.address ?? undefined,
    createdAt: row.created_at,
  };
}

// ── Test Catalog ───────────────────────────────────────────────

export function mapTestRow(row: any): Test {
  return {
    id: row.id,
    testName: row.test_name,
    department: row.department,
    testCost: Number(row.test_cost),
    resultHeader: row.result_header ?? undefined,
    referenceRange: row.reference_range ?? undefined,
    includeComprehensive: row.include_comprehensive ?? false,
    createdAt: row.created_at,
  };
}

export function mapParameterRow(row: any): Parameter {
  return {
    id: row.id,
    parameterName: row.parameter_name,
    units: row.units ?? undefined,
    referenceRange: row.reference_range ?? undefined,
    parameterOrderId: row.parameter_order_id ?? undefined,
    trimesterType: row.trimester_type ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapAntibioticRow(row: any): Antibiotic {
  return {
    id: row.id,
    antibioticName: row.antibiotic_name,
    createdAt: row.created_at,
  };
}

// ── Lab Records ────────────────────────────────────────────────

export function mapLabRecordRow(row: any): LabRecord {
  return {
    id: row.id,
    labNumber: row.lab_number,
    patientId: row.patient_id,
    recordDate: row.record_date,
    status: row.status ?? 'active',
    referralOption: row.referral_option ?? undefined,
    referralDoctorId: row.referral_doctor_id ?? undefined,
    referralHospitalId: row.referral_hospital_id ?? undefined,
    subtotal: Number(row.subtotal),
    totalCost: Number(row.total_cost),
    amountPaid: Number(row.amount_paid),
    arrears: Number(row.arrears),
    createdById: row.created_by_id ?? undefined,
    createdAt: row.created_at,
    // Joined relations (optional — only present when queried with select joins)
    patient: row.patients ? mapPatientRow(row.patients) : undefined,
    testCount: row.lab_record_tests ? row.lab_record_tests[0]?.count : undefined,
  };
}

export function mapLabRecordTestRow(row: any): LabRecordTest {
  const result: LabRecordTest = {
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

  if (row.tests?.test_parameters) {
    result.parameters = row.tests.test_parameters
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((tp: any) => mapParameterRow(tp.parameters));
  } else if (row.tests?.parameters) {
      // In case we map it differently later
      result.parameters = row.tests.parameters;
  }

  return result;
}

// ── Test Results ───────────────────────────────────────────────

export function mapTestResultRow(row: any): TestResult {
  return {
    id: row.id,
    labRecordTestId: row.lab_record_test_id,
    testName: row.test_name,
    department: row.department,
    referenceRange: row.reference_range ?? undefined,
    unit: row.unit ?? undefined,
    result: row.result ?? undefined,
    flag: row.flag ?? 'Normal',
    enteredById: row.entered_by_id ?? undefined,
    enteredAt: row.entered_at,
  };
}

// ── Audit ──────────────────────────────────────────────────────

export function mapAuditEventRow(row: any): AuditEvent {
  return {
    id: row.id,
    timestamp: row.timestamp,
    actorId: row.actor_id,
    actorName: row.actor_name,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    targetName: row.target_name,
    detail: row.detail ?? '',
  };
}

// ── API Keys ───────────────────────────────────────────────────

export function mapApiKeyRow(row: any): ApiKey {
  return {
    id: row.id,
    name: row.name,
    key: row.key,
    createdAt: row.created_at,
    lastUsed: row.last_used ?? undefined,
    permissions: (row.permissions as string[]) ?? [],
  };
}
