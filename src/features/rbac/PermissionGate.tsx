import React from 'react';
import { usePermission } from '../../hooks/usePermission';

interface PermissionGateProps {
  require: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({ require, children, fallback }: PermissionGateProps) {
  const hasPermission = usePermission(require);

  if (hasPermission) {
    return <>{children}</>;
  }

  return <>{fallback ?? null}</>;
}
