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

export interface DatabaseConfig {
  id: string;
  name: string;
  dbType: 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver' | string;
  host?: string;
  port?: number;
  dbName?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  sslCertificate?: string;
  connectionString?: string;
  poolSize?: number;
  timeoutMs?: number;
  advancedOptions?: Record<string, string>;
  isActive: boolean;
  lastTestedAt?: string;
  lastTestResult?: 'success' | 'failure' | null;
}

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
