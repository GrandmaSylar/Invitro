import { Role, User, AppSettings } from './types';
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

// SEED_ROLES have been moved to the SQL database seeders and provisioners.



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


