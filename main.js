const { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

// Database imports
const { db, TodosDB, SubscriptionsDB, SettingsDB } = require('./database');

// Window references
let settingsWindow = null;  // PRIMARY - Settings window
let petWindow = null;       // SECONDARY - Pet overlay
let tray = null;
let isQuitting = false;

// Debugging flags
let petInteractiveDebug = false; // Debug disabled by default

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
    backgroundColor: '#000000',
    icon: (() => {
      // Try PNG first, fallback to SVG
      const pngPath = path.join(__dirname, 'assets', 'icon.png');
      const svgPath = path.join(__dirname, 'assets', 'icon.svg');
      
      if (fs.existsSync(pngPath)) {
        return pngPath;
      } else if (fs.existsSync(svgPath)) {
        return svgPath;
      } else {
        // Fallback to no icon
        return undefined;
      }
    })(),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load from Vite dev server in development, or from dist in production
  const isDev = !app.isPackaged;
  if (isDev) {
    const devUrl = process.env.DEV_SERVER_URL || `http://localhost:${process.env.PORT || 5173}`;
    console.log('DEV_SERVER_URL resolved for settings:', devUrl);
    settingsWindow.loadURL(`${devUrl}/src/settings/index.html`);
  } else {
    settingsWindow.loadFile(path.join(__dirname, 'dist', 'settings.html'));
  }

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

  // Load from Vite dev server in development, or from dist in production
  const isDev = !app.isPackaged;
  if (isDev) {
    const devUrl = process.env.DEV_SERVER_URL || `http://localhost:${process.env.PORT || 5173}`;
    console.log('DEV_SERVER_URL resolved for pet:', devUrl);
    petWindow.loadURL(`${devUrl}/src/pet/index.html`);
  } else {
    petWindow.loadFile(path.join(__dirname, 'dist', 'pet.html'));
  }

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

// NEW: Fullscreen overlay + small interactive window (pet mode)
let petOverlayWindow = null;      // FULLSCREEN visual (click-through)
let petInteractiveWindow = null;  // SMALL interactive hit area

function getDevUrl() {
  return process.env.DEV_SERVER_URL || `http://localhost:${process.env.PORT || 5173}`;
}

function createPetOverlayWindow() {
  if (petOverlayWindow) return;

  const display = screen.getPrimaryDisplay();
  const { width, height } = display.bounds;

  petOverlayWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    fullscreenable: false,
    type: 'toolbar', // Helps with click-through on Windows
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (!app.isPackaged) {
    const devUrl = getDevUrl();
    console.log('DEV_SERVER_URL resolved for pet overlay:', devUrl);
    petOverlayWindow.loadURL(`${devUrl}/src/pet/index.html?mode=overlay`);
  } else {
    petOverlayWindow.loadFile(path.join(__dirname, 'dist', 'pet.html'));
  }

  // Make fully click-through so underlying windows receive events
  petOverlayWindow.setIgnoreMouseEvents(true);

  petOverlayWindow.once('ready-to-show', () => {
    petOverlayWindow.show();
  });

  petOverlayWindow.on('closed', () => {
    petOverlayWindow = null;
  });

  console.log('Pet overlay window created');
}

function createPetInteractiveWindow(bounds = { width: 180, height: 120, x: 100, y: 100 }) {
  if (petInteractiveWindow) {
    try {
      petInteractiveWindow.setBounds(bounds);
    } catch (e) {}
    return;
  }

  petInteractiveWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    // Remove type to allow proper mouse events on Windows
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // DON'T set ignoreMouseEvents - we need to receive clicks!
  
  if (!app.isPackaged) {
    const devUrl = getDevUrl();
    console.log('DEV_SERVER_URL resolved for pet interactive:', devUrl);
    petInteractiveWindow.loadURL(`${devUrl}/src/pet/index.html?mode=interactive`);
  } else {
    petInteractiveWindow.loadFile(path.join(__dirname, 'dist', 'pet.html'));
  }

  petInteractiveWindow.once('ready-to-show', () => {
    petInteractiveWindow.show();
    // Inform the interactive renderer whether to show debug hitbox (env var overrides)
    const envDebug = Boolean(process.env.PET_DEBUG_HITBOX === '1');
    try {
      petInteractiveWindow.webContents.send('pet:hitbox-debug', petInteractiveDebug || envDebug);
    } catch (e) {}
  });

  petInteractiveWindow.on('closed', () => {
    petInteractiveWindow = null;
  });

  console.log('Pet interactive window created');
}

function destroyPetOverlayWindow() {
  if (petOverlayWindow) {
    petOverlayWindow.close();
    petOverlayWindow = null;
    console.log('Pet overlay window destroyed');
  }
}

function destroyPetInteractiveWindow() {
  if (petInteractiveWindow) {
    petInteractiveWindow.close();
    petInteractiveWindow = null;
    console.log('Pet interactive window destroyed');
  }
}

// Track last bounds received from overlay for restoration after expand/shrink
let lastOverlayBounds = null;

function updateInteractiveWindowBounds(bounds) {
  // Expecting CSS pixels + dpr (from renderer)
  if (!bounds) return;
  const cssX = bounds.x;
  const cssY = bounds.y;
  const cssW = bounds.width;
  const cssH = bounds.height;

  // Find the display for the CSS point
  const display = screen.getDisplayNearestPoint({ x: Math.round(cssX), y: Math.round(cssY) });
  const scale = display ? (display.scaleFactor || 1) : 1;

  // Convert CSS pixels -> physical pixels using display scale factor
  // Use minimum 40px for smaller, tighter hitbox
  const physX = Math.round(cssX * scale);
  const physY = Math.round(cssY * scale);
  const physW = Math.max(40, Math.round(cssW * scale));
  const physH = Math.max(40, Math.round(cssH * scale));

  const newBounds = { x: physX, y: physY, width: physW, height: physH };

  // Always save bounds for restoration after expand/shrink
  lastOverlayBounds = newBounds;

  if (petInteractiveWindow) {
    try {
      petInteractiveWindow.setBounds(newBounds);
    } catch (e) {
      console.warn('setBounds failed', e);
    }
  }
}

// ============================================
// IPC Handlers - Window Control
// ============================================

// Pet mode passthrough control (keep backward compatible)
ipcMain.on('window:toggle-pet-mode', (event, enabled) => {
  if (enabled) {
    // Create both windows for fullscreen visual + interactive hitbox
    createPetOverlayWindow();
    createPetInteractiveWindow();
  } else {
    destroyPetOverlayWindow();
    destroyPetInteractiveWindow();
  }
  // Notify all windows about the change
  if (settingsWindow) {
    settingsWindow.webContents.send('pet-mode-changed', enabled);
  }
  updateTrayMenu();
});

// New: Set pet fullscreen explicitly
ipcMain.on('window:set-pet-fullscreen', (event, enabled) => {
  if (enabled) {
    createPetOverlayWindow();
    createPetInteractiveWindow();
  } else {
    destroyPetOverlayWindow();
    destroyPetInteractiveWindow();
  }
  if (settingsWindow) settingsWindow.webContents.send('pet-mode-changed', enabled);
  updateTrayMenu();
});

// Update interactive window bounds from renderer (overlay can push bounds)
ipcMain.on('window:update-interactive-bounds', (event, bounds) => {
  updateInteractiveWindowBounds(bounds);
});

// Expand interactive window to fullscreen during drag (to catch fast mouse moves)
ipcMain.on('window:expand-interactive-for-drag', (event, expand) => {
  if (!petInteractiveWindow) return;

  if (expand) {
    const display = screen.getPrimaryDisplay();
    const { width, height } = display.bounds;
    try {
      petInteractiveWindow.setBounds({ x: 0, y: 0, width, height });
      console.log('Interactive window expanded for drag');
    } catch (e) {
      console.warn('Failed to expand interactive window:', e);
    }
  } else {
    // Restore to last known overlay bounds (set by updateInteractiveWindowBounds)
    if (lastOverlayBounds) {
      try {
        petInteractiveWindow.setBounds(lastOverlayBounds);
        console.log('Interactive window restored to overlay bounds');
      } catch (e) {
        console.warn('Failed to restore interactive window:', e);
      }
    }
  }
});

// Toggle debug visualization of the interactive hitbox at runtime
ipcMain.on('window:toggle-hitbox-debug', () => {
  petInteractiveDebug = !petInteractiveDebug;
  if (petInteractiveWindow && petInteractiveWindow.webContents) {
    petInteractiveWindow.webContents.send('pet:hitbox-debug', petInteractiveDebug);
  }
});

// Forward input from interactive window to overlay window
ipcMain.on('pet:input', (event, data) => {
  if (petOverlayWindow && petOverlayWindow.webContents) {
    petOverlayWindow.webContents.send('pet:input', data);
  }
});

// Target system state
let targetModeActive = false;
let attackTarget = null;
let positionLocked = false;

// Enable target selection mode
ipcMain.on('pet:set-target-mode', (event, enabled) => {
  targetModeActive = enabled;
  console.log('Target mode:', enabled ? 'enabled' : 'disabled');
  
  // When target mode is active, next click will set the target
  if (enabled && petOverlayWindow) {
    petOverlayWindow.webContents.send('pet:target-mode-active', true);
  }
});

// Set attack target and trigger pet movement
ipcMain.on('pet:move-to-target', (event, target) => {
  attackTarget = target;
  targetModeActive = false;
  console.log('Attack target set:', target);
  
  // Notify overlay window to animate pet to target
  if (petOverlayWindow && petOverlayWindow.webContents) {
    petOverlayWindow.webContents.send('pet:target-set', target);
  }
});

// Cancel target selection
ipcMain.on('pet:cancel-target', () => {
  targetModeActive = false;
  attackTarget = null;
  console.log('Target cancelled');
  
  if (petOverlayWindow && petOverlayWindow.webContents) {
    petOverlayWindow.webContents.send('pet:target-cancelled');
  }
});

// Toggle position lock
ipcMain.on('pet:toggle-lock', (event, locked) => {
  positionLocked = locked;
  console.log('Position lock:', locked);

  // Notify overlay to enable/disable dragging
  if (petOverlayWindow && petOverlayWindow.webContents) {
    petOverlayWindow.webContents.send('pet:position-locked', locked);
  }
});

// Forward context menu state from interactive window to overlay
ipcMain.on('pet:context-menu-state', (event, open) => {
  console.log('Context menu state:', open);
  if (petOverlayWindow && petOverlayWindow.webContents) {
    petOverlayWindow.webContents.send('pet:context-menu-state', open);
  }
});

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

    // Enable fullscreen pet mode by default
    createPetOverlayWindow();
    createPetInteractiveWindow();
    
    // Save default state to settings
    try {
      SettingsDB.set('petModeEnabled', true);
      SettingsDB.set('petFullscreenMode', true);
    } catch (e) {
      console.warn('Failed to save default pet mode settings:', e);
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
  // Create tray icon using new minimalist design
  const trayIconPath = path.join(__dirname, 'assets', 'tray-icon.svg');
  
  let trayIcon = nativeImage.createFromPath(trayIconPath);
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
          createPetOverlayWindow();
          createPetInteractiveWindow();
        } else {
          destroyPetOverlayWindow();
          destroyPetInteractiveWindow();
        }

        // Notify settings window
        if (settingsWindow) {
          settingsWindow.webContents.send('pet-mode-changed', enabled);
        }
      }
    },
    {
      label: 'Show Pet',
      enabled: petModeEnabled && (petOverlayWindow !== null || petInteractiveWindow !== null),
      click: () => {
        if (petOverlayWindow) {
          petOverlayWindow.show();
        }
        if (petInteractiveWindow) {
          petInteractiveWindow.show();
        }
      }
    },
    {
      label: 'Hide Pet',
      enabled: petModeEnabled && (petOverlayWindow !== null || petInteractiveWindow !== null),
      click: () => {
        if (petOverlayWindow) {
          petOverlayWindow.hide();
        }
        if (petInteractiveWindow) {
          petInteractiveWindow.hide();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Reset Pet Position',
      enabled: petModeEnabled,
      click: () => {
        // Send reset signal to overlay window
        if (petOverlayWindow && petOverlayWindow.webContents) {
          petOverlayWindow.webContents.send('pet:reset-position');
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
