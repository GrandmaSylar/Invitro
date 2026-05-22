import { useState, useEffect } from "react";
import { Minus, Square, X, Copy } from "lucide-react";
import { showConfirm } from "../../stores/useDialogStore";

/**
 * Custom title bar that replaces the native Windows chrome.
 * Only renders inside Electron (when `window.electronAPI` exists).
 * Falls back to nothing in the web build so the browser's own controls remain.
 */
export function TitleBar() {
  const isElectron = !!window.electronAPI;
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!isElectron) return;

    const handler = (_e: any, maximized: boolean) => setIsMaximized(maximized);
    window.electronAPI?.onMaximizeChange?.(handler);

    return () => {
      window.electronAPI?.offMaximizeChange?.(handler);
    };
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

