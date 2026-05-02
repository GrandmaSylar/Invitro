import React, { useState, useEffect } from 'react';
import { useRbacStore } from '../../stores/useRbacStore';
import { rbacService } from '../../services/rbacService';
import { User, Role, PermissionMap } from '../../lib/types';
import { PERMISSION_MODULES } from '../../lib/permissions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../app/components/ui/dialog';
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
import { X, UserX, Eye, EyeOff } from 'lucide-react';

interface UserEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  user?: User;
  onSuccess?: () => void;
}

export function UserEditor({ open, onOpenChange, mode, user, onSuccess }: UserEditorProps) {
  const { roles } = useRbacStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
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
          password: '',
          roleId: user.roleId,
          sendInvite: false,
        });
        setLocalOverrides({ ...(user.permissionOverrides || {}) });
      } else {
        setFormData({
          fullName: '',
          email: '',
          username: '',
          password: '',
          roleId: roles.length > 0 ? roles[0].id : '',
          sendInvite: true,
        });
        setLocalOverrides({});
      }
      setSelectedPermission('');
      setShowPassword(false);
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
      onSuccess?.();
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
          password: formData.password || undefined,
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
          ...(formData.password ? { password: formData.password } : {})
        });
        await rbacService.updateUserOverrides(user.id, localOverrides);
        toast.success('User updated successfully');
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(mode === 'create' ? 'Failed to create user' : 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-2xl flex flex-col max-h-[90vh] z-[100] p-0 gap-0 overflow-hidden backdrop-blur-sm">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{mode === 'create' ? 'Invite New User' : 'Edit User'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Add a new user to the system and assign their role.' 
              : 'Update user details and role assignment.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 px-6 py-4 overflow-y-auto">
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
              <Label htmlFor="password">{mode === 'create' ? 'Initial Password' : 'Reset Password'}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder={mode === 'create' ? "Leave empty to use default (tempPassword123!)" : "Leave empty to keep current password"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
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
        </div>
        
        <div className="px-6 py-4 border-t mt-auto space-y-4 bg-muted/10">
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
      </DialogContent>
    </Dialog>
  );
}
