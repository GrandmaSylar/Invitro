import { Request, Response, NextFunction } from 'express';
import { DatabaseManager } from '../services/dbManager';
import { UserEntity } from '../entities/User';
import { RoleEntity } from '../entities/Role';

// Extend Express Request interface to include resolved user and permissions
declare global {
  namespace Express {
    interface Request {
      user?: UserEntity;
      permissions?: Record<string, boolean>;
    }
  }
}

/**
 * Middleware to authenticate requests via 'x-user-id' header.
 * This is a simplistic approach for local/alpha development.
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required. Missing x-user-id header.' });
    }

    if (!DatabaseManager.hasActiveConnection()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const dataSource = DatabaseManager.getDataSource();
    const userRepo = dataSource.getRepository(UserEntity);
    
    const user = await userRepo.findOneBy({ id: userId });
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Invalid or inactive user account' });
    }

    const roleRepo = dataSource.getRepository(RoleEntity);
    const role = await roleRepo.findOneBy({ id: user.roleId });
    
    if (!role) {
      return res.status(403).json({ error: 'User role is invalid' });
    }

    // Merge role permissions with user permission overrides
    const resolvedPermissions = {
      ...role.permissions,
      ...(user.permissionOverrides || {})
    };

    req.user = user;
    req.permissions = resolvedPermissions;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({ error: 'Internal server authentication error' });
  }
};

/**
 * Middleware to enforce ORM-level access policies (RBAC).
 * Must be used AFTER requireAuth.
 * @param requiredPermissions Array of permission keys that the user must possess.
 */
export const requirePermissions = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.permissions) {
      return res.status(401).json({ error: 'Authentication required before checking permissions' });
    }

    // A system admin or developer might have wildcard access depending on implementation, 
    // but here we check for exact keys.
    const hasAll = requiredPermissions.every(p => req.permissions![p] === true);
    
    if (!hasAll) {
      return res.status(403).json({ 
        error: 'Forbidden. You do not have the required permissions for this action.',
        required: requiredPermissions
      });
    }

    next();
  };
};
