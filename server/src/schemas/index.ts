import { z } from 'zod';
// ═══════════════════════════════════════════════════════════════
//  AUTH / USERS SCHEMAS
// ═══════════════════════════════════════════════════════════════

export const loginSchema = z.object({
  body: z.object({
    login: z.string().min(1, 'Login is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const createUserSchema = z.object({
  body: z.object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email address'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    roleId: z.string().min(1, 'Role ID is required'),
    phone: z.string().optional(),
    permissionOverrides: z.record(z.boolean()).optional(),
    twoFactorEnabled: z.boolean().optional(),
    twoFactorMethod: z.enum(['totp', 'sms', 'email']).optional(),
    status: z.enum(['active', 'inactive', 'suspended']).optional().default('active'),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    fullName: z.string().min(1, 'Full name is required').optional(),
    email: z.string().email('Invalid email address').optional(),
    username: z.string().min(3, 'Username must be at least 3 characters').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    roleId: z.string().min(1, 'Role ID is required').optional(),
    phone: z.string().optional(),
    permissionOverrides: z.record(z.boolean()).optional(),
    twoFactorEnabled: z.boolean().optional(),
    twoFactorMethod: z.enum(['totp', 'sms', 'email']).optional(),
    status: z.enum(['active', 'inactive', 'suspended']).optional(),
  }),
});

export const createRoleSchema = z.object({
  body: z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Name is required'),
    label: z.string().min(1, 'Label is required'),
    description: z.string().optional(),
    isSystem: z.boolean().optional(),
    permissions: z.record(z.boolean()).optional(),
  }),
});

// ═══════════════════════════════════════════════════════════════
//  SETUP SCHEMAS
// ═══════════════════════════════════════════════════════════════

export const provisionSchema = z.object({
  body: z.object({
    dbType: z.string().min(1, 'Database type is required'),
    host: z.string().optional(),
    port: z.number().optional(),
    dbName: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    connectionString: z.string().optional(),
    ssl: z.boolean().optional(),
    poolSize: z.number().optional(),
    timeoutMs: z.number().optional(),
  }),
});

export const adminSetupSchema = z.object({
  body: z.object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email format'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});
