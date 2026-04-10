import { Router, Request, Response } from 'express';
import { ConfigService } from '../services/configService';
import { DatabaseManager } from '../services/dbManager';
import { UserEntity } from '../entities/User';
import { RoleEntity } from '../entities/Role';
import { DatabaseConfig } from '../types';
import { validate } from '../middleware/validate';
import { provisionSchema, adminSetupSchema } from '../schemas';

const router = Router();

/**
 * POST /api/setup/provision
 * Called by the Setup Wizard (Step 4 — Schema) to create all tables
 * in the target database via TypeORM synchronize.
 */
router.post('/provision', validate(provisionSchema), async (req: Request, res: Response) => {
  try {
    const config: DatabaseConfig = req.body;

    // Save the config if it doesn't exist yet
    const existing = ConfigService.getConfigs();
    let savedConfig = existing.find(
      (c) => c.host === config.host && c.port === config.port && c.dbName === config.dbName,
    );
    if (!savedConfig) {
      savedConfig = {
        ...config,
        id: config.id || `db_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        name: config.name || `${config.dbType}-${config.host || 'local'}`,
        isActive: true,
      };
      ConfigService.addConfig(savedConfig);
      ConfigService.setActiveConfig(savedConfig.id);
    } else {
      ConfigService.setActiveConfig(savedConfig.id);
    }

    // Run synchronize to create/update tables
    await DatabaseManager.provisionSchema(savedConfig);

    // Seed the default system roles if the roles table is empty
    const roleRepo = DatabaseManager.getDataSource().getRepository(RoleEntity);
    const roleCount = await roleRepo.count();
    if (roleCount === 0) {
      const defaultRoles: Partial<RoleEntity>[] = [
        {
          id: 'developer',
          name: 'developer',
          label: 'Developer',
          description: 'Full system access for development',
          isSystem: true,
          permissions: {
            'system.settings': true,
            'system.users': true,
            'system.roles': true,
            'system.audit': true,
            'system.backup': true,
            'system.api_keys': true,
            'patients.view': true,
            'patients.create': true,
            'patients.edit': true,
            'patients.delete': true,
            'results.view': true,
            'results.create': true,
            'results.edit': true,
            'results.approve': true,
            'catalog.view': true,
            'catalog.manage': true,
            'registry.view': true,
            'registry.manage': true,
          },
        },
        {
          id: 'admin',
          name: 'admin',
          label: 'Administrator',
          description: 'Administrative access',
          isSystem: true,
          permissions: {
            'system.settings': true,
            'system.users': true,
            'system.roles': true,
            'system.audit': true,
            'system.backup': true,
            'patients.view': true,
            'patients.create': true,
            'patients.edit': true,
            'results.view': true,
            'results.create': true,
            'results.edit': true,
            'results.approve': true,
            'catalog.view': true,
            'catalog.manage': true,
            'registry.view': true,
            'registry.manage': true,
          },
        },
        {
          id: 'lab_technician',
          name: 'lab_technician',
          label: 'Lab Technician',
          description: 'Standard laboratory staff',
          isSystem: true,
          permissions: {
            'patients.view': true,
            'patients.create': true,
            'patients.edit': true,
            'results.view': true,
            'results.create': true,
            'results.edit': true,
            'catalog.view': true,
            'registry.view': true,
          },
        },
        {
          id: 'viewer',
          name: 'viewer',
          label: 'Viewer',
          description: 'Read-only access',
          isSystem: true,
          permissions: {
            'patients.view': true,
            'results.view': true,
            'catalog.view': true,
            'registry.view': true,
          },
        },
      ];

      for (const roleDef of defaultRoles) {
        const role = new RoleEntity();
        Object.assign(role, roleDef);
        await roleRepo.save(role);
      }
      console.log('Seeded default system roles.');
    }

    res.json({ success: true, message: 'Schema provisioned and default roles seeded.' });
  } catch (err: any) {
    console.error('Provision error:', err);
    res.status(500).json({ error: `Provision failed: ${err.message}` });
  }
});

/**
 * POST /api/setup/admin
 * Called by the Setup Wizard (Step 5 — Admin Account) to create the
 * initial administrator user. The password is hashed via bcrypt
 * before being stored.
 */
router.post('/admin', validate(adminSetupSchema), async (req: Request, res: Response) => {
  try {
    if (!DatabaseManager.hasActiveConnection()) {
      res.status(503).json({ error: 'Database not connected — run provision first' });
      return;
    }

    const { fullName, email, username, password } = req.body;

    const dataSource = DatabaseManager.getDataSource();
    const repo = dataSource.getRepository(UserEntity);

    console.log(`[Setup] Attempting to create admin account: ${email}`);

    // Prevent duplicate admin accounts
    const existing = await repo.findOne({
      where: [{ email }, { username }],
    });
    if (existing) {
      console.warn(`[Setup] Conflict: Admin user ${email}/${username} already exists`);
      res.status(409).json({ error: 'An admin user with that email or username already exists' });
      return;
    }

    const adminUser = new UserEntity();
    Object.assign(adminUser, {
      id: `usr_admin_${Date.now()}`,
      fullName,
      email,
      username,
      roleId: 'developer',
      permissionOverrides: {},
      twoFactorEnabled: false,
      status: 'active',
    });
    adminUser.setPassword(password);
    const savedAdmin = await repo.save(adminUser);
    
    console.log(`[Setup] Successfully persisted admin account: ${savedAdmin.email} (ID: ${savedAdmin.id})`);

    res.status(201).json({
      success: true,
      user: adminUser.toSafeJSON(),
      message: 'Admin account created successfully.',
    });
  } catch (err: any) {
    console.error('Admin creation error:', err);
    res.status(500).json({ error: `Failed to create admin: ${err.message}` });
  }
});

export default router;
