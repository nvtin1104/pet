const { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

// Database imports
const { db, TodosDB, SubscriptionsDB, SettingsDB } = require('./database');

// Window references
let settingsWindow = null;  // PRIMARY - Settings window
let petWindow = null;       // SECONDARY - Pet overlay
let tray = null;
let isQuitting = false;

// ============================================
// Settings Window Creation (PRIMARY)
// ============================================

function createSettingsWindow() {
  settingsWindow = new BrowserWindow({
    width: 950,
    height: 680,
    minWidth: 750,
    minHeight: 550,
    show: false,
    frame: true,
    transparent: false,
    resizable: true,
    skipTaskbar: false,
    backgroundColor: '#0f0f1a',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  settingsWindow.loadFile('settings.html');

  // Show when ready
  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show();
  });

  // Minimize to tray instead of closing (unless quitting)
  settingsWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      settingsWindow.hide();
    }
  });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });

  // Open DevTools in development (uncomment to debug)
  // settingsWindow.webContents.openDevTools({ mode: 'detached' });

  console.log('Settings window created');
}

// ============================================
// Pet Window Creation (SECONDARY - Transparent Overlay)
// ============================================

function createPetWindow() {
  if (petWindow) {
    petWindow.show();
    return;
  }

  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;

  petWindow = new BrowserWindow({
    width: 200,
    height: 280,
    x: width - 220,
    y: height - 300,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    paintWhenInitiallyHidden: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  petWindow.loadFile('index.html');

  // Enable click-through for transparent areas
  petWindow.setIgnoreMouseEvents(true, { forward: true });

  // Show when ready
  petWindow.once('ready-to-show', () => {
    petWindow.show();
  });

  petWindow.on('closed', () => {
    petWindow = null;
  });

  console.log('Pet window created');
}

function destroyPetWindow() {
  if (petWindow) {
    petWindow.close();
    petWindow = null;
    console.log('Pet window destroyed');
  }
}

// ============================================
// IPC Handlers - Window Control
// ============================================

let isPassthroughEnabled = true;

// Pet window passthrough control
ipcMain.on('window:toggle-passthrough', (event, ignore) => {
  if (petWindow && isPassthroughEnabled !== ignore) {
    isPassthroughEnabled = ignore;
    petWindow.setIgnoreMouseEvents(ignore, { forward: true });
  }
});

// Pet window position
ipcMain.on('window:set-position', (event, x, y) => {
  if (petWindow) {
    petWindow.setPosition(Math.round(x), Math.round(y));
  }
});

// Legacy handlers (keep for compatibility)
ipcMain.on('window:minimize-to-tray', () => {
  if (settingsWindow) {
    settingsWindow.hide();
  }
});

ipcMain.on('window:show-ui', () => {
  if (settingsWindow) {
    settingsWindow.show();
    settingsWindow.focus();
  }
});

ipcMain.on('window:hide-ui', () => {
  if (settingsWindow) {
    settingsWindow.hide();
  }
});

// NEW: Toggle pet mode
ipcMain.on('window:toggle-pet-mode', (event, enabled) => {
  if (enabled) {
    createPetWindow();
  } else {
    destroyPetWindow();
  }
  // Notify all windows about the change
  if (settingsWindow) {
    settingsWindow.webContents.send('pet-mode-changed', enabled);
  }
  // Update tray menu
  updateTrayMenu();
});

// NEW: Set always on top for pet window
ipcMain.on('window:set-always-on-top', (event, value) => {
  if (petWindow) {
    petWindow.setAlwaysOnTop(value);
  }
});

// NEW: Show settings window (from pet window double-click)
ipcMain.on('window:show-settings', () => {
  if (settingsWindow) {
    settingsWindow.show();
    settingsWindow.focus();
  }
});

// Get cursor position relative to pet window
ipcMain.handle('window:get-cursor-in-window', async () => {
  if (!petWindow) return null;

  const cursorPos = screen.getCursorScreenPoint();
  const windowBounds = petWindow.getBounds();

  const isInWindow = (
    cursorPos.x >= windowBounds.x &&
    cursorPos.x < windowBounds.x + windowBounds.width &&
    cursorPos.y >= windowBounds.y &&
    cursorPos.y < windowBounds.y + windowBounds.height
  );

  if (!isInWindow) return null;

  return {
    x: cursorPos.x - windowBounds.x,
    y: cursorPos.y - windowBounds.y
  };
});

// ============================================
// IPC Handlers - Database: Todos
// ============================================

ipcMain.handle('db:get-todos', async () => {
  try {
    return TodosDB.getAll();
  } catch (error) {
    console.error('db:get-todos error:', error);
    return [];
  }
});

ipcMain.handle('db:create-todo', async (event, data) => {
  try {
    return TodosDB.create(data);
  } catch (error) {
    console.error('db:create-todo error:', error);
    throw error;
  }
});

ipcMain.handle('db:update-todo', async (event, id, data) => {
  try {
    return TodosDB.update(id, data);
  } catch (error) {
    console.error('db:update-todo error:', error);
    throw error;
  }
});

ipcMain.handle('db:delete-todo', async (event, id) => {
  try {
    return TodosDB.delete(id);
  } catch (error) {
    console.error('db:delete-todo error:', error);
    throw error;
  }
});

// ============================================
// IPC Handlers - Database: Subscriptions
// ============================================

ipcMain.handle('db:get-subscriptions', async () => {
  try {
    return SubscriptionsDB.getAll();
  } catch (error) {
    console.error('db:get-subscriptions error:', error);
    return [];
  }
});

ipcMain.handle('db:create-subscription', async (event, data) => {
  try {
    return SubscriptionsDB.create(data);
  } catch (error) {
    console.error('db:create-subscription error:', error);
    throw error;
  }
});

ipcMain.handle('db:update-subscription', async (event, id, data) => {
  try {
    return SubscriptionsDB.update(id, data);
  } catch (error) {
    console.error('db:update-subscription error:', error);
    throw error;
  }
});

ipcMain.handle('db:delete-subscription', async (event, id) => {
  try {
    return SubscriptionsDB.delete(id);
  } catch (error) {
    console.error('db:delete-subscription error:', error);
    throw error;
  }
});

// ============================================
// IPC Handlers - Database: Settings
// ============================================

ipcMain.handle('db:get-settings', async () => {
  try {
    return SettingsDB.getAll();
  } catch (error) {
    console.error('db:get-settings error:', error);
    return SettingsDB.getDefaults();
  }
});

ipcMain.handle('db:update-settings', async (event, data) => {
  try {
    Object.entries(data).forEach(([key, value]) => {
      SettingsDB.set(key, value);
    });
    return SettingsDB.getAll();
  } catch (error) {
    console.error('db:update-settings error:', error);
    throw error;
  }
});

// ============================================
// Helper: Send events to renderer
// ============================================

function sendToSettings(channel, ...args) {
  if (settingsWindow && settingsWindow.webContents) {
    settingsWindow.webContents.send(channel, ...args);
  }
}

function sendToPet(channel, ...args) {
  if (petWindow && petWindow.webContents) {
    petWindow.webContents.send(channel, ...args);
  }
}

// ============================================
// App Lifecycle
// ============================================

app.whenReady().then(async () => {
  try {
    // Initialize database before creating window
    await db.init();
    console.log('Database initialized');

    // Initialize default settings
    SettingsDB.initDefaults();

    // Create system tray
    createTray();

    // Create settings window (primary)
    createSettingsWindow();

    // Check if pet mode was enabled - create pet window if so
    const settings = SettingsDB.getAll();
    if (settings.petModeEnabled) {
      createPetWindow();
    }
  } catch (error) {
    console.error('Failed to initialize app:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  db.close();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createSettingsWindow();
  }
});

// ============================================
// System Tray
// ============================================

function createTray() {
  // Create tray icon from sprite sheet
  const iconPath = path.join(__dirname, 'assets', 'knight', 'Colour1', 'Outline', '120x80_PNGSheets', '_Idle.png');

  let trayIcon = nativeImage.createFromPath(iconPath);
  trayIcon = trayIcon.crop({ x: 30, y: 10, width: 60, height: 60 });
  trayIcon = trayIcon.resize({ width: 16, height: 16 });

  tray = new Tray(trayIcon);
  tray.setToolTip('PetFocus');

  updateTrayMenu();

  // Double-click on tray icon shows settings
  tray.on('double-click', () => {
    if (settingsWindow) {
      if (settingsWindow.isVisible()) {
        settingsWindow.hide();
      } else {
        settingsWindow.show();
        settingsWindow.focus();
      }
    }
  });

  console.log('System tray created');
}

function updateTrayMenu() {
  if (!tray) return;

  const petModeEnabled = SettingsDB.get('petModeEnabled') || false;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Settings',
      click: () => {
        if (settingsWindow) {
          settingsWindow.show();
          settingsWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Pet Mode',
      type: 'checkbox',
      checked: petModeEnabled,
      click: (menuItem) => {
        const enabled = menuItem.checked;
        SettingsDB.set('petModeEnabled', enabled);

        if (enabled) {
          createPetWindow();
        } else {
          destroyPetWindow();
        }

        // Notify settings window
        if (settingsWindow) {
          settingsWindow.webContents.send('pet-mode-changed', enabled);
        }
      }
    },
    {
      label: 'Show Pet',
      enabled: petModeEnabled && petWindow !== null,
      click: () => {
        if (petWindow) {
          petWindow.show();
          petWindow.focus();
          petWindow.webContents.invalidate();
        }
      }
    },
    {
      label: 'Hide Pet',
      enabled: petModeEnabled && petWindow !== null,
      click: () => {
        if (petWindow) {
          petWindow.hide();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Reset Pet Position',
      enabled: petModeEnabled,
      click: () => {
        if (petWindow) {
          const display = screen.getPrimaryDisplay();
          const { width, height } = display.workAreaSize;
          petWindow.setPosition(width - 220, height - 300);
          petWindow.show();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

// Export for testing
module.exports = { sendToSettings, sendToPet };
