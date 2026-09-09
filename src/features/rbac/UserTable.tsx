import React, { useState } from 'react';
import { useRbacStore } from '../../stores/useRbacStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { rbacService } from '../../services/rbacService';
import { showConfirm, showSuccess } from '../../stores/useDialogStore';
import { User, Role } from '../../lib/types';
import { PermissionGate } from './PermissionGate';
import { AccessDenied } from '../../app/components/AccessDenied';
import { UserEditor } from './UserEditor';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../app/components/ui/table';
import { Input } from '../../app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../app/components/ui/select';
import { Button } from '../../app/components/ui/button';
import { Avatar, AvatarFallback } from '../../app/components/ui/avatar';
import { Badge } from '../../app/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../app/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../app/components/ui/alert-dialog';
import { Search, MoreVertical, Plus, UserCheck, UserX, Edit2 } from 'lucide-react';
import { DataTablePagination } from '../../app/components/ui/DataTablePagination';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 8;

const ROLE_COLORS: Record<string, string> = {
  developer: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  lab_technician: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
  doctor: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
};

const getRoleColor = (roleId: string) => ROLE_COLORS[roleId] || 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export function UserTable() {
  const { users, roles, setUsers, setRoles } = useRbacStore();
  const [isLoading, setIsLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  
  const [deactivateTarget, setDeactivateTarget] = useState<User | undefined>(undefined);

  const refreshData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([
        rbacService.getUsers(),
        rbacService.getRoles()
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (err) {
      console.error('Failed to sync RBAC data:', err);
      toast.error('Failed to sync users and roles with database');
    } finally {
      setIsLoading(false);
    }
  }, [setUsers, setRoles]);

  // Sync with database on mount
  React.useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Derived data
  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.roleId === roleFilter;
    return matchesSearch && matchesRole;
  });

  const currentUser = useAuthStore((s) => s.user);

  const paginatedUsers = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

  const handleDeactivateConfirm = async () => {
    if (!deactivateTarget) return;

    if (deactivateTarget.id === currentUser?.id) {
      toast.error('You cannot deactivate your own logged-in account.');
      setDeactivateTarget(undefined);
      return;
    }

    if (deactivateTarget.roleId === 'developer' && currentUser?.roleId !== 'developer') {
      toast.error('You do not have permission to deactivate a developer account.');
      setDeactivateTarget(undefined);
      return;
    }

    try {
      await rbacService.deactivateUser(deactivateTarget.id);
      toast.success('User deactivated successfully');
      await refreshData();
    } catch (error) {
      toast.error('Failed to deactivate user');
    } finally {
      setDeactivateTarget(undefined);
    }
  };

  const handleReactivate = async (userId: string) => {
    const confirmed = await showConfirm({
      title: "Reactivate User",
      description: "Are you sure you want to reactivate this user?",
      confirmText: "Reactivate"
    });
    if (!confirmed) return;
    try {
      await rbacService.updateUser(userId, { status: 'active' });
      showSuccess({ title: "User Reactivated", description: "The user has been reactivated successfully." });
      await refreshData();
    } catch (error) {
      toast.error('Failed to reactivate user');
    }
  };

  const openEditor = (mode: 'create' | 'edit', user?: User) => {
    setEditorMode(mode);
    setSelectedUser(user);
    setEditorOpen(true);
  };

  return (
    <PermissionGate require="rbac.manage_users" fallback={<AccessDenied permissionKey="rbac.manage_users" />}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
            <p className="text-muted-foreground">Manage users, their roles, and individual permissions.</p>
          </div>
          <Button onClick={() => openEditor('create')} className="gap-2">
            <Plus size={16} /> Create User
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-card p-4 rounded-lg border border-border shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              className="pl-9"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={roleFilter} onValueChange={(val) => {
              setRoleFilter(val);
              setPage(0);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((role: Role) => (
                  <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Avatar</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No users found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user: User) => {
                  const role = roles.find((r: Role) => r.id === user.roleId);
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                            {getInitials(user.fullName)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{user.fullName}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`capitalize font-medium ${getRoleColor(user.roleId)} border-0`}>
                          {role?.name || user.roleId}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.status === 'active' ? (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400 border-0 hover:bg-emerald-100">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditor('edit', user)} className="gap-2 cursor-pointer">
                              <Edit2 size={14} /> Edit User
                            </DropdownMenuItem>
                            {user.status === 'active' ? (
                              <DropdownMenuItem 
                                onClick={() => setDeactivateTarget(user)}
                                className="text-destructive focus:text-destructive gap-2 cursor-pointer"
                              >
                                <UserX size={14} /> Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleReactivate(user.id)}
                                className="text-emerald-600 focus:text-emerald-700 gap-2 cursor-pointer"
                              >
                                <UserCheck size={14} /> Reactivate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          <DataTablePagination
            currentPage={page}
            pageSize={pageSize}
            totalItems={filteredUsers.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      <UserEditor 
        open={editorOpen} 
        onOpenChange={setEditorOpen} 
        mode={editorMode} 
        user={selectedUser} 
        onSuccess={refreshData}
      />

      <AlertDialog open={!!deactivateTarget} onOpenChange={(open) => !open && setDeactivateTarget(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate {deactivateTarget?.fullName}? They will no longer be able to log in, but their data will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivateConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PermissionGate>
  );
}
