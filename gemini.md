# Gemini Agent Guide - PetFocus

## Quick Reference

| Key | Value |
|-----|-------|
| Tech | Electron 40.x, Vue 3, Vite, Tailwind CSS, TypeScript, sql.js, Canvas |
| Branch | electron |
| Entry (Main) | main.js |
| Entry (Pet) | src/pet/ (Vue app, dual-window) |
| Entry (Settings) | src/settings/ (Vue app) |
| Database | %APPDATA%/petfocus/petfocus.db |

## Critical Constraints

| Rule | Reason |
|------|--------|
| `nodeIntegration: false` | NEVER change - security |
| `contextIsolation: true` | NEVER change - security |
| Database in main process ONLY | Renderer has no Node access |
| Whitelist IPC channels | Prevent arbitrary code execution |
| No eval() / new Function() | XSS prevention |

## Project Structure

```
pet/
├── main.js                 # Electron main, IPC handlers, window management
├── preload.js              # contextBridge (window.petAPI), IPC whitelist
├── database/               # SQLite layer (main process only)
│   ├── db.js               # sql.js init, migrations
│   ├── todos.js            # Todo CRUD
│   ├── subscriptions.js    # Subscription CRUD
│   └── settings.js         # Key-value settings
│
├── src/pet/                # Pet Vue app (overlay + interactive windows)
│   ├── App.vue             # Root, context menu state
│   └── components/
│       ├── PetCanvas.vue   # Canvas rendering, sprite animation, hitbox
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

## Two-Window Pet Architecture

```
petOverlayWindow (fullscreen, mode=overlay)
  - Renders pet visually
  - ALWAYS click-through (setIgnoreMouseEvents(true))
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

**Mode Detection:** URL param `?mode=overlay` or `?mode=interactive`

## IPC Pattern

```javascript
// Renderer (via contextBridge)
const todos = await window.petAPI.db.getTodos();
window.petAPI.pet.toggleLock(true);
window.petAPI.pet.setContextMenuState(true);

// Main process handler
ipcMain.handle('db:get-todos', async () => TodosDB.getAll());
ipcMain.on('pet:context-menu-state', (_, open) => {
  petOverlayWindow.webContents.send('pet:context-menu-state', open);
});
```

## Key IPC Channels

### Database (invoke)
- `db:get-todos`, `db:create-todo`, `db:update-todo`, `db:delete-todo`
- `db:get-subscriptions`, `db:create-subscription`
- `db:get-settings`, `db:update-settings`

### Window (send)
- `window:toggle-passthrough` - Click-through toggle
- `window:update-interactive-bounds` - Hitbox position/size
- `window:expand-interactive-for-drag` - Expand/shrink for menu

### Pet (send)
- `pet:input` - Forward mouse events
- `pet:context-menu-state` - Menu open/close sync
- `pet:toggle-lock` - Lock position
- `pet:set-target-mode`, `pet:move-to-target` - Attack target

### Events (on)
- `pet:input` - Receive forwarded events
- `pet:context-menu-state` - Receive menu state
- `pet:hitbox-debug` - Debug visualization

## API Quick Reference

```javascript
// Database
window.petAPI.db.getTodos()
window.petAPI.db.createTodo({ title })
window.petAPI.db.getSettings()

// Window
window.petAPI.window.togglePassthrough(bool)
window.petAPI.window.expandInteractiveForDrag(bool)
window.petAPI.window.toggleHitboxDebug()

// Pet
window.petAPI.pet.toggleLock(bool)
window.petAPI.pet.setContextMenuState(bool)
window.petAPI.pet.moveToTarget(x, y)
```

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

## Pet State Machine

```
STATES = { IDLE, RUN, SLEEP, ATTACK, WALL_SLIDE }

Transitions:
- Random behavior: 5-15 sec intervals
- 60% IDLE, 30% RUN, 10% SLEEP
- Click → ATTACK
- Drag → WALL_SLIDE
- Double-click → Open Settings
- Right-click → Context Menu
```

## Sprite Config

```javascript
SPRITES = {
  idle:      { frames: 10, frameRate: 8 },
  run:       { frames: 10, frameRate: 12 },
  sleep:     { frames: 1,  frameRate: 1 },
  attack:    { frames: 4,  frameRate: 12 },
  wallSlide: { frames: 3,  frameRate: 6 }
}
// Path: /assets/knight/Colour1/Outline/120x80_PNGSheets/
// Frame size: 120x80, Scale: 1.5x
```

## Commands

```bash
npm install   # Install dependencies
npm start     # Run app (production)
npm run dev   # Run with Vite dev server
npm run build # Build for production
```

## Debugging

| Task | Method |
|------|--------|
| DevTools | F12 or uncomment in main.js |
| Main logs | Terminal running npm start |
| DB file | %APPDATA%/petfocus/petfocus.db |
| Debug hitbox | `window.petAPI.window.toggleHitboxDebug()` |
| Test IPC | `await window.petAPI.db.getTodos()` |

## Common Fixes

| Issue | Solution |
|-------|----------|
| App won't start | Check main.js for syntax errors |
| Click-through broken | Check window mode and passthrough logic |
| Context menu not clicking | Verify menu renders in interactive window |
| Pet not animating | Check sprite paths, image loading |
| IPC not working | Check channel in preload.js validChannels |

## Security Checklist

- [ ] No eval() or new Function()
- [ ] No remote code loading
- [ ] Prepared statements for SQL
- [ ] IPC channels in validChannels whitelist
- [ ] CSP headers in index.html
- [ ] No shell commands from renderer

## Links

- [Electron Docs](https://www.electronjs.org/docs/latest/)
- [Vue 3 Docs](https://vuejs.org/)
- [sql.js API](https://sql.js.org/documentation/)
- [Claude Guide](./CLAUDE.md)
