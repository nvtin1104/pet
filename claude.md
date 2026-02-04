# Claude Code Agent Guide - PetFocus

## Project Context

PetFocus is an Electron desktop pet + productivity app. You are working on the `electron` branch.

**Tech Stack:** Electron 40.x, Vue 3, Vite, Tailwind CSS, TypeScript, sql.js, Canvas (Pet)

## Project Structure

```
pet/
├── main.js                 # Electron main process, IPC handlers, window management
├── preload.js              # contextBridge API, IPC whitelist
├── vite.config.js          # Vite build config (pet + settings entry points)
├── package.json
├── tsconfig.json
│
├── database/               # SQLite database layer (main process only)
│   ├── index.js            # Exports all DB modules
│   ├── db.js               # sql.js init, migrations
│   ├── todos.js            # Todo CRUD
│   ├── subscriptions.js    # Subscription CRUD
│   └── settings.js         # Key-value settings store
│
├── src/
│   ├── pet/                # Pet Vue app (overlay + interactive windows)
│   │   ├── index.html      # Entry HTML with CSP
│   │   ├── main.ts         # Vue app bootstrap
│   │   ├── App.vue         # Root component, context menu state
│   │   ├── components/
│   │   │   ├── PetCanvas.vue       # Canvas rendering, sprite animation, hitbox
│   │   │   └── PetContextMenu.vue  # Right-click menu component
│   │   └── styles/
│   │       └── main.css    # Tailwind imports
│   │
│   ├── settings/           # Settings Vue app
│   │   ├── index.html
│   │   ├── main.ts
│   │   ├── App.vue
│   │   ├── components/
│   │   │   ├── Navigation.vue
│   │   │   ├── SettingsSection.vue
│   │   │   ├── TodosSection.vue
│   │   │   ├── SubscriptionsSection.vue
│   │   │   └── TimerSection.vue
│   │   ├── composables/    # State + IPC logic
│   │   │   ├── useSettings.ts
│   │   │   ├── useTodos.ts
│   │   │   ├── useSubscriptions.ts
│   │   │   └── useTimer.ts
│   │   └── styles/
│   │       └── main.css
│   │
│   ├── types/
│   │   ├── petAPI.d.ts     # window.petAPI type definitions
│   │   └── vue-shim.d.ts
│   │
│   └── styles/
│       └── tailwind.css    # Shared Tailwind base
│
├── scripts/
│   ├── start-dev.js        # Dev server launcher
│   └── create-icon.js
│
└── assets/                 # Sprite sheets, icons
    └── knight/
        └── Colour1/Outline/120x80_PNGSheets/
```

## Two-Window Pet Architecture

PetFocus uses a **dual-window system** for the pet overlay:

```
┌─────────────────────────────────────────────────────────────┐
│  petOverlayWindow (fullscreen, mode=overlay)                │
│  - Renders pet sprite visually                              │
│  - ALWAYS click-through (setIgnoreMouseEvents(true))        │
│  - Receives state updates via IPC                           │
│  - Does NOT receive mouse events directly                   │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ IPC: pet:input, pet:context-menu-state
                              │
┌─────────────────────────────────────────────────────────────┐
│  petInteractiveWindow (small hitbox, mode=interactive)      │
│  - Receives actual mouse clicks                             │
│  - Forwards events to overlay via IPC                       │
│  - Expands to fullscreen when context menu opens            │
│  - Shows context menu locally (PetContextMenu component)    │
└─────────────────────────────────────────────────────────────┘
```

**Mode Detection:** `src/pet/components/PetCanvas.vue:76`
```javascript
const mode = new URLSearchParams(window.location.search).get('mode') || 'interactive';
```

## Key Files

| File | Purpose | Priority |
|------|---------|----------|
| `main.js` | Electron main process, IPC handlers, window config | High |
| `preload.js` | contextBridge API exposure, channel whitelist | High |
| `src/pet/components/PetCanvas.vue` | Pet rendering, sprite animation, hitbox, events | High |
| `src/pet/components/PetContextMenu.vue` | Right-click context menu | High |
| `src/pet/App.vue` | Pet app root, context menu state management | High |
| `database/db.js` | sql.js initialization, migrations | High |
| `src/settings/` | Settings window Vue app | Medium |
| `src/types/petAPI.d.ts` | TypeScript definitions for window.petAPI | Medium |

## Development Commands

```bash
npm install          # Install dependencies
npm start            # Launch app (production mode)
npm run dev          # Launch with Vite dev server (HMR)
npm run build        # Build for production
```

## Architecture Rules

### Critical Security (NEVER change)

1. **`nodeIntegration: false`** - Prevents XSS attacks from accessing Node
2. **`contextIsolation: true`** - Isolates preload from renderer
3. **Database in main process ONLY** - Renderer uses IPC
4. **Whitelist IPC channels** - See `preload.js` validChannels

### Design Patterns

1. **IPC Communication:** `ipcMain.handle` + `ipcRenderer.invoke` (Promise-based)
2. **Two-Window Pet:** Overlay (visual) + Interactive (hitbox) windows
3. **Context Menu:** Rendered in interactive window, state synced to overlay via IPC
4. **Hitbox Config:** Configurable via `HITBOX_CONFIG` object in PetCanvas.vue

