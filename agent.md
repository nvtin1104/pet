# AI Agent Guide - PetFocus

## Project Context

PetFocus is an Electron desktop pet + productivity app. Branch: `electron`

**Tech Stack:** Electron 40.x, Vue 3, Vite, Tailwind CSS, TypeScript, sql.js, Canvas (Pet)

## Project Structure

```
pet/
├── main.js                 # Electron main process, IPC handlers, window management
├── preload.js              # contextBridge API, IPC whitelist
├── vite.config.js          # Vite build config
├── database/               # SQLite layer (main process only)
│   ├── db.js               # sql.js init, migrations
│   ├── todos.js            # Todo CRUD
│   ├── subscriptions.js    # Subscription CRUD
│   └── settings.js         # Key-value settings
│
├── src/pet/                # Pet Vue app (dual-window system)
│   ├── App.vue             # Root, context menu state
│   └── components/
│       ├── PetCanvas.vue   # Canvas rendering, sprite, hitbox
│       └── PetContextMenu.vue # Right-click menu
│
├── src/settings/           # Settings Vue app
│   ├── App.vue
│   ├── components/         # UI sections
│   └── composables/        # State + IPC logic
│
└── src/types/
    └── petAPI.d.ts         # TypeScript definitions
```

## Key Files

| File | Purpose |
|------|---------|
| `main.js` | Electron main process, window management, IPC handlers |
| `preload.js` | IPC whitelist, contextBridge API |
| `src/pet/components/PetCanvas.vue` | Pet rendering, animation, hitbox, events |
| `src/pet/components/PetContextMenu.vue` | Right-click context menu |
| `src/pet/App.vue` | Pet root component, context menu state |
| `database/db.js` | sql.js initialization, migrations |
| `src/types/petAPI.d.ts` | TypeScript definitions for window.petAPI |

## Two-Window Pet Architecture

```
petOverlayWindow (fullscreen, mode=overlay)
  - Renders pet visually
  - ALWAYS click-through
  - Receives events via IPC
        ▲
        │ IPC: pet:input, pet:context-menu-state
        │
petInteractiveWindow (small hitbox, mode=interactive)
  - Receives mouse clicks
  - Forwards to overlay via IPC
  - Expands fullscreen for context menu
  - Shows context menu locally
```

## Critical Security (NEVER change)

1. `nodeIntegration: false`
2. `contextIsolation: true`
3. Database in main process ONLY
4. Whitelist IPC channels in preload.js

## IPC Channels

### Database (invoke)
- `db:get-todos`, `db:create-todo`, `db:update-todo`, `db:delete-todo`
- `db:get-subscriptions`, `db:create-subscription`, `db:update-subscription`, `db:delete-subscription`
- `db:get-settings`, `db:update-settings`

### Window (send)
- `window:toggle-passthrough` - Click-through
- `window:update-interactive-bounds` - Hitbox position/size
- `window:expand-interactive-for-drag` - Expand/shrink window
- `window:show-settings` - Open settings

### Pet (send)
- `pet:input` - Forward mouse events
- `pet:context-menu-state` - Menu state sync
- `pet:toggle-lock` - Lock position
- `pet:set-target-mode`, `pet:move-to-target` - Attack target

### Events (on)
- `pet:input` - Receive forwarded events
- `pet:context-menu-state` - Receive menu state
- `pet:hitbox-debug` - Debug visualization
- `pet:position-locked` - Lock state
- `pet:target-set` - Attack target

## Hitbox Configuration

```javascript
// src/pet/components/PetCanvas.vue
const HITBOX_CONFIG = {
  minSize: 30,        // Minimum hitbox dimension
  topPadding: 0,      // Padding above sprite
  sidePadding: 0,     // Padding left/right
  bottomPadding: 2    // Padding below sprite
};
```

## Pet States

```javascript
STATES = { IDLE, RUN, SLEEP, ATTACK, WALL_SLIDE }

// Transitions:
// Click → ATTACK
// Drag → WALL_SLIDE
// Double-click → Open Settings
// Right-click → Context Menu
```

## Commands

```bash
npm install   # Install dependencies
npm start     # Launch app
npm run dev   # Dev with HMR
npm run build # Production build
```

## Common Tasks

### Add IPC Channel

1. `preload.js` - Add to validChannels
2. `preload.js` - Expose via contextBridge
3. `main.js` - Add handler
4. `src/types/petAPI.d.ts` - Add type

### Add Pet State

1. `PetCanvas.vue` - Add to STATES object
2. `PetCanvas.vue` - Add to SPRITES config
3. Update `startBehavior()` for transition logic

### Add Context Menu Item

1. `PetContextMenu.vue` - Add menu item with click handler
2. `App.vue` - Handle emitted event

## Debugging

- **Main process logs:** Terminal
- **Renderer logs:** DevTools (F12)
- **Database:** `%APPDATA%/petfocus/petfocus.db`
- **Debug hitbox:** `window.petAPI.window.toggleHitboxDebug()`

## Testing Checklist

- [ ] App starts without errors
- [ ] Pet animations work
- [ ] Click → attack animation
- [ ] Double-click → settings window
- [ ] Right-click → context menu (items clickable!)
- [ ] Drag pet works
- [ ] Mouse passthrough on transparent areas
- [ ] No console errors

## Resources

- [Electron Docs](https://www.electronjs.org/docs/latest/)
- [Vue 3 Docs](https://vuejs.org/)
- [sql.js API](https://sql.js.org/documentation/)
