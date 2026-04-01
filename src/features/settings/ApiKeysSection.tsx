import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../app/components/ui/card';
import { Button } from '../../app/components/ui/button';
import { Input } from '../../app/components/ui/input';
import { Label } from '../../app/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../app/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../app/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../app/components/ui/alert-dialog';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { settingsService } from '../../services/settingsService';
import { useAuditLog } from '../../hooks/useAuditLog';
import { ApiKey } from '../../lib/types';
import { toast } from 'sonner';

export default function ApiKeysSection() {
  const { settings } = useSettingsStore();
  const { addEvent } = useAuditLog();

  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [keyNameInput, setKeyNameInput] = useState('');
  
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);
  
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);

  const apiKeys = settings.apiKeys || [];

  const handleGenerateConfirm = async () => {
    if (!keyNameInput.trim()) {
      toast.error('Key name is required');
      return;
    }
    
    const fullKey = `sk_live_${crypto.randomUUID().replace(/-/g, '')}`;

    try {
      const createdKey = await settingsService.createApiKey({
        name: keyNameInput.trim(),
        key: fullKey,
        permissions: []
      });

      setNewlyGeneratedKey(fullKey);
      setGenerateDialogOpen(false);
      setKeyNameInput('');
      addEvent({
        actorId: 'admin',
        actorName: 'Admin',
        action: 'API_KEY_CREATED',
        targetType: 'API_KEY',
        targetId: createdKey.id,
        targetName: keyNameInput.trim(),
        detail: `Generated new API key "${keyNameInput.trim()}"`,
      });
    } catch (e) {
      toast.error('Failed to generate key');
    }
  };

  const handleCopyKey = () => {
    if (newlyGeneratedKey) {
      navigator.clipboard.writeText(newlyGeneratedKey);
      toast.success('Copied to clipboard');
      setNewlyGeneratedKey(null); // Close the display dialog
    }
  };

  const handleRevokeConfirm = async () => {
    if (!revokeTarget) return;

    try {
      await settingsService.revokeApiKey(revokeTarget.id);
      addEvent({
        actorId: 'admin',
        actorName: 'Admin',
        action: 'API_KEY_REVOKED',
        targetType: 'API_KEY',
        targetId: revokeTarget.id,
        targetName: revokeTarget.name,
        detail: `Revoked API key "${revokeTarget.name}"`,
      });
      toast.success('API key revoked successfully');
    } catch (e) {
      toast.error('Failed to revoke key');
    } finally {
      setRevokeTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle>API Keys</CardTitle>
            <CardDescription>Manage active API keys for programmatic access.</CardDescription>
          </div>
          <Button onClick={() => setGenerateDialogOpen(true)}>Generate New Key</Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Prefix</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No API keys yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  apiKeys.map((k) => (
                    <TableRow key={k.id}>
                      <TableCell className="font-medium">{k.name}</TableCell>
                      <TableCell className="font-mono text-sm">{k.key.substring(0, 10) + '****'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(k.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {k.lastUsed ? new Date(k.lastUsed).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => setRevokeTarget(k)}
                        >
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Generate Key Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate API Key</DialogTitle>
            <DialogDescription>
              Create a new API key. It will inherit your current permissions by default.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="keyName">Key Name</Label>
              <Input
                id="keyName"
                placeholder="e.g. Production Server CI"
                value={keyNameInput}
                onChange={(e) => setKeyNameInput(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerateConfirm} disabled={!keyNameInput.trim()}>Generate Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Newly Generated Key Display */}
      <Dialog open={!!newlyGeneratedKey} onOpenChange={(open) => !open && setNewlyGeneratedKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Store your API key</DialogTitle>
            <DialogDescription className="text-destructive font-semibold">
              This is the only time you'll see this key. Store it securely!
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-muted font-mono text-sm break-all rounded-md select-all">
              {newlyGeneratedKey}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCopyKey} className="w-full">Copy and Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation */}
      <AlertDialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              Any applications using the key <span className="font-semibold text-foreground">"{revokeTarget?.name}"</span> will instantly lose access. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRevokeConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
