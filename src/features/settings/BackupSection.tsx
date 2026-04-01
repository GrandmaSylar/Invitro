import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../app/components/ui/card';
import { Button } from '../../app/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../app/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Download, Upload } from 'lucide-react';

export default function BackupSection() {
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('lims-last-backup');
    if (stored) {
      setLastBackupAt(stored);
    }
  }, []);

  const handleDownloadBackup = () => {
    try {
      // Collect localStorage into a plain object
      const data: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          data[key] = localStorage.getItem(key) || '';
        }
      }

      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `lims-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const timestamp = new Date().toISOString();
      localStorage.setItem('lims-last-backup', timestamp);
      setLastBackupAt(timestamp);
      
      toast.success('Backup generated successfully');
    } catch (e) {
      toast.error('Failed to generate backup');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRestoreFile(file);
      setRestoreDialogOpen(true);
    }
    // Reset the input value so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRestoreConfirm = () => {
    if (!restoreFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        localStorage.clear();
        Object.keys(data).forEach(key => {
          localStorage.setItem(key, data[key]);
        });

        toast.success('Backup restored. Please refresh the page.', {
          duration: 5000,
        });

      } catch (err) {
        toast.error('Invalid backup file format');
      } finally {
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
          <CardDescription>Export and import all application state data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
            <div className="space-y-1">
              <h4 className="font-medium text-foreground">Download Backup</h4>
              <p className="text-sm text-muted-foreground">
                Export all local storage and settings to a JSON file.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Last backup: {lastBackupAt ? new Date(lastBackupAt).toLocaleString() : 'Never'}
              </p>
            </div>
            <Button onClick={handleDownloadBackup} className="gap-2">
              <Download className="h-4 w-4" />
              Download Backup
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
            <div className="space-y-1">
              <h4 className="font-medium text-foreground">Restore from Backup</h4>
              <p className="text-sm text-muted-foreground">
                Import data from a previously downloaded JSON backup file.
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
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Restore Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={restoreDialogOpen} onOpenChange={(open) => !open && setRestoreDialogOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore from Backup?</AlertDialogTitle>
            <AlertDialogDescription>
              This will overwrite all current data with the contents of <span className="font-semibold text-foreground">{restoreFile?.name}</span>. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRestoreConfirm}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Restore Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
