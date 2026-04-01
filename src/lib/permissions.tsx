import { LucideIcon, BarChart3, Stethoscope, TestTubes, Hospital, ClipboardPen, User, Settings, ShieldCheck } from 'lucide-react';

export const PERMISSIONS = {
  'dashboard.view': 'dashboard.view',
  'patients.view': 'patients.view',
  'patients.create': 'patients.create',
  'patients.edit': 'patients.edit',
  'patients.delete': 'patients.delete',
  'test_register.view': 'test_register.view',
  'test_register.edit': 'test_register.edit',
  'hospital_records.view': 'hospital_records.view',
  'hospital_records.edit': 'hospital_records.edit',
  'results_entry.view': 'results_entry.view',
  'results_entry.edit': 'results_entry.edit',
  'profile.view': 'profile.view',
  'settings.view': 'settings.view',
  'settings.general': 'settings.general',
  'settings.notifications': 'settings.notifications',
  'settings.security': 'settings.security',
  'settings.users': 'settings.users',
  'settings.smtp': 'settings.smtp',
  'settings.api_keys': 'settings.api_keys',
  'settings.backup': 'settings.backup',
  'settings.audit_log': 'settings.audit_log',
  'settings.health': 'settings.health',
  'settings.database': 'settings.database',
  'rbac.manage_roles': 'rbac.manage_roles',
  'rbac.manage_users': 'rbac.manage_users',
  'rbac.view_audit': 'rbac.view_audit',
} as const;

export const ALL_PERMISSION_KEYS = Object.values(PERMISSIONS);

export interface PermissionModule {
  label: string;
  icon: LucideIcon;
  permissions: { key: string; label: string; description: string }[];
}

export const PERMISSION_MODULES: PermissionModule[] = [
  {
    label: 'Dashboard',
    icon: BarChart3,
    permissions: [
      { key: 'dashboard.view', label: 'View Dashboard', description: 'Access the main dashboard' },
    ]
  },
  {
    label: 'Patients',
    icon: Stethoscope,
    permissions: [
      { key: 'patients.view', label: 'View Patients', description: 'View patient records' },
      { key: 'patients.create', label: 'Create Patients', description: 'Add new patients' },
      { key: 'patients.edit', label: 'Edit Patients', description: 'Modify patient details' },
      { key: 'patients.delete', label: 'Delete Patients', description: 'Remove patient records' },
    ]
  },
  {
    label: 'Test Register',
    icon: TestTubes,
    permissions: [
      { key: 'test_register.view', label: 'View Test Register', description: 'View test register' },
      { key: 'test_register.edit', label: 'Edit Test Register', description: 'Manage test register' },
    ]
  },
  {
    label: 'Hospital Records',
    icon: Hospital,
    permissions: [
      { key: 'hospital_records.view', label: 'View Records', description: 'View hospital records' },
      { key: 'hospital_records.edit', label: 'Edit Records', description: 'Manage hospital records' },
    ]
  },
  {
    label: 'Results Entry',
    icon: ClipboardPen,
    permissions: [
      { key: 'results_entry.view', label: 'View Results', description: 'View test results' },
      { key: 'results_entry.edit', label: 'Edit Results', description: 'Enter or modify test results' },
    ]
  },
  {
    label: 'Profile',
    icon: User,
    permissions: [
      { key: 'profile.view', label: 'View Profile', description: 'View user profile' },
    ]
  },
  {
    label: 'Settings',
    icon: Settings,
    permissions: [
      { key: 'settings.view', label: 'View Settings', description: 'Access settings menu' },
      { key: 'settings.general', label: 'General Settings', description: 'Manage general settings' },
      { key: 'settings.notifications', label: 'Notification Settings', description: 'Manage notification preferences' },
      { key: 'settings.security', label: 'Security Settings', description: 'Manage security configurations' },
      { key: 'settings.users', label: 'User Settings', description: 'Manage users' },
      { key: 'settings.smtp', label: 'SMTP Settings', description: 'Manage email settings' },
      { key: 'settings.api_keys', label: 'API Keys', description: 'Manage API access keys' },
      { key: 'settings.backup', label: 'Backup Settings', description: 'Manage data backups' },
      { key: 'settings.audit_log', label: 'Audit Log', description: 'View system audit logs' },
      { key: 'settings.health', label: 'System Health', description: 'View system health metrics' },
      { key: 'settings.database', label: 'Database Settings', description: 'Manage database configuration' },
    ]
  },
  {
    label: 'RBAC Management',
    icon: ShieldCheck,
    permissions: [
      { key: 'rbac.manage_roles', label: 'Manage Roles', description: 'Create, edit, or delete custom roles' },
      { key: 'rbac.manage_users', label: 'Manage Users', description: 'Assign roles and overrides to users' },
      { key: 'rbac.view_audit', label: 'View Audit Logs', description: 'View RBAC related audit logs' },
    ]
  }
];