## IPC Channel Reference

### Database Channels (invoke)
| Channel | Handler |
|---------|---------|
| `db:get-todos` | TodosDB.getAll |
| `db:create-todo` | TodosDB.create |
| `db:update-todo` | TodosDB.update |
| `db:delete-todo` | TodosDB.delete |
| `db:get-subscriptions` | SubscriptionsDB.getAll |
| `db:get-settings` | SettingsDB.getAll |
| `db:update-settings` | SettingsDB.set |

### Window Channels (send)
| Channel | Purpose |
|---------|---------|
| `window:toggle-passthrough` | Enable/disable click-through |
| `window:set-position` | Move pet window |
| `window:update-interactive-bounds` | Update hitbox position/size |
| `window:expand-interactive-for-drag` | Expand/shrink interactive window |
| `window:show-settings` | Open settings window |

### Pet Channels (send)
| Channel | Purpose |
|---------|---------|
| `pet:input` | Forward mouse events from interactive to overlay |
| `pet:context-menu-state` | Sync context menu open/close state |
| `pet:toggle-lock` | Lock/unlock pet position |
| `pet:set-target-mode` | Enable attack target selection |
| `pet:move-to-target` | Set attack destination |

### Event Channels (on)
| Channel | Purpose |
|---------|---------|
| `pet:input` | Receive forwarded mouse events |
| `pet:context-menu-state` | Receive context menu state |
| `pet:hitbox-debug` | Toggle hitbox debug visualization |
| `pet:position-locked` | Receive lock state |
| `pet:target-set` | Receive attack target |

## Common Tasks

### Add New IPC Channel

```javascript
// 1. preload.js - Add to validChannels
const validChannels = {
  send: ['existing...', 'new:channel'],
  on: ['existing...', 'new:channel'],
};

// 2. preload.js - Expose via contextBridge
contextBridge.exposeInMainWorld('petAPI', {
  newMethod: () => ipcRenderer.send('new:channel'),
  on: {
    newEvent: (cb) => {
      ipcRenderer.on('new:channel', (_, data) => cb(data));
    }
  }
});

// 3. main.js - Add handler
ipcMain.on('new:channel', (event, data) => {
  // Handle
});

// 4. src/types/petAPI.d.ts - Add type
interface PetAPI {
  newMethod(): void;
  on: {
    newEvent(callback: (data: any) => void): () => void;
  };
}
```

### Modify Hitbox Size

```javascript
// src/pet/components/PetCanvas.vue - Lines 424-430
const HITBOX_CONFIG = {
  minSize: 30,        // Minimum hitbox dimension
  topPadding: 0,      // Padding above sprite
  sidePadding: 0,     // Padding left/right
  bottomPadding: 2    // Padding below sprite
};
```

### Add Pet State/Animation

```javascript
// src/pet/components/PetCanvas.vue
const STATES = {
  IDLE: 'idle',
  RUN: 'run',
  SLEEP: 'sleep',
  ATTACK: 'attack',
  WALL_SLIDE: 'wallSlide',
  NEW_STATE: 'newState',  // Add here
};

const SPRITES = {
  newState: {
    src: '/assets/knight/Colour1/Outline/120x80_PNGSheets/_NewState.png',
    frames: 10,
    frameRate: 8
  }
};

// Update startBehavior() to transition to new state
```

### Add Context Menu Item

```vue
<!-- src/pet/components/PetContextMenu.vue -->
<div class="menu-item" @click="handleNewAction">
  <NewIcon class="icon" :size="16" />
  <span>New Action</span>
</div>

<script setup>
const emit = defineEmits(['close', 'new-action']);
function handleNewAction() {
  emit('new-action');
  emit('close');
}
</script>

<!-- src/pet/App.vue -->
<PetContextMenu @new-action="handleNewAction" />
```

## Debugging

### Enable DevTools
```javascript
// main.js - In createPetOverlayWindow() or createSettingsWindow()
window.webContents.openDevTools({ mode: 'detached' });
```

### Locations
- **Main process logs:** Terminal running `npm start`
- **Renderer logs:** DevTools console (F12)
- **Database file:** `%APPDATA%/petfocus/petfocus.db`

### Debug Hitbox
```javascript
// DevTools console - Toggle hitbox visualization
window.petAPI.window.toggleHitboxDebug()
```

### Test API in Console
```javascript
await window.petAPI.db.getTodos()
await window.petAPI.db.getSettings()
window.petAPI.pet.toggleLock(true)
```

## Testing Checklist

- [ ] `npm start` - App khoi dong khong loi
- [ ] Pet animations play correctly
- [ ] Click triggers attack animation
- [ ] Double-click opens settings
- [ ] Right-click opens context menu
- [ ] Context menu items work (Settings, Lock, Attack Target)
- [ ] Drag pet works
- [ ] Mouse passthrough on transparent areas
- [ ] Data persists across restart
- [ ] No console errors in DevTools

## Resources

- [Electron Docs](https://www.electronjs.org/docs/latest/)
- [Vue 3 Docs](https://vuejs.org/)
- [sql.js API](https://sql.js.org/documentation/)
- [Tailwind CSS](https://tailwindcss.com/docs)
