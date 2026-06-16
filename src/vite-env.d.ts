/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    getAppVersion: () => Promise<string>;
    onUpdateAvailable: (callback: (info: any) => void) => () => void;
    onUpdateDownloaded: (callback: () => void) => () => void;
    onUpdateNotAvailable: (callback: () => void) => () => void;
    onUpdateError: (callback: (error: string) => void) => () => void;
    onDownloadProgress: (callback: (progress: any) => void) => () => void;
    installUpdate: () => Promise<void>;
    downloadUpdate: () => Promise<{ success: boolean; error?: string }>;
    checkForUpdates: () => Promise<{ success: boolean; error?: string }>;

    // Window controls
    minimizeWindow: () => Promise<void>;
    maximizeWindow: () => Promise<void>;
    closeWindow: () => Promise<void>;
    onMaximizeChange: (callback: (event: any, maximized: boolean) => void) => void;
    offMaximizeChange: (callback: (event: any, maximized: boolean) => void) => void;
    exportPDF: (options: { title: string; paperSize: string }) => Promise<{ success: boolean; filePath?: string; error?: string }>;
    previewPDF: (options: { title: string; paperSize: string }) => Promise<{ success: boolean; error?: string }>;
    cacheUserCredentials: (userRow: any, roleRow: any) => Promise<{ success: boolean; error?: string }>;
    offlineLogin: (options: { login: string; password: string }) => Promise<{ success: boolean; user?: any; permissions?: Record<string, boolean>; error?: string }>;
    updateSupabaseSession: (session: { access_token: string; refresh_token: string }) => Promise<{ success: boolean; error?: string }>;
    db?: any;
  }
}
