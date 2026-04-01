import { Role, User, AppSettings, DatabaseConfig } from './types';
import { ALL_PERMISSION_KEYS } from './permissions';

const getPermissionsForRole = (allowedKeys: string[]) => {
  return ALL_PERMISSION_KEYS.reduce((acc, key) => {
    acc[key] = allowedKeys.includes(key);
    return acc;
  }, {} as Record<string, boolean>);
};

const allPermissionsDict = ALL_PERMISSION_KEYS.reduce((acc, key) => {
  acc[key] = true;
  return acc;
}, {} as Record<string, boolean>);

export const SEED_ROLES: Role[] = [
  {
    id: 'developer',
    name: 'Developer',
    label: 'System Developer',
    isSystem: true,
    permissions: { ...allPermissionsDict },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'admin',
    name: 'Administrator',
    label: 'System Administrator',
    isSystem: true,
    permissions: { ...allPermissionsDict },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'lab_technician',
    name: 'Lab Technician',
    label: 'Laboratory Technician',
    isSystem: true,
    permissions: getPermissionsForRole([
      'dashboard.view',
      'test_register.view',
      'test_register.edit',
      'results_entry.view',
      'results_entry.edit',
    ]),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'doctor',
    name: 'Doctor',
    label: 'Medical Doctor',
    isSystem: true,
    permissions: getPermissionsForRole([
      'dashboard.view',
      'patients.view',
      'patients.create',
      'patients.edit',
      'patients.delete',
      'hospital_records.view',
      'hospital_records.edit',
    ]),
    createdAt: new Date().toISOString(),
  },
];

export const SEED_USERS: User[] = [
  {
    id: 'usr_dev1',
    fullName: 'Kwame Mensah',
    email: 'developer@lims.local',
    username: 'kmensah',
    roleId: 'developer',
    permissionOverrides: {},
    twoFactorEnabled: false,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_admin1',
    fullName: 'Abena Osei',
    email: 'admin@lims.local',
    username: 'aosei',
    roleId: 'admin',
    permissionOverrides: {},
    twoFactorEnabled: false,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_lab1',
    fullName: 'Kofi Appiah',
    email: 'kappiah@lims.local',
    username: 'kappiah',
    roleId: 'lab_technician',
    permissionOverrides: {},
    twoFactorEnabled: false,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_lab2',
    fullName: 'Ama Asare',
    email: 'aasare@lims.local',
    username: 'aasare',
    roleId: 'lab_technician',
    permissionOverrides: {},
    twoFactorEnabled: false,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_dr1',
    fullName: 'Dr. Yaw Boateng',
    email: 'yboateng@lims.local',
    username: 'yboateng',
    roleId: 'doctor',
    permissionOverrides: {},
    twoFactorEnabled: false,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_dr2',
    fullName: 'Dr. Esi Owusu',
    email: 'eowusu@lims.local',
    username: 'eowusu',
    roleId: 'doctor',
    permissionOverrides: {},
    twoFactorEnabled: false,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_admin2',
    fullName: 'Kwaku Addo',
    email: 'kaddo@lims.local',
    username: 'kaddo',
    roleId: 'admin',
    permissionOverrides: {},
    twoFactorEnabled: false,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_lab3',
    fullName: 'Yaa Nti',
    email: 'ynti@lims.local',
    username: 'ynti',
    roleId: 'lab_technician',
    permissionOverrides: {},
    twoFactorEnabled: false,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_dr3',
    fullName: 'Dr. Kojo Manu',
    email: 'kmanu@lims.local',
    username: 'kmanu',
    roleId: 'doctor',
    permissionOverrides: {},
    twoFactorEnabled: false,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_lab4',
    fullName: 'Akua Dankwa',
    email: 'adankwa@lims.local',
    username: 'adankwa',
    roleId: 'lab_technician',
    permissionOverrides: {},
    twoFactorEnabled: false,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_APP_SETTINGS: AppSettings = {
  general: {
    appName: 'LIMS',
    shortName: '',
    logoUrl: '',
    theme: 'system',
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'yyyy-MM-dd',
    timeFormat: 'HH:mm',
  },
  notifications: {
    emailEnabled: true,
    emailAddress: '',
    emailFrequency: 'realtime',
    smsEnabled: false,
    smsPhone: '',
    smsFrequency: 'realtime',
    inAppEnabled: true,
  },
  security: {
    sessionTimeoutMinutes: 30,
    passwordMinLength: 8,
    requireUppercase: false,
    requireNumbers: false,
    requireSymbols: false,
    twoFactorGlobal: false,
    twoFactorRolePolicy: {},
    ipWhitelist: [],
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15,
  },
  smtp: {
    host: 'smtp.lims.local',
    port: 587,
    username: 'lims_mailer',
    password: '',
    fromEmail: 'noreply@lims.local',
    useTLS: true,
  },
  apiKeys: [],
};

export const SEED_DB_CONFIGS: DatabaseConfig[] = [
  {
    id: 'cfg_pg1',
    name: 'PostgreSQL Prod Config',
    dbType: 'postgresql',
    host: 'localhost',
    port: 5432,
    dbName: 'lims_db',
    username: 'postgres',
    password: '',
    ssl: false,
    isActive: false,
    lastTestResult: null,
  },
  {
    id: 'cfg_sqlite1',
    name: 'SQLite Local Config',
    dbType: 'sqlite',
    connectionString: 'file:./lims.db',
    isActive: true,
    lastTestResult: null,
  },
];
