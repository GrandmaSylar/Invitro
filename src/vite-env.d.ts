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
    getDeviceId: () => Promise<string>;
    getHospitals: () => Promise<any[]>;
    createHospital: (hospitalData: any) => Promise<any>;
    updateHospital: (id: string, hospitalData: any) => Promise<any>;
    deleteHospital: (id: string) => Promise<void>;
    getDoctors: (hospitalId?: string) => Promise<any[]>;
    createDoctor: (doctorData: any) => Promise<any>;
    updateDoctor: (id: string, doctorData: any) => Promise<any>;
    // Generic and Database Setup Methods (fees_tracker architecture)
    invoke?: (channel: string, ...args: any[]) => Promise<any>;
    checkDbConfig?: () => Promise<boolean>;
    saveDbConfig?: (config: any) => Promise<{ success: boolean; error?: string }>;
    testDbConnection?: (config: any) => Promise<{ success: boolean; latency?: number; strength?: string; isInitialized?: boolean; error?: string }>;
    initializeDb?: () => Promise<{ success: boolean; error?: string }>;
    getDbConnectionInfo?: () => Promise<{ success: boolean; config?: any; error?: string }>;
    getDbStatus?: () => Promise<{ status: 'Connected' | 'Disconnected' | 'Not Configured' | 'Checking'; latency: number; strength: string; server?: string; error?: string }>;
    resetDbConfig?: () => Promise<{ success: boolean; error?: string }>;
    toggleSandboxMode?: (enabled: boolean) => Promise<{ success: boolean; error?: string }>;
    resetSandboxDatabase?: () => Promise<{ success: boolean; error?: string }>;
    getSandboxStatus?: () => Promise<{ isSandbox: boolean }>;
    db?: any;
  }
}
