/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    getAppVersion: () => Promise<string>;
    onUpdateAvailable: (callback: () => void) => () => void;
    onUpdateDownloaded: (callback: () => void) => () => void;
    onUpdateNotAvailable: (callback: () => void) => () => void;
    onUpdateError: (callback: (error: string) => void) => () => void;
    installUpdate: () => Promise<void>;
    checkForUpdates: () => Promise<{ success: boolean; error?: string }>;

    // Window controls
    minimizeWindow: () => Promise<void>;
    maximizeWindow: () => Promise<void>;
    closeWindow: () => Promise<void>;
    onMaximizeChange: (callback: (event: any, maximized: boolean) => void) => void;
    offMaximizeChange: (callback: (event: any, maximized: boolean) => void) => void;
  }
}
