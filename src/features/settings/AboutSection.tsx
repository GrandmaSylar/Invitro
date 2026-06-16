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
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadPercent, setDownloadPercent] = useState(0);

  useEffect(() => {
    if (!window.electronAPI) return;

    const unsubAvailable = window.electronAPI.onUpdateAvailable((info: any) => {
      setIsChecking(false);
      setUpdateAvailable(true);
      setUpdateInfo(info);
      toast.info(`Version v${info.version} is available!`);
    });

    const unsubNotAvailable = window.electronAPI.onUpdateNotAvailable(() => {
      setIsChecking(false);
      toast.success('You are on the latest version!');
    });

    const unsubDownloaded = window.electronAPI.onUpdateDownloaded(() => {
      setUpdateAvailable(false);
      setUpdateDownloaded(true);
      setIsDownloading(false);
      setDownloadPercent(100);
      toast.success('Update ready to install!');
    });

    const unsubProgress = window.electronAPI.onDownloadProgress((progress: any) => {
      setIsDownloading(true);
      setDownloadPercent(Math.round(progress.percent || 0));
    });

    const unsubError = window.electronAPI.onUpdateError((err) => {
      setIsChecking(false);
      setIsDownloading(false);
      toast.error('Update failed: ' + err);
    });

    return () => {
      unsubAvailable();
      unsubNotAvailable();
      unsubDownloaded();
      unsubProgress();
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

  const handleDownloadUpdate = async () => {
    if (!window.electronAPI) return;
    setIsDownloading(true);
    setDownloadPercent(0);
    const res = await window.electronAPI.downloadUpdate();
    if (res && res.error) {
      setIsDownloading(false);
      toast.error('Failed to start download: ' + res.error);
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
                  disabled={isChecking || updateAvailable || isDownloading}
                  variant={updateAvailable || isDownloading ? "secondary" : "default"}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
                  {isDownloading ? 'Downloading...' : updateAvailable ? 'Update Available' : isChecking ? 'Checking...' : 'Check for Updates'}
                </Button>
              )}
            </div>
          </div>

          {updateAvailable && updateInfo && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-foreground">New Update Available: v{updateInfo.version}</h4>
                  <p className="text-xs text-muted-foreground">Release Date: {updateInfo.releaseDate ? new Date(updateInfo.releaseDate).toLocaleDateString() : 'Unknown'}</p>
                </div>
                {!isDownloading && (
                  <Button onClick={handleDownloadUpdate} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 shrink-0">
                    <Download className="h-4 w-4" />
                    Download Update
                  </Button>
                )}
              </div>

              {updateInfo.releaseNotes && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Release Notes</span>
                  <div 
                    className="text-xs text-foreground bg-background/50 border rounded p-3 max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: typeof updateInfo.releaseNotes === 'string' ? updateInfo.releaseNotes : JSON.stringify(updateInfo.releaseNotes) }}
                  />
                </div>
              )}

              {isDownloading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-muted-foreground animate-pulse">Downloading update packages...</span>
                    <span className="text-primary font-mono">{downloadPercent}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden border">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300 ease-out" 
                      style={{ width: `${downloadPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {updateDownloaded && (
            <div className="rounded-lg border border-green-600/20 bg-green-600/5 p-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <h4 className="font-bold text-green-600 flex items-center gap-1.5">
                <Download className="h-4 w-4" />
                Update Ready to Install
              </h4>
              <p className="text-xs text-muted-foreground">
                The update packages have been successfully verified and downloaded. Click "Install & Restart" to apply the update now.
              </p>
            </div>
          )}

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
