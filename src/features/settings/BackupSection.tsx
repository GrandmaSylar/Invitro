import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../app/components/ui/card';
import { Button } from '../../app/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../app/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Download, Upload, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';

/**
 * Tables to include in the backup, ordered so that parent tables come before
 * children (this matters during restore to avoid FK constraint violations).
 *
 * `system_settings` uses id=1 (single-row), so it gets special handling.
 * `test_parameters` is a join table with a composite key, so we select *.
 */
const BACKUP_TABLES = [
  'system_settings',
  'departments',
  'roles',
  'users',
  'hospitals',
  'doctors',
  'patients',
  'parameters',
  'tests',
  'test_parameters',
  'lab_records',
  'lab_record_tests',
  'test_results',
  'payments',
  'audit_logs',
];

export default function BackupSection() {
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('lims-last-backup');
    if (stored) {
      setLastBackupAt(stored);
    }
  }, []);

  // ── Backup (export) ──────────────────────────────────────────
  const handleDownloadBackup = async () => {
    setIsWorking(true);
    try {
      const snapshot: Record<string, any[]> = {};

      for (const table of BACKUP_TABLES) {
        const { data, error } = await supabase.from(table).select('*');
        if (error) {
          console.warn(`Skipping table "${table}": ${error.message}`);
          snapshot[table] = [];
        } else {
          snapshot[table] = data ?? [];
        }
      }

      const backupData = {
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        type: 'full_database_backup',
        tables: BACKUP_TABLES,
        data: snapshot,
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `lims-full-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const timestamp = new Date().toISOString();
      localStorage.setItem('lims-last-backup', timestamp);
      setLastBackupAt(timestamp);
      
      const totalRows = Object.values(snapshot).reduce((sum, rows) => sum + rows.length, 0);
      toast.success(`Full backup generated — ${BACKUP_TABLES.length} tables, ${totalRows} rows exported.`);
    } catch (e) {
      toast.error('Failed to generate backup');
      console.error(e);
    } finally {
      setIsWorking(false);
    }
  };

  // ── Restore (import) ─────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRestoreFile(file);
      setRestoreDialogOpen(true);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRestoreConfirm = () => {
    if (!restoreFile) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      setIsWorking(true);
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        // Support legacy v1 backup files (settings-only)
        if (parsed.type === 'system_settings_backup' && parsed.data) {
          const { error } = await supabase
            .from('system_settings')
            .update({ settings: parsed.data, updated_at: new Date().toISOString() })
            .eq('id', 1);
          if (error) throw new Error(`Failed to restore settings: ${error.message}`);

          toast.success('Legacy settings backup restored. Refreshing…');
          setTimeout(() => window.location.reload(), 2000);
          return;
        }

        if (parsed.type !== 'full_database_backup' || !parsed.data) {
          throw new Error('Invalid backup file format');
        }

        const tables = parsed.tables as string[];
        let restoredRows = 0;
        let errors: string[] = [];

        // Restore in the order defined by the backup (parent → child).
        // For each table: delete existing rows, then upsert the backup data.
        // We process in reverse order for deletion (child → parent) to avoid FK issues.
        const deletionOrder = [...tables].reverse();
        for (const table of deletionOrder) {
          if (table === 'system_settings') continue; // single-row, handled separately
          const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // delete all rows
          if (error) {
            console.warn(`Could not clear table "${table}": ${error.message}`);
          }
        }

        // Now insert data in forward order (parents first)
        for (const table of tables) {
          const rows = parsed.data[table];
          if (!rows || rows.length === 0) continue;

          if (table === 'system_settings') {
            // Special handling for single-row settings table
            const settingsRow = rows[0];
            const { error } = await supabase
              .from('system_settings')
              .update({ settings: settingsRow.settings, updated_at: new Date().toISOString() })
              .eq('id', 1);
            if (error) {
              errors.push(`system_settings: ${error.message}`);
            } else {
              restoredRows += 1;
            }
            continue;
          }

          // Insert in batches of 100 to avoid payload limits
          const batchSize = 100;
          for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            const { error } = await supabase.from(table).insert(batch);
            if (error) {
              errors.push(`${table}: ${error.message}`);
              console.warn(`Restore error for "${table}" batch ${i}:`, error.message);
            } else {
              restoredRows += batch.length;
            }
          }
        }

        if (errors.length > 0) {
          toast.warning(`Restored ${restoredRows} rows with ${errors.length} issue(s). Check console for details.`, { duration: 8000 });
          console.warn('Restore issues:', errors);
        } else {
          toast.success(`Full restore complete — ${restoredRows} rows restored. Refreshing…`, { duration: 5000 });
        }

        setTimeout(() => window.location.reload(), 2500);

      } catch (err: any) {
        toast.error(err.message || 'Invalid backup file format');
      } finally {
        setIsWorking(false);
        setRestoreDialogOpen(false);
        setRestoreFile(null);
      }
    };
    reader.readAsText(restoreFile);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Backup & Restore</CardTitle>
          <CardDescription>
            Export and import all application data.
            <span className="text-xs text-muted-foreground mt-1 block">
              Covers: System settings, hospitals, doctors, patients, lab records, test results, payments, users, roles, parameters, tests, departments, and audit logs.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
            <div className="space-y-1">
              <h4 className="font-medium text-foreground">Download Full Backup</h4>
              <p className="text-sm text-muted-foreground">
                Export all database tables to a single JSON file.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Last backup: {lastBackupAt ? new Date(lastBackupAt).toLocaleString() : 'Never'}
              </p>
            </div>
            <Button onClick={handleDownloadBackup} disabled={isWorking} className="gap-2">
              <Download className="h-4 w-4" />
              {isWorking ? 'Exporting…' : 'Download Backup'}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
            <div className="space-y-1">
              <h4 className="font-medium text-foreground">Restore from Backup</h4>
              <p className="text-sm text-muted-foreground">
                Import data from a previously downloaded backup file.
              </p>
            </div>
            
            <input 
              type="file" 
              accept=".json"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            
            <Button 
              variant="secondary" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isWorking}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {isWorking ? 'Restoring…' : 'Restore Data'}
            </Button>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50 text-xs text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              Restoring a backup will <strong>replace all current data</strong> with the contents of the backup file. 
              This operation cannot be undone. We recommend downloading a fresh backup before restoring.
            </span>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={restoreDialogOpen} onOpenChange={(open) => !open && setRestoreDialogOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore from Backup?</AlertDialogTitle>
            <AlertDialogDescription>
              This will <strong>delete all current data</strong> and replace it with the contents of <span className="font-semibold text-foreground">{restoreFile?.name}</span>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRestoreConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Replace All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
