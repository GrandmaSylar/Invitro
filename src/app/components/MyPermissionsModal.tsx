import { useAuthStore } from "../../stores/useAuthStore";
import { ALL_PERMISSION_KEYS } from "../../lib/permissions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { authService } from "../../services/authService";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface MyPermissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MyPermissionsModal({ open, onOpenChange }: MyPermissionsModalProps) {
  const { user, resolvedPermissions } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      const syncPermissions = async () => {
        setIsLoading(true);
        try {
          await authService.refreshSession();
        } catch (error) {
          console.error("Failed to refresh session permissions:", error);
        } finally {
          setIsLoading(false);
        }
      };
      syncPermissions();
    }
  }, [open]);

  // Group by prefix
  const grouped = ALL_PERMISSION_KEYS.reduce((acc, key) => {
    const [prefix, action] = key.split('.');
    if (!acc[prefix]) {
      acc[prefix] = [];
    }
    acc[prefix].push({ key, action });
    return acc;
  }, {} as Record<string, { key: string; action: string }[]>);

  const humanize = (str: string) => {
    return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>My Permissions</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            View your current access levels across the application.
            {isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {Object.entries(grouped).map(([prefix, items]) => (
            <div key={prefix} className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                {humanize(prefix)}
              </h3>
              <div className="bg-muted/30 rounded-lg border">
                {items.map(({ key, action }, i) => {
                  const isGranted = user?.roleId === 'developer' || !!resolvedPermissions[key];
                  return (
                    <div 
                      key={key} 
                      className={`flex items-center justify-between p-3 text-sm ${
                        i !== items.length - 1 ? 'border-b' : ''
                      }`}
                    >
                      <span className="font-medium">{humanize(action)}</span>
                      {isGranted ? (
                        <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/25 dark:text-green-400 border-green-200 dark:border-green-800">
                          Granted
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Denied
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
