// ════════════════════════════════════════════════════════════════
// Bloo LIMS — Shared TypeScript Interfaces
//
// Every domain entity has a corresponding interface here.
// DB columns are snake_case; these interfaces are camelCase.
// Mappers in `lib/mappers.ts` bridge the gap.
// ════════════════════════════════════════════════════════════════

// ── Auth & RBAC ────────────────────────────────────────────────

export interface User {
  id: string;
  fullName: string;
  email: string;
  username: string;
  phone?: string;
  roleId: string;
  permissionOverrides: Record<string, boolean>;
  twoFactorEnabled: boolean;
  twoFactorMethod?: 'totp' | 'sms' | 'email';
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: string;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  label: string;
  description?: string;
  isSystem: boolean;
  permissions: Record<string, boolean>;
  createdAt: string;
}

export type PermissionMap = Record<string, boolean>;

export interface AuthSession {
  user: User | null;
  resolvedPermissions: PermissionMap;
  isAuthenticated: boolean;
  pendingTwoFactor: boolean;
  loginMethod: string | null;
}

// ── Patients ───────────────────────────────────────────────────

export interface Patient {
  id: string;
  patientName: string;
  gender?: string;
  dob?: string;
  age?: number;
  telephone?: string;
  createdAt: string;
}

export interface PatientFilters {
  search?: string;
  gender?: string;
  limit?: number;
  offset?: number;
}

// ── Hospitals & Doctors ────────────────────────────────────────

export interface Hospital {
  id: string;
  hospitalName: string;
  location?: string;
  phoneNumber?: string;
  address?: string;
  createdAt: string;
}

export interface Doctor {
  id: string;
  doctorName: string;
  speciality?: string;
  phoneNumber?: string;
  email?: string;
  affiliateHospitalId?: string;
  location?: string;
  address?: string;
  createdAt: string;
}

// ── Test Catalog ───────────────────────────────────────────────

export interface TestItem {
  testId: string;
  testName: string;
  department: string;
  testCost: number;
}


export interface Test {
  id: string;
  testName: string;
  department: string;
  testCost: number;
  resultHeader?: string;
  referenceRange?: string;
  includeComprehensive: boolean;
  createdAt: string;
  /** Joined relation — only present when queried with parameters */
  parameters?: Parameter[];
}

export interface Parameter {
  id: string;
  parameterName: string;
  units?: string;
  referenceRange?: string;
  parameterOrderId?: number;
  trimesterType?: string;
  createdAt: string;
}

export interface Antibiotic {
  id: string;
  antibioticName: string;
  createdAt: string;
}

export interface TestFilters {
  department?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// ── Lab Records ────────────────────────────────────────────────

export interface LabRecord {
  id: string;
  labNumber: string;
  patientId: string;
  recordDate: string;
  status: string;
  referralOption?: string;
  referralDoctorId?: string;
  referralHospitalId?: string;
  subtotal: number;
  totalCost: number;
  amountPaid: number;
  arrears: number;
  createdById?: string;
  createdAt: string;
  /** Joined relation — only present when queried with patient */
  patient?: Patient;
  /** Joined aggregate — only present when queried with lab_record_tests(count) */
  testCount?: number;
}

export interface LabRecordTest {
  id: string;
  labRecordId: string;
  testId: string;
  testName: string;
  department: string;
  testCost: number;
  totalCost: number;
  amountPaid: number;
  arrears: number;
}

export interface LabRecordFilters {
  patientId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// ── Test Results ───────────────────────────────────────────────

export type ResultFlag = 'Normal' | 'Abnormal' | 'Critical';

export interface TestResult {
  id: string;
  labRecordTestId: string;
  testName: string;
  department: string;
  referenceRange?: string;
  unit?: string;
  result?: string;
  flag: ResultFlag;
  enteredById?: string;
  enteredAt: string;
}

// ── Audit ──────────────────────────────────────────────────────

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  targetName: string;
  detail: string;
}

export interface AuditFilters {
  actorId?: string;
  action?: string;
  targetType?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

// ── Settings ───────────────────────────────────────────────────

export interface AppSettings {
  general: {
    appName: string;
    shortName?: string;
    logoUrl?: string;
    theme: 'system' | 'light' | 'dark';
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
  };
  notifications: {
    emailEnabled: boolean;
    emailAddress?: string;
    emailFrequency?: 'realtime' | 'digest';
    smsEnabled: boolean;
    smsPhone?: string;
    smsFrequency?: 'realtime' | 'digest';
    inAppEnabled: boolean;
  };
  security: {
    sessionTimeoutMinutes: number;
    passwordMinLength: number;
    requireUppercase?: boolean;
    requireNumbers?: boolean;
    requireSymbols?: boolean;
    twoFactorGlobal: boolean;
    twoFactorRolePolicy?: Record<string, 'optional' | 'required'>;
    ipWhitelist: string[];
    maxLoginAttempts: number;
    lockoutDurationMinutes?: number;
  };
  smtp: {
    host: string;
    port: number;
    username: string;
    password?: string;
    fromEmail: string;
    useTLS: boolean;
  };
  apiKeys: ApiKey[];
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed?: string;
  permissions: string[];
}

// ── Dashboard ──────────────────────────────────────────────────

export interface DashboardStats {
  patientsToday: number;
  testsToday: number;
  pendingResults: number;
  revenueThisMonth: number;
}

// ── Dashboard Charts ───────────────────────────────────────────

export interface DailyTrendPoint {
  date: string;       // e.g. "Apr 24"
  patients: number;
  tests: number;
}

export interface DepartmentBreakdown {
  department: string;
  count: number;
}

export interface RevenueTrendPoint {
  date: string;
  revenue: number;
}

export interface ResultFlagBreakdown {
  flag: string;
  count: number;
}

export interface DashboardChartData {
  dailyTrend: DailyTrendPoint[];
  departmentBreakdown: DepartmentBreakdown[];
  revenueTrend: RevenueTrendPoint[];
  resultFlags: ResultFlagBreakdown[];
}
