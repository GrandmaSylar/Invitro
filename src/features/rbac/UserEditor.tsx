import React, { useState, useEffect } from 'react';
import { useRbacStore } from '../../stores/useRbacStore';
import { rbacService } from '../../services/rbacService';
import { User, Role, PermissionMap } from '../../lib/types';
import { PERMISSION_MODULES } from '../../lib/permissions';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../app/components/ui/sheet';
import { Input } from '../../app/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../../app/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../app/components/ui/alert-dialog';
import { Button } from '../../app/components/ui/button';
import { Label } from '../../app/components/ui/label';
import { Switch } from '../../app/components/ui/switch';
import { toast } from 'sonner';
import { ScrollArea } from '../../app/components/ui/scroll-area';
import { X, UserX } from 'lucide-react';

interface UserEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  user?: User;
}

export function UserEditor({ open, onOpenChange, mode, user }: UserEditorProps) {
  const { roles } = useRbacStore();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    roleId: '',
    sendInvite: true,
  });

  const [localOverrides, setLocalOverrides] = useState<PermissionMap>({});
  const [selectedPermission, setSelectedPermission] = useState<string>('');

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && user) {
        setFormData({
          fullName: user.fullName,
          email: user.email,
          username: user.username,
          roleId: user.roleId,
          sendInvite: false,
        });
        setLocalOverrides({ ...(user.permissionOverrides || {}) });
      } else {
        setFormData({
          fullName: '',
          email: '',
          username: '',
          roleId: roles.length > 0 ? roles[0].id : '',
          sendInvite: true,
        });
        setLocalOverrides({});
      }
      setSelectedPermission('');
    }
  }, [open, mode, user, roles]);

  const userRole = roles.find(r => r.id === formData.roleId);

  // Compute what actually differs from the default role permissions
  const activeOverrides = Object.entries(localOverrides).filter(([key, value]) => {
    const roleValue = userRole ? !!userRole.permissions[key as keyof PermissionMap] : false;
    return value !== roleValue;
  });

  const handleDeactivate = async () => {
    if (!user) return;
    try {
      setLoading(true);
      await rbacService.deactivateUser(user.id);
      toast.success('User deactivated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to deactivate user');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      if (mode === 'create') {
        const payload = {
          fullName: formData.fullName,
          email: formData.email,
          username: formData.username,
          roleId: formData.roleId,
          status: 'active' as const,
          twoFactorEnabled: false,
        };
        await rbacService.createUser(payload);
        
        if (formData.sendInvite) {
          toast.success(`Invitation sent to ${formData.email}`);
        } else {
          toast.success('User created successfully');
        }
      } else if (user) {
        await rbacService.updateUser(user.id, {
          fullName: formData.fullName,
          email: formData.email,
          roleId: formData.roleId,
        });
        await rbacService.updateUserOverrides(user.id, localOverrides);
        toast.success('User updated successfully');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(mode === 'create' ? 'Failed to create user' : 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full z-[100]">
        <SheetHeader>
          <SheetTitle>{mode === 'create' ? 'Invite New User' : 'Edit User'}</SheetTitle>
          <SheetDescription>
            {mode === 'create' 
              ? 'Add a new user to the system and assign their role.' 
              : 'Update user details and role assignment.'}
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="flex-1 -mx-6 px-6 py-4">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                placeholder="Goonmaster Grandma"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="goonmaster@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                placeholder="goonmastergrandma"
                disabled={mode === 'edit'}
              />
              {mode === 'edit' && (
                <p className="text-[0.8rem] text-muted-foreground">
                  Username cannot be changed after creation.
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="roleId">Role Assignment</Label>
              <Select value={formData.roleId} onValueChange={(val) => handleChange('roleId', val)}>
                <SelectTrigger id="roleId">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role: Role) => (
                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {mode === 'create' && (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Send Invitation</Label>
                  <p className="text-sm text-muted-foreground">
                    Email an invite link to the user.
                  </p>
                </div>
                <Switch
                  checked={formData.sendInvite as boolean}
                  onCheckedChange={(checked) => handleChange('sendInvite', checked)}
                />
              </div>
            )}
            
            {mode === 'edit' && user && (
              <div className="rounded-lg border p-4 space-y-4">
                <div className="space-y-1">
                  <Label className="text-base font-semibold">Individual Permission Overrides</Label>
                  <p className="text-sm text-muted-foreground">
                    Grant or revoke specific permissions superseding the user's role defaults.
                  </p>
                </div>
                
                {activeOverrides.length > 0 ? (
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-9 px-3 text-left font-medium">Permission</th>
                          <th className="h-9 px-3 text-left font-medium">Override</th>
                          <th className="h-9 w-[50px]"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeOverrides.map(([key, value]) => (
                          <tr key={key} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="p-3 align-middle font-mono text-xs">{key}</td>
                            <td className="p-3 align-middle">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${value ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
                                {value ? 'Granted' : 'Revoked'}
                              </span>
                            </td>
                            <td className="p-3 align-middle text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                  const newOverrides = { ...localOverrides };
                                  delete newOverrides[key as keyof PermissionMap];
                                  setLocalOverrides(newOverrides);
                                }}
                              >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Clear Override</span>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                    No differing individual overrides set for this user.
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Select value={selectedPermission} onValueChange={setSelectedPermission}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Add permission override..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PERMISSION_MODULES.map(mod => (
                        <SelectGroup key={mod.label}>
                          <SelectLabel>{mod.label}</SelectLabel>
                          {mod.permissions.map(p => (
                            <SelectItem key={p.key} value={p.key}>
                              {p.key}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    className="shrink-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    disabled={!selectedPermission}
                    onClick={() => {
                      if (selectedPermission) {
                        setLocalOverrides(prev => ({ ...prev, [selectedPermission as keyof PermissionMap]: true }));
                        setSelectedPermission('');
                      }
                    }}
                  >
                    Grant
                  </Button>
                  <Button
                    variant="outline"
                    className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={!selectedPermission}
                    onClick={() => {
                      if (selectedPermission) {
                        setLocalOverrides(prev => ({ ...prev, [selectedPermission as keyof PermissionMap]: false }));
                        setSelectedPermission('');
                      }
                    }}
                  >
                    Revoke
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="pt-6 border-t mt-auto space-y-4">
          <div className="flex items-center justify-between">
            {mode === 'edit' && user ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-2">
                    <UserX className="h-4 w-4" />
                    Deactivate User
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will deactivate <strong>{user.fullName}</strong>'s account. They will immediately lose access to the system. You can reactivate them later if needed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeactivate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Deactivate User
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <div></div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading || !formData.fullName || !formData.email || !formData.roleId}>
                {mode === 'create' ? 'Create User' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
