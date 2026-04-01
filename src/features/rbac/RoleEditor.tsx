import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../app/components/ui/dialog";
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
import { Button } from "../../app/components/ui/button";
import { Input } from "../../app/components/ui/input";
import { Textarea } from "../../app/components/ui/textarea";
import { Label } from "../../app/components/ui/label";
import { Role } from "../../lib/types";
import { rbacService } from "../../services/rbacService";
import { useRbacStore } from "../../stores/useRbacStore";
import { ALL_PERMISSION_KEYS } from "../../lib/permissions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface RoleEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  role?: Role;
}

export function RoleEditor({ open, onOpenChange, mode, role }: RoleEditorProps) {
  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && role) {
        setName(role.name);
        setLabel(role.label);
        setDescription(role.description || '');
      } else {
        setName('');
        setLabel('');
        setDescription('');
      }
      setIsDeleting(false);
      setIsSaving(false);
    }
  }, [open, mode, role]);

  const handleSave = async () => {
    if (!name.trim() || !label.trim()) {
      toast.error('Role name and label are required');
      return;
    }

    setIsSaving(true);
    try {
      if (mode === 'create') {
        const initialPermissions = Object.fromEntries(ALL_PERMISSION_KEYS.map(k => [k, false]));
        await rbacService.createRole({
          name: name.trim(),
          label: label.trim(),
          description: description.trim(),
          isSystem: false,
          permissions: initialPermissions
        });
        toast.success('Role created successfully');
      } else if (mode === 'edit' && role) {
        useRbacStore.getState().updateRoleMetadata(role.id, {
          label: label.trim(),
          description: description.trim()
        });
        toast.success('Role updated successfully');
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!role) return;
    setIsSaving(true);
    try {
      await rbacService.deleteRole(role.id);
      toast.success('Role deleted successfully');
      setIsDeleting(false);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete role');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'Create Custom Role' : 'Edit Role'}</DialogTitle>
            <DialogDescription>
              {mode === 'create' 
                ? 'Create a new role with a custom set of permissions.' 
                : 'Modify role details or permanently remove this role.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Internal Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., test_validator"
                disabled={mode === 'edit' || isSaving}
              />
              {mode === 'edit' && <p className="text-[10px] text-muted-foreground">Internal name cannot be changed.</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="label">Display Label</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Test Validator"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe the purpose of this role..."
                disabled={isSaving}
              />
            </div>
          </div>
          
          <DialogFooter className="flex w-full items-center justify-between sm:justify-between">
            {mode === 'edit' && role && !role.isSystem ? (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={() => setIsDeleting(true)}
                disabled={isSaving}
              >
                Delete Role
              </Button>
            ) : (
              <div></div>
            )}
            
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the "{role?.label}" role? This action cannot be undone. Users currently holding this role must be reassigned first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isSaving} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
