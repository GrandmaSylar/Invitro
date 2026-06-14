import { useState, useEffect } from "react";
import { Minus, Square, X, Copy } from "lucide-react";
import { showConfirm } from "../../stores/useDialogStore";
import { dbAdapter } from "../../services/dbAdapter";

/**
 * Custom title bar that replaces the native Windows chrome.
 * Only renders inside Electron (when `window.electronAPI` exists).
 * Falls back to nothing in the web build so the browser's own controls remain.
 */
export function TitleBar() {
  const isElectron = !!window.electronAPI;
  const [isMaximized, setIsMaximized] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "pending" | "failed">("synced");
  const [syncDetails, setSyncDetails] = useState<string>("All data synced to cloud");

  useEffect(() => {
    if (!isElectron) return;

    const handler = (_e: any, maximized: boolean) => setIsMaximized(maximized);
    window.electronAPI?.onMaximizeChange?.(handler);

    return () => {
      window.electronAPI?.offMaximizeChange?.(handler);
    };
  }, [isElectron]);

  // Sync status polling
  useEffect(() => {
    if (!isElectron) return;

    const checkStatus = async () => {
      try {
        const counts = await dbAdapter.settings.getSyncStatus();
        let hasFailed = false;
        let hasPending = false;
        let pendingCount = 0;
        let failedCount = 0;

        for (const row of counts) {
          if (row.status === 'failed' && row.count > 0) {
            hasFailed = true;
            failedCount = row.count;
          } else if ((row.status === 'pending' || row.status === 'syncing') && row.count > 0) {
            hasPending = true;
            pendingCount += row.count;
          }
        }

        if (hasFailed) {
          setSyncStatus("failed");
          setSyncDetails(`${failedCount} sync task(s) failed. Contact administrator.`);
        } else if (hasPending) {
          setSyncStatus("pending");
          setSyncDetails(`${pendingCount} sync task(s) pending connection...`);
        } else {
          setSyncStatus("synced");
          setSyncDetails("Offline database fully synced to cloud.");
        }
      } catch (err) {
        console.error("Failed to check sync status:", err);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [isElectron]);

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
    <div className="title-bar select-none flex items-center h-9 bg-sidebar border-b border-sidebar-border text-sidebar-foreground shrink-0 z-[9999]">
      {/* Drag region — fills the space between logo and window controls */}
      <div className="flex-1 h-full flex items-center pl-3 gap-2 app-drag-region">
        <span className="text-xs font-semibold tracking-wide opacity-60">Invitro LIMS</span>
        <div className="flex items-center gap-1.5 ml-2 no-drag" title={syncDetails}>
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              syncStatus === "failed" ? "bg-red-400" : syncStatus === "pending" ? "bg-amber-400" : "bg-emerald-400"
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              syncStatus === "failed" ? "bg-red-500" : syncStatus === "pending" ? "bg-amber-500" : "bg-emerald-500"
            }`}></span>
          </span>
          <span className="text-[10px] opacity-40 font-medium">{
            syncStatus === "failed" ? "Sync Error" : syncStatus === "pending" ? "Syncing..." : "Synced"
          }</span>
        </div>
      </div>

      {/* Window control buttons */}
      <div className="flex items-center h-full">
        <button
          onClick={() => window.electronAPI?.minimizeWindow?.()}
          className="h-full w-12 flex items-center justify-center hover:bg-foreground/10 transition-colors duration-150 focus:outline-none"
          aria-label="Minimize"
        >
          <Minus size={14} className="opacity-70" />
        </button>
        <button
          onClick={() => window.electronAPI?.maximizeWindow?.()}
          className="h-full w-12 flex items-center justify-center hover:bg-foreground/10 transition-colors duration-150 focus:outline-none"
          aria-label="Maximize"
        >
          {isMaximized
            ? <Copy size={12} className="opacity-70" />
            : <Square size={12} className="opacity-70" />
          }
        </button>
        <button
          onClick={handleClose}
          className="h-full w-12 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors duration-150 focus:outline-none rounded-tr-none"
          aria-label="Close"
        >
          <X size={14} className="opacity-70 hover:opacity-100" />
        </button>
      </div>
    </div>
  );
}

