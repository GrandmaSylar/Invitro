import { Router, Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { DatabaseManager } from '../services/dbManager';
import { UserEntity } from '../entities/User';
import { RoleEntity } from '../entities/Role';
import { validate } from '../middleware/validate';
import { requireAuth, requirePermissions } from '../middleware/auth';
import { loginSchema, createUserSchema, updateUserSchema, createRoleSchema } from '../schemas';

const router = Router();

// ── Middleware guard ────────────────────────────────────────────
function requireDb(_req: Request, res: Response, next: Function): void {
  if (!DatabaseManager.hasActiveConnection()) {
    res.status(503).json({ error: 'Database not connected' });
    return;
  }
  next();
}

// ═══════════════════════════════════════════════════════════════
//  USERS
// ═══════════════════════════════════════════════════════════════

/** GET /api/auth/users — list all users (safe — no passwordHash) */
router.get('/users', requireDb, requireAuth, requirePermissions(['system.users']), async (_req: Request, res: Response) => {
  try {
    const repo = DatabaseManager.getDataSource().getRepository(UserEntity);
    const users = await repo.find();
    res.json({ users: users.map((u) => u.toSafeJSON()) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/auth/users/:id — single user */
router.get('/users/:id', requireDb, requireAuth, requirePermissions(['system.users']), async (req: Request, res: Response) => {
  try {
    const repo = DatabaseManager.getDataSource().getRepository(UserEntity);
    const user = await repo.findOneBy({ id: req.params.id });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user.toSafeJSON());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/auth/users — create user (password is hashed before storage) */
router.post('/users', requireDb, requireAuth, requirePermissions(['system.users']), validate(createUserSchema), async (req: Request, res: Response) => {
  try {
    const { password, ...rest } = req.body;

    const repo = DatabaseManager.getDataSource().getRepository(UserEntity);

    // Check uniqueness
    const existing = await repo.findOne({
      where: [{ email: rest.email }, { username: rest.username }],
    });
    if (existing) {
      res.status(409).json({ error: 'A user with that email or username already exists' });
      return;
    }

    const user = new UserEntity();
    Object.assign(user, {
      ...rest,
      id: rest.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      permissionOverrides: rest.permissionOverrides || {},
      twoFactorEnabled: rest.twoFactorEnabled ?? false,
      status: rest.status || 'active',
    });
    user.setPassword(password);
    await repo.save(user);

    res.status(201).json(user.toSafeJSON());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** PUT /api/auth/users/:id — update user (re-hashes if new password provided) */
router.put('/users/:id', requireDb, requireAuth, requirePermissions(['system.users']), validate(updateUserSchema), async (req: Request, res: Response) => {
  try {
    const repo = DatabaseManager.getDataSource().getRepository(UserEntity);
    const user = await repo.findOneBy({ id: req.params.id });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { password, ...updates } = req.body;
    Object.assign(user, updates);

    if (password) {
      user.setPassword(password);
    }

    await repo.save(user);
    res.json(user.toSafeJSON());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/auth/users/:id */
router.delete('/users/:id', requireDb, requireAuth, requirePermissions(['system.users']), async (req: Request, res: Response) => {
  try {
    const repo = DatabaseManager.getDataSource().getRepository(UserEntity);
    const result = await repo.delete(req.params.id);
    if (result.affected === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//  LOGIN
// ═══════════════════════════════════════════════════════════════

/** POST /api/auth/login — authenticate with username/email + password */
router.post('/login', requireDb, validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { login, password } = req.body;

    const repo = DatabaseManager.getDataSource().getRepository(UserEntity);

    // Fetch with passwordHash (normally excluded via select: false)
    const user = await repo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.username = :login OR user.email = :login', { login })
      .getOne();

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({ error: 'Account is not active' });
      return;
    }

    const valid = await user.validatePassword(password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Update last login timestamp
    user.lastLogin = new Date().toISOString();
    await repo.save(user);

    // Fetch associated role permissions
    const roleRepo = DatabaseManager.getDataSource().getRepository(RoleEntity);
    const role = await roleRepo.findOneBy({ id: user.roleId });

    res.json({
      user: user.toSafeJSON(),
      permissions: role?.permissions || {},
      twoFactorRequired: user.twoFactorEnabled,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/auth/2fa/verify — stub for two-factor verification */
router.post('/2fa/verify', (_req: Request, res: Response) => {
  res.json({ message: '2FA verification — not yet implemented' });
});

// ═══════════════════════════════════════════════════════════════
//  ROLES
// ═══════════════════════════════════════════════════════════════

/** GET /api/auth/roles */
router.get('/roles', requireDb, requireAuth, requirePermissions(['system.roles']), async (_req: Request, res: Response) => {
  try {
    const repo = DatabaseManager.getDataSource().getRepository(RoleEntity);
    const roles = await repo.find();
    res.json({ roles });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/auth/roles */
router.post('/roles', requireDb, requireAuth, requirePermissions(['system.roles']), validate(createRoleSchema), async (req: Request, res: Response) => {
  try {
    const repo = DatabaseManager.getDataSource().getRepository(RoleEntity);
    const existing = await repo.findOneBy({ name: req.body.name });
    if (existing) {
      res.status(409).json({ error: 'A role with that name already exists' });
      return;
    }

    const role = repo.create({
      ...req.body,
      id: req.body.id || `role_${Date.now()}`,
      permissions: req.body.permissions || {},
    });
    await repo.save(role);
    res.status(201).json(role);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** PUT /api/auth/roles/:id */
router.put('/roles/:id', requireDb, requireAuth, requirePermissions(['system.roles']), async (req: Request, res: Response) => {
  try {
    const repo = DatabaseManager.getDataSource().getRepository(RoleEntity);
    const role = await repo.findOneBy({ id: req.params.id });
    if (!role) {
      res.status(404).json({ error: 'Role not found' });
      return;
    }
    Object.assign(role, req.body);
    await repo.save(role);
    res.json(role);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/auth/roles/:id */
router.delete('/roles/:id', requireDb, requireAuth, requirePermissions(['system.roles']), async (req: Request, res: Response) => {
  try {
    const repo = DatabaseManager.getDataSource().getRepository(RoleEntity);
    const role = await repo.findOneBy({ id: req.params.id });
    if (!role) {
      res.status(404).json({ error: 'Role not found' });
      return;
    }
    if (role.isSystem) {
      res.status(400).json({ error: 'Cannot delete a system role' });
      return;
    }
    await repo.delete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
