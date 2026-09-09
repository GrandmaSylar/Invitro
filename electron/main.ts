import './esm-globals.js';
import { app, BrowserWindow, shell, ipcMain, nativeTheme, dialog, safeStorage } from 'electron';
import { join } from 'node:path';
import { writeFile, existsSync, readFileSync, writeFileSync } from 'node:fs';
import log from 'electron-log/main';
import { autoUpdater } from 'electron-updater';
import { 
  getPool, 
  closePool, 
  hasDbConfig, 
  getDbConfig, 
  saveDbConfig, 
  resetDbConfig, 
  testConnection, 
  getStatus, 
  initMssqlDatabase,
  toggleSandboxMode,
  resetSandboxDatabase,
  isSandboxActive
} from './mssqlManager.js';
import { dbHandlers } from './mssqlDbHandlers.js';

function getOrCreateDeviceID(): string {
  const metaDir = app.getPath('userData');
  const metaPath = join(metaDir, 'device.key');
  
  try {
    if (existsSync(metaPath)) {
      const encrypted = readFileSync(metaPath);
      if (safeStorage.isEncryptionAvailable()) {
        return safeStorage.decryptString(encrypted);
      } else {
        return encrypted.toString('utf8');
      }
    }
  } catch (err: any) {
    log.error('Failed to read or decrypt persistent device.key:', err.message);
  }

  const newId = 'dev-' + crypto.randomUUID();
  try {
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(newId);
      writeFileSync(metaPath, encrypted);
    } else {
      writeFileSync(metaPath, newId, 'utf8');
    }
  } catch (err: any) {
    log.error('Failed to save encrypted device.key:', err.message);
  }
  return newId;
}

// Initialize logging
log.initialize();
log.info('Invitro LIMS starting up...');

// Dist directories
const distPath = join(__dirname, '../dist');
const publicPath = app.isPackaged ? distPath : join(__dirname, '../public');

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 600,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: join(publicPath, 'icon.png')
  });

  splashWindow.loadFile(join(publicPath, 'splash.html'));
  
  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#09090b' : '#ffffff',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.mjs'),
    },
    icon: join(publicPath, 'icon.png')
  });

  // Notify renderer when maximize state changes
  mainWindow.on('maximize', () => mainWindow?.webContents.send('maximize-change', true));
  mainWindow.on('unmaximize', () => mainWindow?.webContents.send('maximize-change', false));

  // Security: Prevent external links from opening in the Electron window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Load the Vite dev server URL or the local file
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // Open devTools optionally
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(distPath, 'index.html'));
  }

  // Once the main window is ready to show, close splash and show main
  mainWindow.once('ready-to-show', () => {
    // Artificial delay just to ensure the splash is visible long enough to read (e.g. 2 seconds)
    // In a real app, you might wait for a specific IPC message from the renderer if it does heavy initialization
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
      }
    }, 2000);
  });
}

app.whenReady().then(() => {
  if (hasDbConfig()) {
    getPool().catch((err) => {
      log.error('Initial MSSQL connection pool error:', err.message);
    });
  } else {
    log.info('No database configuration found on startup. Wizard will be presented.');
  }

  createSplashWindow();
  
  // Initialize main window shortly after splash
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });

  // Check for updates quietly in the background
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  await closePool();
});

// IPC Setup
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-device-id', () => getOrCreateDeviceID());

// Helper: generate a PDF buffer from the current page using print media query
async function generatePDF(paperSize: string): Promise<Buffer> {
  if (!mainWindow) throw new Error('No main window');

  const pdfBuffer = await mainWindow.webContents.printToPDF({
    printBackground: true,
    preferCSSPageSize: true,
    margins: { marginType: 'none' },
  });

  return Buffer.from(pdfBuffer);
}

// Export PDF: generates PDF and opens a save dialog with the default filename
ipcMain.handle('export-pdf', async (_event, options: { title: string; paperSize: string }) => {
  try {
    const pdfBuffer = await generatePDF(options.paperSize);

    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow!, {
      title: 'Save Receipt PDF',
      defaultPath: join(app.getPath('downloads'), `${options.title}.pdf`),
      filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
    });

    if (canceled || !filePath) {
      return { success: false, error: 'Cancelled' };
    }

    await writeFile(filePath, pdfBuffer);
    log.info(`Receipt PDF saved to: ${filePath}`);
    return { success: true, filePath };
  } catch (err: any) {
    log.error('Failed to export PDF:', err);
    return { success: false, error: err.message };
  }
});

