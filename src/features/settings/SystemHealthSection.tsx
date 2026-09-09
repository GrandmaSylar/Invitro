import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../app/components/ui/card';
import { Button } from '../../app/components/ui/button';
import { Wrench, Database, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { showConfirm, showSuccess } from '../../stores/useDialogStore';
import { useAuthStore } from '../../stores/useAuthStore';

export default function SystemHealthSection() {
  const [dbInfo, setDbInfo] = useState<{
    server: string;
    port?: string | number;
    database: string;
    user: string;
  } | null>(null);
  const [dbStrength, setDbStrength] = useState<string>('Checking...');
  const [dbLatency, setDbLatency] = useState<number | null>(null);
  const [resetting, setResetting] = useState(false);

  const logout = useAuthStore((s) => s.logout);

  const fetchDbDiagnostics = async () => {
    if (!window.electronAPI) {
      setDbStrength('Web Mode (Supabase)');
      return;
    }

    try {
      const infoRes = await (window.electronAPI.getDbConnectionInfo
        ? window.electronAPI.getDbConnectionInfo()
        : window.electronAPI.invoke?.('db-get-connection-info'));

      if (infoRes?.success && infoRes.config) {
        setDbInfo(infoRes.config);
        const testRes = await (window.electronAPI.testDbConnection
          ? window.electronAPI.testDbConnection(infoRes.config)
          : window.electronAPI.invoke?.('db-test-connection', infoRes.config));

        if (testRes?.success) {
          const strengthText = testRes.strength === 'Poor' ? 'Slow / Unstable' : testRes.strength;
          setDbStrength(strengthText);
          setDbLatency(testRes.latency ?? 0);
        } else {
          setDbStrength('Connection Unreachable');
          setDbLatency(null);
        }
      } else {
        setDbStrength('Not Configured');
      }
    } catch (err) {
      console.error('Failed to query connection info diagnostics:', err);
      setDbStrength('Error checking status');
    }
  };

  useEffect(() => {
    fetchDbDiagnostics();
  }, []);

  const handleResetDatabaseConfig = async () => {
    const confirmed = await showConfirm({
      title: 'Reset Database Configuration',
      description: 'This will log you out, tear down current connection pools, and prompt for credentials on next boot. Are you sure you want to proceed?',
      confirmText: 'Reset Configuration',
      cancelText: 'Cancel',
      variant: 'destructive'
    });

    if (!confirmed) return;

    setResetting(true);
    try {
      const res = await (window.electronAPI?.resetDbConfig
        ? window.electronAPI.resetDbConfig()
        : window.electronAPI?.invoke?.('db-reset-config'));

      if (res?.success) {
        showSuccess({
          title: 'Database Reset',
          description: 'Database configuration has been cleared. Redirecting to setup wizard...'
        });
        setTimeout(() => {
          logout();
          window.location.reload();
        }, 1200);
      } else {
        throw new Error(res?.error || 'Failed to reset database configuration.');
      }
    } catch (err: any) {
      console.error('Reset database error:', err);
    } finally {
      setResetting(false);
    }
  };

  const getStatusColor = () => {
    if (dbStrength === 'Excellent') return 'text-emerald-500 font-bold';
    if (dbStrength === 'Good') return 'text-emerald-600 font-bold';
    if (dbStrength.includes('Slow') || dbStrength.includes('Unstable')) return 'text-rose-500 font-bold';
    if (dbStrength === 'Moderate') return 'text-amber-500 font-bold';
    return 'text-muted-foreground font-bold';
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold tracking-tight">System Diagnostics</CardTitle>
          <CardDescription>Active database telemetries, network latencies, and connection pool controls.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Active Database Connection Card (Replicated from fees_tracker) */}
          <div className="rounded-xl border border-border/80 bg-amber-500/[0.03] dark:bg-amber-500/[0.02] p-5 space-y-4">
            <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tracking-wide">
              Active Database Connection
            </h4>

            {dbInfo ? (
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[180px_1fr] gap-y-3 text-sm">
                <span className="text-muted-foreground font-medium">Server Host:</span>
                <strong className="text-foreground font-semibold">{dbInfo.server}:{dbInfo.port || 1433}</strong>

                <span className="text-muted-foreground font-medium">Database:</span>
                <strong className="text-foreground font-semibold font-mono">{dbInfo.database}</strong>

                <span className="text-muted-foreground font-medium">Username:</span>
                <strong className="text-foreground font-semibold">{dbInfo.user}</strong>

                <span className="text-muted-foreground font-medium">Connection Status:</span>
                <span className={getStatusColor()}>
                  {dbStrength} {dbLatency !== null && `(${dbLatency}ms)`}
                </span>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-2 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-muted-foreground" />
                <span>Retrieving active connection statistics...</span>
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            If your database server IP address, LAN routing, or credentials change, you can trigger a re-configuration of the main connection pool.
          </p>

          {/* Database Connection Wizard Subcard (Replicated from fees_tracker) */}
          <div className="rounded-xl border border-border/70 bg-muted/30 p-5 space-y-4">
            <div className="flex items-center gap-2 text-foreground font-bold text-sm">
              <Wrench size={16} className="text-muted-foreground" />
              <span>Database Connection Wizard</span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              This will log you out, tear down current connection pools, and prompt for credentials on next boot.
            </p>

            <Button
              variant="outline"
              onClick={handleResetDatabaseConfig}
              disabled={resetting}
              className="w-full sm:w-auto font-semibold text-foreground border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
            >
              {resetting ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-2" />
                  <span>Resetting Configuration...</span>
                </>
              ) : (
                <span>Reset Database Configuration</span>
              )}
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
