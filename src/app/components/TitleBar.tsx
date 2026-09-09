import { useState, useEffect } from "react";
import { Minus, Square, X, Copy, FlaskConical, ShieldAlert } from "lucide-react";
import { showConfirm } from "../../stores/useDialogStore";

/**
 * Custom TitleBar and Windows Control Box replacing native Windows chrome.
 * Only renders inside Electron (when `window.electronAPI` exists).
 * Built with glassmorphism backdrop, brand pill identity, real-time DB widget,
 * and custom Windows window management control box (minimize, maximize/restore, close).
 */
export function TitleBar() {
  const isElectron = !!window.electronAPI;
  const [isMaximized, setIsMaximized] = useState(false);
  const [isSandbox, setIsSandbox] = useState(false);
  const [dbStatus, setDbStatus] = useState<{
    status: 'Connected' | 'Disconnected' | 'Not Configured' | 'Checking';
    latency: number;
    strength: 'Excellent' | 'Good' | 'Moderate' | 'Poor' | 'None';
    server?: string;
  }>({ status: 'Checking', latency: 0, strength: 'None' });

  useEffect(() => {
    if (!isElectron) return;

    const handler = (_e: any, maximized: boolean) => setIsMaximized(maximized);
    window.electronAPI?.onMaximizeChange?.(handler);

    window.electronAPI?.getSandboxStatus?.().then(res => {
      if (res) setIsSandbox(res.isSandbox);
    });

    return () => {
      window.electronAPI?.offMaximizeChange?.(handler);
    };
  }, [isElectron]);

  // DB Connection & Latency Polling (fees_tracker architecture)
  useEffect(() => {
    if (!isElectron) return;

    const checkStatus = async () => {
      try {
        const res = await (window.electronAPI?.getDbStatus 
          ? window.electronAPI.getDbStatus() 
          : window.electronAPI?.invoke?.('db-get-status'));
        if (res) {
          setDbStatus(res);
        }
      } catch (err) {
        setDbStatus({ status: 'Disconnected', latency: 0, strength: 'None' });
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 15000); // Poll status every 15 seconds
    return () => clearInterval(interval);
  }, [isElectron]);

  const handleToggleSandbox = async () => {
    if (!isElectron) return;
    const target = !isSandbox;
    const confirmed = await showConfirm({
      title: target ? "Enter Training Ground Mode?" : "Exit Training Ground Mode?",
      description: target 
        ? "Switching to Training Ground mode will connect to an isolated temporary database (invitro_sandbox). Your live production data will remain safely untouched."
        : "Switching back to Live Production database (invitro). Any unsaved changes in training grounds will remain until reset.",
      confirmText: target ? "Enter Training Ground" : "Return to Live DB",
      cancelText: "Cancel",
      variant: "default"
    });

    if (confirmed) {
      const res = await window.electronAPI?.toggleSandboxMode?.(target);
      if (res?.success) {
        window.location.reload();
      } else if (res?.error) {
        alert(`Failed to switch mode: ${res.error}`);
      }
    }
  };

  const handleClose = async () => {
    const confirmed = await showConfirm({
      title: "Exit Application",
      description: "Are you sure you want to close Invitro LIMS? Any unsaved changes may be lost.",
      confirmText: "Exit",
      cancelText: "Cancel",
      variant: "destructive"
    });
    if (confirmed) {
      window.electronAPI?.closeWindow?.();
    }
  };

  if (!isElectron) return null;

  return (
    <header className="title-bar select-none flex items-center justify-between h-9 bg-sidebar/95 backdrop-blur-md border-b border-sidebar-border/80 text-sidebar-foreground shrink-0 z-[9999] transition-colors duration-200">
      
      {/* App Drag Region - Brand Pill & DB Health LED */}
      <div className="flex-1 h-full flex items-center pl-3 gap-3 app-drag-region overflow-hidden">
        
        {/* Brand Pill Badge */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sidebar-accent/60 border border-sidebar-border/60 text-sidebar-foreground font-extrabold text-[11px] tracking-wide shrink-0">
          <FlaskConical className="w-3.5 h-3.5 text-primary stroke-[2.5]" />
          <span>Invitro LIMS</span>
          <span className="text-[9px] font-mono opacity-50 font-normal px-1 bg-sidebar-primary/10 rounded">v1.1</span>
        </div>

        {/* Real-time DB Latency Status Widget */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border transition-all duration-200 cursor-pointer no-drag select-none shrink-0"
          style={{
            backgroundColor: dbStatus.status === 'Connected'
              ? (dbStatus.strength === 'Excellent' || dbStatus.strength === 'Good' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)')
              : 'rgba(239, 68, 68, 0.12)',
            borderColor: dbStatus.status === 'Connected'
              ? (dbStatus.strength === 'Excellent' || dbStatus.strength === 'Good' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)')
              : 'rgba(239, 68, 68, 0.35)',
            color: dbStatus.status === 'Connected'
              ? (dbStatus.strength === 'Excellent' || dbStatus.strength === 'Good' ? '#10b981' : '#f59e0b')
              : '#ef4444'
          }}
          title={
            dbStatus.status === 'Connected'
              ? `Connected to MSSQL Server: ${dbStatus.server || 'Active'}\nLatency: ${dbStatus.latency}ms\nQuality: ${dbStatus.strength === 'Poor' ? 'Slow / Unstable' : dbStatus.strength}`
              : `Database Status: ${dbStatus.status}`
          }
        >
          <span
            className="w-1.5 h-1.5 rounded-full inline-block animate-pulse"
            style={{
              backgroundColor: dbStatus.status === 'Connected'
                ? (dbStatus.strength === 'Excellent' || dbStatus.strength === 'Good' ? '#10b981' : '#f59e0b')
                : '#ef4444',
              boxShadow: dbStatus.status === 'Connected'
                ? `0 0 6px ${dbStatus.strength === 'Excellent' || dbStatus.strength === 'Good' ? '#10b981' : '#f59e0b'}`
                : '0 0 6px #ef4444'
            }}
          />
          <span className="font-bold text-[10.5px] tracking-tight">
            {dbStatus.status === 'Connected' 
              ? `DB: ${dbStatus.latency}ms` 
              : dbStatus.status === 'Checking' 
                ? 'DB: Checking...' 
                : 'DB Offline'}
          </span>
        </div>

        {/* Training Grounds Pill Toggle */}
        <button
          type="button"
          onClick={handleToggleSandbox}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10.5px] font-bold tracking-tight transition-all duration-200 cursor-pointer no-drag select-none shrink-0 ${
            isSandbox
              ? 'bg-amber-500/20 text-amber-500 border-amber-500/50 shadow-sm shadow-amber-500/20 animate-pulse'
              : 'bg-sidebar-accent/50 text-sidebar-foreground/75 border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-foreground'
          }`}
          title={isSandbox ? "Currently operating in isolated Training Ground DB" : "Click to switch to isolated Training Ground DB"}
        >
          <ShieldAlert className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{isSandbox ? "Training Mode Active" : "Training Grounds"}</span>
        </button>
      </div>

      {/* Customized Windows Chrome Control Box (Minimize, Maximize/Restore, Close) */}
      <div className="flex items-center gap-1.5 px-3 shrink-0 no-drag">
        
        {/* Custom Window Control Box Capsule */}
        <div className="flex items-center gap-1 p-1 bg-sidebar-accent/40 rounded-xl border border-sidebar-border/50 shadow-inner backdrop-blur-md">
          {/* Minimize Button */}
          <button
            type="button"
            onClick={() => window.electronAPI?.minimizeWindow?.()}
            className="h-7 w-8 rounded-lg flex items-center justify-center text-sidebar-foreground/75 hover:text-primary hover:bg-sidebar-primary/15 active:scale-90 transition-all duration-150 focus:outline-none"
            title="Minimize Window"
            aria-label="Minimize Window"
          >
            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>

          {/* Maximize / Restore Button */}
          <button
            type="button"
            onClick={() => window.electronAPI?.maximizeWindow?.()}
            className="h-7 w-8 rounded-lg flex items-center justify-center text-sidebar-foreground/75 hover:text-primary hover:bg-sidebar-primary/15 active:scale-90 transition-all duration-150 focus:outline-none"
            title={isMaximized ? "Restore Down" : "Maximize"}
            aria-label={isMaximized ? "Restore Window" : "Maximize Window"}
          >
            {isMaximized ? (
              <Copy className="w-3 h-3 stroke-[2.5]" />
            ) : (
              <Square className="w-3 h-3 stroke-[2.5]" />
            )}
          </button>

          {/* Close Button - Custom Glowing Alert Pill */}
          <button
            type="button"
            onClick={handleClose}
            className="h-7 w-8 rounded-lg flex items-center justify-center bg-rose-500/15 text-rose-500 border border-rose-500/30 hover:bg-rose-600 hover:text-white hover:border-rose-600 active:scale-90 shadow-sm shadow-rose-950/20 transition-all duration-200 focus:outline-none cursor-pointer"
            title="Close Application"
            aria-label="Close Window"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

      </div>

    </header>
  );
}


