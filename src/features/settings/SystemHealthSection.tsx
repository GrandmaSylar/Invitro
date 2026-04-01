import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../app/components/ui/card';
import { Button } from '../../app/components/ui/button';
import { Badge } from '../../app/components/ui/badge';
import { Label } from '../../app/components/ui/label';
import { Progress } from '../../app/components/ui/progress';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { CheckCircle2, Play } from 'lucide-react';

export default function SystemHealthSection() {
  const { dbConfigs } = useSettingsStore();

  const [diagRunning, setDiagRunning] = useState(false);
  const [diagComplete, setDiagComplete] = useState(false);
  const [progress, setProgress] = useState(0);

  const activeDb = dbConfigs.find(c => c.isActive);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (diagRunning) {
      setProgress(0);
      setDiagComplete(false);
      interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setDiagRunning(false);
            setDiagComplete(true);
            return 100;
          }
          return p + 5;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [diagRunning]);

  const handleRunDiagnostics = () => {
    if (diagRunning) return;
    setDiagRunning(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>View application metrics and run diagnostics.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1 p-4 rounded-lg border bg-card shadow-sm">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">App Version</Label>
              <div className="font-semibold text-lg">1.0.0</div>
            </div>
            <div className="flex flex-col gap-1 p-4 rounded-lg border bg-card shadow-sm">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Build Date</Label>
              <div className="font-semibold text-lg">2025-01-01</div>
            </div>
            <div className="flex flex-col gap-1 p-4 rounded-lg border bg-card shadow-sm">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Active DB Connection</Label>
              <div className="font-semibold text-lg truncate" title={activeDb?.name || 'None'}>
                {activeDb?.name || 'None'}
              </div>
            </div>
            <div className="flex flex-col gap-1 p-4 rounded-lg border bg-card shadow-sm">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Session Count</Label>
              <div className="font-semibold text-lg">1</div>
            </div>
            <div className="flex flex-col gap-1 p-4 rounded-lg border bg-card shadow-sm">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Memory Usage</Label>
              <div className="font-semibold text-lg">128 MB</div>
            </div>
            <div className="flex flex-col gap-1 p-4 rounded-lg border bg-card shadow-sm">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Uptime</Label>
              <div className="font-semibold text-lg">0d 0h (session)</div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-medium">Run Diagnostics</h4>
                <p className="text-sm text-muted-foreground">
                  Perform health checks on database connections and core services.
                </p>
              </div>
              <Button onClick={handleRunDiagnostics} disabled={diagRunning} className="gap-2">
                <Play className="h-4 w-4" />
                {diagRunning ? 'Running...' : 'Run Checks'}
              </Button>
            </div>

            {diagRunning && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Running checks...</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {diagComplete && !diagRunning && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-in fade-in">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium text-sm">All diagnostic checks passed. System is healthy.</span>
              </div>
            )}
          </div>
          
        </CardContent>
      </Card>
    </div>
  );
}
