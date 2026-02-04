const { contextBridge, ipcRenderer } = require('electron');

// Whitelist of allowed channels for security
const validChannels = {
  invoke: [
    'db:get-todos',
    'db:create-todo',
    'db:update-todo',
    'db:delete-todo',
    'db:get-subscriptions',
    'db:create-subscription',
    'db:update-subscription',
    'db:delete-subscription',
    'db:get-settings',
    'db:update-settings',
    'window:get-cursor-in-window'
  ],
  send: [
    'window:toggle-passthrough',
    'window:set-position',
    'window:minimize-to-tray',
    'window:show-ui',
    'window:hide-ui',
    'window:toggle-pet-mode',
    'window:set-always-on-top',
    'window:show-settings',
    // New: fullscreen pet and interactive bounds
    'window:set-pet-fullscreen',
    'window:update-interactive-bounds',
    // New: expand interactive for fast drag
    'window:expand-interactive-for-drag',
    // New: input forwarded from interactive window to overlay
    'pet:input',
    // New: toggle debug visualization for hitbox
    'window:toggle-hitbox-debug',
    // New: target system
    'pet:set-target-mode',
    'pet:move-to-target',
    'pet:cancel-target',
    'pet:toggle-lock',
    // Context menu state sync between interactive and overlay windows
    'pet:context-menu-state'
  ],
  on: [
    'pet:state-change',
    'timer:tick',
    'timer:complete',
    'pet-mode-changed',
    // New: hitbox debug toggle
    'pet:hitbox-debug',
    // New: target system
    'pet:target-set',
    'pet:target-cancelled',
    'pet:position-locked',
    'pet:target-mode-active',
    // Context menu state from interactive window
    'pet:context-menu-state'
  ]
};

// Expose protected methods to renderer via contextBridge
contextBridge.exposeInMainWorld('petAPI', {
  // Database operations (Promise-based)
  db: {
    // Todos
    getTodos: () => ipcRenderer.invoke('db:get-todos'),
    createTodo: (data) => ipcRenderer.invoke('db:create-todo', data),
    updateTodo: (id, data) => ipcRenderer.invoke('db:update-todo', id, data),
    deleteTodo: (id) => ipcRenderer.invoke('db:delete-todo', id),

    // Subscriptions
    getSubscriptions: () => ipcRenderer.invoke('db:get-subscriptions'),
    createSubscription: (data) => ipcRenderer.invoke('db:create-subscription', data),
    updateSubscription: (id, data) => ipcRenderer.invoke('db:update-subscription', id, data),
    deleteSubscription: (id) => ipcRenderer.invoke('db:delete-subscription', id),

    // Settings
    getSettings: () => ipcRenderer.invoke('db:get-settings'),
    updateSettings: (data) => ipcRenderer.invoke('db:update-settings', data)
  },

  // Window control (fire-and-forget)
  window: {
    togglePassthrough: (ignore) => ipcRenderer.send('window:toggle-passthrough', ignore),
    setPosition: (x, y) => ipcRenderer.send('window:set-position', x, y),
    minimizeToTray: () => ipcRenderer.send('window:minimize-to-tray'),
    showUI: () => ipcRenderer.send('window:show-ui'),
    hideUI: () => ipcRenderer.send('window:hide-ui'),
    getCursorInWindow: () => ipcRenderer.invoke('window:get-cursor-in-window'),
    // NEW: Pet mode controls
    togglePetMode: (enabled) => ipcRenderer.send('window:toggle-pet-mode', enabled),
    setAlwaysOnTop: (value) => ipcRenderer.send('window:set-always-on-top', value),
    showSettings: () => ipcRenderer.send('window:show-settings'),

    // New: fullscreen pet mode + bounds
    setPetFullscreen: (enabled) => ipcRenderer.send('window:set-pet-fullscreen', enabled),
    updateInteractiveBounds: (bounds) => ipcRenderer.send('window:update-interactive-bounds', bounds),

    // New: expand interactive window for drag (to catch fast mouse moves)
    expandInteractiveForDrag: (expand) => ipcRenderer.send('window:expand-interactive-for-drag', expand),

    // New: interactive to overlay input forwarding
    sendPetInput: (data) => ipcRenderer.send('pet:input', data),

    // New: toggle debug visualization
    toggleHitboxDebug: () => ipcRenderer.send('window:toggle-hitbox-debug')
  },

  // Pet control operations
  pet: {
    setTargetMode: (enabled) => ipcRenderer.send('pet:set-target-mode', enabled),
    moveToTarget: (x, y) => ipcRenderer.send('pet:move-to-target', { x, y }),
    cancelTarget: () => ipcRenderer.send('pet:cancel-target'),
    toggleLock: (locked) => ipcRenderer.send('pet:toggle-lock', locked),
    // Context menu state sync
    setContextMenuState: (open) => ipcRenderer.send('pet:context-menu-state', open)
  },



  // Event listeners (main -> renderer)
  on: {
    petStateChange: (callback) => {
      const handler = (_, state) => callback(state);
      ipcRenderer.on('pet:state-change', handler);
      return () => ipcRenderer.removeListener('pet:state-change', handler);
    },
    timerTick: (callback) => {
      const handler = (_, seconds) => callback(seconds);
      ipcRenderer.on('timer:tick', handler);
      return () => ipcRenderer.removeListener('timer:tick', handler);
    },
    timerComplete: (callback) => {
      const handler = () => callback();
      ipcRenderer.on('timer:complete', handler);
      return () => ipcRenderer.removeListener('timer:complete', handler);
    },
    // NEW: Pet mode changed listener
    petModeChanged: (callback) => {
      const handler = (_, enabled) => callback(enabled);
      ipcRenderer.on('pet-mode-changed', handler);
      return () => ipcRenderer.removeListener('pet-mode-changed', handler);
    },

    // New: input forwarded from interactive window
    petInput: (callback) => {
      const handler = (_, data) => callback(data);
      ipcRenderer.on('pet:input', handler);
      return () => ipcRenderer.removeListener('pet:input', handler);
    },

    // New: hitbox debug toggle listener
    hitboxDebug: (callback) => {
      const handler = (_, enabled) => callback(enabled);
      ipcRenderer.on('pet:hitbox-debug', handler);
      return () => ipcRenderer.removeListener('pet:hitbox-debug', handler);
    },

    // New: target system listeners
    targetSet: (callback) => {
      const handler = (_, target) => callback(target);
      ipcRenderer.on('pet:target-set', handler);
      return () => ipcRenderer.removeListener('pet:target-set', handler);
    },
    targetCancelled: (callback) => {
      const handler = () => callback();
      ipcRenderer.on('pet:target-cancelled', handler);
      return () => ipcRenderer.removeListener('pet:target-cancelled', handler);
    },
    positionLocked: (callback) => {
      const handler = (_, locked) => callback(locked);
      ipcRenderer.on('pet:position-locked', handler);
      return () => ipcRenderer.removeListener('pet:position-locked', handler);
    },
    targetModeActive: (callback) => {
      const handler = (_, active) => callback(active);
      ipcRenderer.on('pet:target-mode-active', handler);
      return () => ipcRenderer.removeListener('pet:target-mode-active', handler);
    },
    // Context menu state from interactive window
    contextMenuState: (callback) => {
      const handler = (_, open) => callback(open);
      ipcRenderer.on('pet:context-menu-state', handler);
      return () => ipcRenderer.removeListener('pet:context-menu-state', handler);
    }
  },



  // Remove all listeners for a channel
  removeAllListeners: (channel) => {
    if (validChannels.on.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  }
});

console.log('PetFocus preload script loaded');
