import { app, BrowserWindow, shell, ipcMain, nativeTheme } from 'electron';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import log from 'electron-log/main';
import { autoUpdater } from 'electron-updater';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// IPC Setup
ipcMain.handle('get-app-version', () => app.getVersion());

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
autoUpdater.on('update-available', () => {
  log.info('Update available.');
  mainWindow?.webContents.send('update-available');
});
autoUpdater.on('update-not-available', () => {
  log.info('Update not available.');
  mainWindow?.webContents.send('update-not-available');
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
