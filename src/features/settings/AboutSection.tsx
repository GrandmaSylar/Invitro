import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../app/components/ui/card';
import { Button } from '../../app/components/ui/button';
import { GitCommit, Clock, User, Github, RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';
// @ts-ignore
import { version, changelog } from 'virtual:git-info';

export default function AboutSection() {
  const [isChecking, setIsChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);

  useEffect(() => {
    if (!window.electronAPI) return;

    const unsubAvailable = window.electronAPI.onUpdateAvailable(() => {
      setIsChecking(false);
      setUpdateAvailable(true);
      toast.info('A new update is available and is downloading in the background.');
    });

    const unsubNotAvailable = window.electronAPI.onUpdateNotAvailable(() => {
      setIsChecking(false);
      toast.success('You are on the latest version!');
    });

    const unsubDownloaded = window.electronAPI.onUpdateDownloaded(() => {
      setUpdateAvailable(false);
      setUpdateDownloaded(true);
      toast.success('Update ready to install!');
    });

    const unsubError = window.electronAPI.onUpdateError((err) => {
      setIsChecking(false);
      toast.error('Failed to check for updates: ' + err);
    });

    return () => {
      unsubAvailable();
      unsubNotAvailable();
      unsubDownloaded();
      unsubError();
    };
  }, []);

  const handleCheckForUpdates = async () => {
    if (!window.electronAPI) {
      toast.error('Update checker is only available in the desktop app.');
      return;
    }
    
    setIsChecking(true);
    const res = await window.electronAPI.checkForUpdates();
    if (!res.success) {
      setIsChecking(false);
      toast.error(res.error || 'Failed to check for updates.');
    }
  };

  const handleInstallUpdate = () => {
    window.electronAPI?.installUpdate();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            About & Version
          </CardTitle>
          <CardDescription>
            System version information and recent changelog
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Current Version</span>
              <span className="text-3xl font-bold font-mono">{version}</span>
            </div>
            <div>
              {updateDownloaded ? (
                <Button onClick={handleInstallUpdate} className="bg-green-600 hover:bg-green-700">
                  <Download className="mr-2 h-4 w-4" />
                  Install & Restart
                </Button>
              ) : (
                <Button 
                  onClick={handleCheckForUpdates} 
                  disabled={isChecking || updateAvailable}
                  variant={updateAvailable ? "secondary" : "default"}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
                  {updateAvailable ? 'Downloading...' : isChecking ? 'Checking...' : 'Check for Updates'}
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <GitCommit className="h-5 w-5 text-muted-foreground" />
              Recent Changelog
            </h3>
            
            <div className="rounded-md border bg-muted/5 border-border shadow-sm overflow-hidden">
              {changelog && changelog.length > 0 ? (
                <div className="divide-y divide-border">
                  {changelog.map((entry: any) => (
                    <div key={entry.hash} className="p-4 flex flex-col gap-2 hover:bg-muted/50 transition-colors bg-card">
                      <div className="flex items-start justify-between gap-4">
                        <span className="font-medium text-sm leading-snug">{entry.msg}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {entry.author}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {entry.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm bg-card">
                  No changelog available.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
