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
    cacheUserCredentials: (userRow: any, roleRow: any, plaintextPassword?: string) => Promise<{ success: boolean; error?: string }>;
    offlineLogin: (options: { login: string; password: string }) => Promise<{ success: boolean; user?: any; permissions?: Record<string, boolean>; error?: string }>;
    updateSupabaseSession: (session: { access_token: string; refresh_token: string }) => Promise<{ success: boolean; error?: string }>;
    getDeviceId: () => Promise<string>;
    setForcedOffline: (forced: boolean) => Promise<void>;
    isForcedOffline: () => Promise<boolean>;
    hasCachedUsers: () => Promise<boolean>;
    triggerSync: () => Promise<{ success: boolean; error?: string }>;
    getHospitals: () => Promise<any[]>;
    createHospital: (hospitalData: any) => Promise<any>;
    updateHospital: (id: string, hospitalData: any) => Promise<any>;
    deleteHospital: (id: string) => Promise<void>;
    getDoctors: (hospitalId?: string) => Promise<any[]>;
    createDoctor: (doctorData: any) => Promise<any>;
    updateDoctor: (id: string, doctorData: any) => Promise<any>;
    deleteDoctor: (id: string) => Promise<void>;
    db?: any;
  }
}
