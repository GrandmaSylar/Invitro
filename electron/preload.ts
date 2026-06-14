import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onUpdateAvailable: (callback: () => void) => {
    ipcRenderer.on('update-available', callback);
    return () => ipcRenderer.removeAllListeners('update-available');
  },
  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on('update-downloaded', callback);
    return () => ipcRenderer.removeAllListeners('update-downloaded');
  },
  onUpdateNotAvailable: (callback: () => void) => {
    ipcRenderer.on('update-not-available', callback);
    return () => ipcRenderer.removeAllListeners('update-not-available');
  },
  onUpdateError: (callback: (error: string) => void) => {
    ipcRenderer.on('update-error', (_event, error) => callback(error));
    return () => ipcRenderer.removeAllListeners('update-error');
  },
  installUpdate: () => ipcRenderer.invoke('install-update'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  onMaximizeChange: (callback: (event: any, maximized: boolean) => void) => {
    ipcRenderer.on('maximize-change', callback);
  },
  offMaximizeChange: (callback: (event: any, maximized: boolean) => void) => {
    ipcRenderer.removeListener('maximize-change', callback);
  },
  exportPDF: (options: { title: string; paperSize: string }) => ipcRenderer.invoke('export-pdf', options),
  previewPDF: (options: { title: string; paperSize: string }) => ipcRenderer.invoke('preview-pdf', options),
});
