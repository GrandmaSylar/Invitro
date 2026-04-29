import { useState, useEffect } from 'react';
import { useRbacStore } from '../../stores/useRbacStore';
import { rbacService } from '../../services/rbacService';
import { PERMISSION_MODULES } from '../../lib/permissions';
import { PermissionMap } from '../../lib/types';
import { Button } from '../../app/components/ui/button';
import { Switch } from '../../app/components/ui/switch';
import { Badge } from '../../app/components/ui/badge';
import { Card, CardContent, CardHeader } from '../../app/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../app/components/ui/tooltip';
import { PermissionGate } from './PermissionGate';
import { AccessDenied } from '../../app/components/AccessDenied';
import { RoleEditor } from './RoleEditor';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../app/components/ui/alert-dialog";
import { toast } from 'sonner';
import { Edit, Loader2, ChevronDown, ChevronRight } from 'lucide-react';

export function PermissionMatrix() {
  const { roles, users, setRoles } = useRbacStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [localPermissions, setLocalPermissions] = useState<PermissionMap>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => {
    return PERMISSION_MODULES.reduce((acc, mod) => ({ ...acc, [mod.label]: true }), {});
  });

  // Sync with database on mount
  useEffect(() => {
    const fetchRoles = async () => {
      setIsLoading(true);
      try {
        const data = await rbacService.getRoles();
        setRoles(data);
      } catch (err) {
        console.error('Failed to sync roles:', err);
        toast.error('Failed to sync roles with database');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoles();
  }, [setRoles]);

  // Initialize selectedRoleId
  useEffect(() => {
    if (!selectedRoleId && roles.length > 0) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  const selectedRole = roles.find(r => r.id === selectedRoleId);

  // Sync local permissions when selected role changes
  useEffect(() => {
    if (selectedRole) {
      setLocalPermissions({ ...selectedRole.permissions });
      setIsDirty(false);
    }
  }, [selectedRole?.id, selectedRole?.permissions]);

  const handleTogglePermission = (key: string, checked: boolean) => {
    setLocalPermissions(prev => ({
      ...prev,
      [key]: checked
    }));
    setIsDirty(true);
  };

  const handleToggleModule = (moduleKeys: string[]) => {
    const allChecked = moduleKeys.every(k => localPermissions[k]);
    const nextState = !allChecked;
    
    setLocalPermissions(prev => {
      const updated = { ...prev };
      moduleKeys.forEach(k => {
        updated[k] = nextState;
      });
      return updated;
    });
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;
    setIsSaving(true);
    try {
      await rbacService.updateRolePermissions(selectedRoleId, localPermissions);
      toast.success('Permissions updated successfully');
      setIsDirty(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save permissions');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!selectedRole) return;
    
    setIsSaving(true);
    try {
      let resetPermissions: PermissionMap = {};
      // For custom or system roles, reset to basically empty if no template
      resetPermissions = Object.keys(localPermissions).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {} as PermissionMap);
      
      await rbacService.updateRolePermissions(selectedRole.id, resetPermissions);
      setLocalPermissions(resetPermissions);
      setIsDirty(false);
      toast.success('Permissions reset to defaults');
      setResetDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset permissions');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PermissionGate require="rbac.manage_roles" fallback={<AccessDenied permissionKey="rbac.manage_roles" />}>
      <div className="flex h-full w-full bg-background overflow-hidden relative">
        
        {/* Left Panel - Sidebar */}
        <div className="w-[260px] flex-shrink-0 border-r border-border bg-card flex flex-col h-full z-10">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Roles</h2>
            <p className="text-xs text-muted-foreground mt-1">Select a role to manage its permissions</p>
          </div>
          
          <div className="flex-1 overflow-y-auto py-2">
            {roles.map(role => {
              const userCount = users.filter(u => u.roleId === role.id).length;
              const isSelected = role.id === selectedRoleId;
              
              return (
                <div 
                  key={role.id}
                  onClick={() => {
                    if (isDirty) {
                      if (window.confirm("You have unsaved changes. Change role anyway?")) {
                        setSelectedRoleId(role.id);
                      }
                    } else {
                      setSelectedRoleId(role.id);
                    }
                  }}
                  className={`
                    flex items-center justify-between px-4 py-3 cursor-pointer transition-colors border-l-2 group
                    ${isSelected 
                      ? 'bg-primary/10 text-primary font-semibold border-primary' 
                      : 'border-transparent text-foreground hover:bg-muted/50'}
                  `}
                >
                  <div className="flex flex-col gap-1 pr-2 overflow-hidden">
                    <span className="truncate">{role.label}</span>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px] py-0 px-1 border-border bg-background">
                        {userCount} user{userCount !== 1 ? 's' : ''}
                      </Badge>
                      {role.id === 'developer' && (
                        <Badge variant="secondary" className="text-[10px] py-0 px-1 bg-secondary text-secondary-foreground">
                          Superuser
                        </Badge>
                      )}
                    </div>
                  </div>
                  {!role.isSystem && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-7 w-7 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditorMode('edit');
                        setSelectedRoleId(role.id);
                        setEditorOpen(true);
                      }}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="p-4 border-t border-border">
            <Button 
              variant="outline" 
              className="w-full border-dashed bg-transparent"
              onClick={() => {
                setEditorMode('create');
                setEditorOpen(true);
              }}
            >
              Create Custom Role
            </Button>
          </div>
        </div>

        {/* Right Panel - Matrix */}
        <div className="flex-1 flex flex-col overflow-hidden h-full">
          {selectedRole ? (
            <>
              {/* Header */}
              <div className="px-8 py-5 border-b border-border flex items-center justify-between shadow-sm z-10 bg-background shrink-0">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Permissions — {selectedRole.label}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedRole.description || (selectedRole.isSystem ? 'System built-in role.' : 'Custom user-defined role.')}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="text-destructive border-border hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setResetDialogOpen(true)}
                    disabled={isSaving || selectedRole.id === 'developer'}
                  >
                    Reset to Defaults
                  </Button>
                  <Button
                    variant="default"
                    onClick={handleSave}
                    disabled={!isDirty || isSaving || selectedRole.id === 'developer'}
                  >
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </div>

              {/* Scrollable matrix */}
              <div className="flex-1 overflow-auto p-8">
                <div className="grid gap-6">
                  {PERMISSION_MODULES.map(mod => {
                    const keys = mod.permissions.map(p => p.key);
                    const allChecked = keys.every(k => localPermissions[k]);
                    
                    return (
                      <Card key={mod.label} className="border-border overflow-hidden">
                        <CardHeader 
                          className="py-4 flex flex-row items-center justify-between border-b border-border bg-muted/40 shrink-0 cursor-pointer hover:bg-muted/60 transition-colors"
                          onClick={() => setExpandedModules(prev => ({ ...prev, [mod.label]: !prev[mod.label] }))}
                        >
                          <div className="flex items-center gap-2 font-medium">
                            {expandedModules[mod.label] ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground mr-1" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground mr-1" />
                            )}
                            <mod.icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                            <h3 className="text-foreground">{mod.label}</h3>
                          </div>
                          <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                            {selectedRole.id !== 'developer' && (
                              <button
                                type="button"
                                className="text-primary text-sm font-medium hover:underline focus:outline-none"
                                onClick={() => handleToggleModule(keys)}
                              >
                                {allChecked ? 'Deselect All' : 'Select All'}
                              </button>
                            )}
                          </div>
                        </CardHeader>
                        {expandedModules[mod.label] && (
                        <CardContent className="p-0">
                          {mod.permissions.map((perm, index) => {
                            const isLast = index === mod.permissions.length - 1;
                            const isChecked = localPermissions[perm.key] || false;
                            
                            const switchEl = (
                              <Switch
                                id={`perm-${perm.key}`}
                                checked={isChecked}
                                onCheckedChange={(val) => handleTogglePermission(perm.key, val)}
                                disabled={selectedRole.id === 'developer'}
                              />
                            );
                            
                            return (
                              <div 
                                key={perm.key} 
                                className={`flex items-center justify-between p-4 ${!isLast ? 'border-b border-border' : ''} hover:bg-muted/20 transition-colors`}
                              >
                                <div className="flex flex-col gap-1 pr-8">
                                  <label htmlFor={`perm-${perm.key}`} className={`text-sm font-semibold cursor-pointer ${selectedRole.id === 'developer' ? 'opacity-70' : ''}`}>
                                    {perm.label}
                                  </label>
                                  <p className="text-xs text-muted-foreground">{perm.description}</p>
                                </div>
                                <div className="shrink-0 flex items-center">
                                  {selectedRole.id === 'developer' ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>{switchEl}</TooltipTrigger>
                                      <TooltipContent>Developer has unrestricted access</TooltipContent>
                                    </Tooltip>
                                  ) : switchEl}
                                </div>
                              </div>
                            );
                          })}
                        </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a role to manage permissions
            </div>
          )}
        </div>
        
        <RoleEditor 
          open={editorOpen} 
          onOpenChange={setEditorOpen} 
          mode={editorMode} 
          role={editorMode === 'edit' ? selectedRole : undefined} 
        />
        
        <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Permissions</AlertDialogTitle>
              <AlertDialogDescription>
                Reset permissions for {selectedRole?.label} to defaults? This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={(e) => { e.preventDefault(); handleReset(); }} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Reset to Defaults
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
      </div>
    </PermissionGate>
  );
}
