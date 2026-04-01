import { useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import { useRbacStore } from '../../stores/useRbacStore';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface AccessDeniedProps {
  permissionKey?: string;
}

export function AccessDenied({ permissionKey }: AccessDeniedProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const roles = useRbacStore((state) => state.roles);
  
  const role = roles.find(r => r.id === user?.roleId);
  const roleLabel = role ? role.name : 'Unknown Role';

  return (
    <div className="flex flex-col items-center justify-center p-8 h-full min-h-[60vh] text-foreground">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this resource.
          </p>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-muted-foreground">Your Role</span>
            <Badge variant="outline">{roleLabel}</Badge>
          </div>
          
          {permissionKey && (
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-muted-foreground">Required</span>
              <Badge variant="destructive" className="font-mono text-xs">{permissionKey}</Badge>
            </div>
          )}
        </div>
        
        <Button onClick={() => navigate('/')} className="w-full">
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
