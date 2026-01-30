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
    'window:show-settings'
  ],
  on: [
    'pet:state-change',
    'timer:tick',
    'timer:complete',
    'pet-mode-changed'
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
    showSettings: () => ipcRenderer.send('window:show-settings')
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