// Preview PDF: generates PDF, saves to temp, and opens in system default viewer
ipcMain.handle('preview-pdf', async (_event, options: { title: string; paperSize: string }) => {
  try {
    const pdfBuffer = await generatePDF(options.paperSize);
    const tempPath = join(app.getPath('temp'), `${options.title}.pdf`);
    await writeFile(tempPath, pdfBuffer);
    
    // shell.openPath returns an empty string on success, and a non-empty error message on failure.
    const openError = await shell.openPath(tempPath);
    if (openError) {
      log.warn(`shell.openPath failed with error: "${openError}". Falling back to internal BrowserWindow preview.`);
      
      const pdfWindow = new BrowserWindow({
        width: 850,
        height: 900,
        title: options.title || 'Receipt Preview',
        autoHideMenuBar: true,
        webPreferences: {
          plugins: true, // Enable plugins (required for Chromium PDF viewer in some Electron versions)
          contextIsolation: true,
          sandbox: true,
        }
      });
      
      // Load the PDF file directly. Chromium's built-in PDF viewer will render it.
      await pdfWindow.loadFile(tempPath);
    } else {
      log.info(`Receipt PDF preview opened in system viewer: ${tempPath}`);
    }
    return { success: true };
  } catch (err: any) {
    log.error('Failed to preview PDF:', err);
    return { success: false, error: err.message };
  }
});





// Database Setup, Telemetry & Fail-Safe IPC Handlers (fees_tracker architecture)
ipcMain.handle('db-check-config', () => {
  return hasDbConfig();
});

ipcMain.handle('db-save-config', async (_event, config: any) => {
  try {
    await saveDbConfig(config);
    return { success: true };
  } catch (err: any) {
    log.error('Failed to save database configuration:', err.message);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('db-test-connection', async (_event, config: any) => {
  return await testConnection(config);
});

ipcMain.handle('db-initialize', async () => {
  return await initMssqlDatabase();
});

ipcMain.handle('db-get-connection-info', async () => {
  try {
    const config = getDbConfig();
    if (!config) return { success: false, error: 'No connection configuration found.' };
    return {
      success: true,
      config: {
        server: config.server,
        port: config.port || 1433,
        database: config.database,
        user: config.user,
        encrypt: config.encrypt,
        trustServerCertificate: config.trustServerCertificate
      }
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('db-get-status', async () => {
  return await getStatus();
});

ipcMain.handle('db-reset-config', async () => {
  try {
    await resetDbConfig();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

// Sandbox / Training Grounds IPC Handlers
ipcMain.handle('db-toggle-sandbox', async (_event, enabled: boolean) => {
  try {
    return await toggleSandboxMode(enabled);
  } catch (err: any) {
    log.error('Failed to toggle sandbox mode:', err.message);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('db-reset-sandbox', async () => {
  try {
    return await resetSandboxDatabase();
  } catch (err: any) {
    log.error('Failed to reset sandbox database:', err.message);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('db-get-sandbox-status', () => {
  return { isSandbox: isSandboxActive() };
});

// Generic database IPC handler
ipcMain.handle('db:call', async (_event, serviceName: string, methodName: string, ...args: any[]) => {
  try {
    const handler = dbHandlers[serviceName]?.[methodName];
    if (!handler) {
      throw new Error(`Handler dbHandlers.${serviceName}.${methodName} is not defined`);
    }
    return await handler(...args);
  } catch (err: any) {
    log.error(`IPC db:call Error in dbHandlers.${serviceName}.${methodName}:`, err.message);
    throw err;
  }
});

// Window Controls
ipcMain.handle('window-minimize', () => mainWindow?.minimize());
ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.handle('window-close', () => mainWindow?.close());

// Auto Updater Setup
autoUpdater.logger = log;
autoUpdater.autoDownload = false; // Disable automatic background updates downloading

autoUpdater.on('update-available', (info) => {
  log.info('Update available:', info);
  mainWindow?.webContents.send('update-available', info);
});
autoUpdater.on('update-not-available', () => {
  log.info('Update not available.');
  mainWindow?.webContents.send('update-not-available');
});
autoUpdater.on('download-progress', (progressObj) => {
  log.info(`Download progress: ${progressObj.percent}%`);
  mainWindow?.webContents.send('download-progress', progressObj);
});
autoUpdater.on('update-downloaded', () => {
  log.info('Update downloaded.');
  mainWindow?.webContents.send('update-downloaded');
});
autoUpdater.on('error', (err) => {
  log.error('Error in auto-updater:', err);
  mainWindow?.webContents.send('update-error', err.message);
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall();
});

ipcMain.handle('download-update', async () => {
  try {
    log.info('Starting update download...');
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (err: any) {
    log.error('Download update failed:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('check-for-updates', async () => {
  if (!app.isPackaged) {
    return { success: false, error: 'Cannot check for updates in development mode' };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    return { success: true };
  } catch (err: any) {
    log.error('Check for updates failed:', err);
    return { success: false, error: err.message };
  }
});
