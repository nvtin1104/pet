# Copilot Instructions for PetFocus

## Project Overview
PetFocus is an Electron + Vue 3 desktop pet productivity app. The architecture uses THREE windows:
- **Settings window** (primary, always running)
- **Pet overlay window** (fullscreen, click-through, visual rendering)
- **Pet interactive window** (small hitbox, receives mouse clicks)

All windows communicate via Electron IPC with a whitelist-based security model.

**Tech Stack:** Electron 40.x, Vue 3, Vite, Tailwind CSS, TypeScript, sql.js (in-process SQLite), Canvas

## Project Structure

```
pet/
├── main.js                 # Electron main process, IPC handlers, window management
├── preload.js              # contextBridge API, IPC whitelist
├── vite.config.js          # Vite build config (pet + settings entry points)
│
├── database/               # SQLite layer (main process only)
│   ├── db.js               # sql.js init, migrations
│   ├── todos.js            # Todo CRUD
│   ├── subscriptions.js    # Subscription CRUD
│   └── settings.js         # Key-value settings
│
├── src/pet/                # Pet Vue app (overlay + interactive windows)
│   ├── App.vue             # Root, context menu state management
│   └── components/
│       ├── PetCanvas.vue   # Canvas rendering, sprite animation, hitbox
│       └── PetContextMenu.vue # Right-click context menu
│
├── src/settings/           # Settings Vue app
│   ├── App.vue
│   ├── components/         # UI sections
│   └── composables/        # State + IPC logic
│
└── src/types/
    └── petAPI.d.ts         # TypeScript definitions for window.petAPI
```

## Critical Architecture Decisions

### Two-Window Pet System (Why?)
- **petOverlayWindow** (fullscreen, mode=overlay): Renders pet visually, ALWAYS click-through
- **petInteractiveWindow** (small hitbox, mode=interactive): Receives mouse clicks, forwards to overlay
- **Context Menu**: Rendered in interactive window (not overlay) so clicks work

### Process Separation (Why?)
- **Main Process** (`main.js`): Window lifecycle, IPC handlers, database access
- **Renderer Process** (`src/settings/` + `src/pet/`): Vue apps, UI only
- **Database** (`database/db.js`): Accessed ONLY from main process via IPC
  - Prevents XSS from accessing Node APIs
  - Ensures single source of truth

### IPC Security Model (NEVER bypass)
All communication uses a **whitelist in `preload.js`** (`validChannels` object):
- `invoke` channels: Promise-based, request/response (e.g., `db:get-todos`)
- `send` channels: Fire-and-forget, one-way (e.g., `pet:context-menu-state`)
- `on` channels: Listen-only subscriptions (e.g., `pet:input`)

**Pattern:** When adding IPC:
1. Add to `validChannels` in preload.js
2. Expose via `contextBridge.exposeInMainWorld('petAPI', {...})`
3. Add handler in `main.js`
4. Add type in `src/types/petAPI.d.ts`

## Key IPC Channels

### Database (invoke)
- `db:get-todos`, `db:create-todo`, `db:update-todo`, `db:delete-todo`
- `db:get-subscriptions`, `db:create-subscription`
- `db:get-settings`, `db:update-settings`

### Window (send)
- `window:toggle-passthrough` - Click-through toggle
- `window:update-interactive-bounds` - Hitbox position/size
- `window:expand-interactive-for-drag` - Expand/shrink interactive window
- `window:show-settings` - Open settings window

### Pet (send)
- `pet:input` - Forward mouse events from interactive to overlay
- `pet:context-menu-state` - Sync context menu open/close state
- `pet:toggle-lock` - Lock pet position

### Events (on)
- `pet:input` - Receive forwarded mouse events
- `pet:context-menu-state` - Receive context menu state
- `pet:hitbox-debug` - Toggle hitbox debug visualization

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

## Common Workflow Patterns

### Add a New IPC Channel
1. **Whitelist:** Add to `preload.js` validChannels (send/on/invoke)
2. **Bridge:** Add to `contextBridge.exposeInMainWorld('petAPI', {...})`
3. **Handler:** Add `ipcMain.on()` or `ipcMain.handle()` in `main.js`
4. **Types:** Add to `src/types/petAPI.d.ts`

### Add a New Pet State/Animation
1. **Sprite Asset:** Place at `assets/knight/Colour1/Outline/120x80_PNGSheets/`
2. **PetCanvas.vue:**
   - Add to `STATES` object
   - Add to `SPRITES` config
3. **Behavior:** Update `startBehavior()` for transitions

### Add Context Menu Item
1. **PetContextMenu.vue:** Add menu item div with @click handler
2. **App.vue:** Handle emitted event, call IPC if needed

## Code Style & Conventions

- **Indentation:** 2 spaces
- **Variables:** camelCase
- **Classes/Types:** PascalCase
- **Vue 3:** Use `<script setup>`, Composition API
- **Error Handling:** Try/catch in IPC handlers
- **Comments:** Explain *why*, mark critical with `// CRITICAL:`

## Debugging

- **Main Process:** Terminal logs
- **Renderer:** DevTools (F12)
- **Database:** `%APPDATA%/petfocus/petfocus.db`
- **Debug hitbox:** `window.petAPI.window.toggleHitboxDebug()`

## Testing Checklist

- [ ] `npm start` launches without errors
- [ ] Pet renders and animates
- [ ] Click triggers attack animation
- [ ] Double-click opens settings
- [ ] Right-click opens context menu (items clickable!)
- [ ] Drag pet works
- [ ] Mouse passthrough on transparent areas
- [ ] Data persists across restart
- [ ] No console errors

## Commands

```bash
npm install   # Install dependencies
npm start     # Launch app (production)
npm run dev   # Launch with Vite dev server
npm run build # Build for production
```

## Resources

- [Electron Main Process API](https://www.electronjs.org/docs/latest/api/ipc-main)
- [Vue 3 Composition API](https://vuejs.org/guide/introduction.html)
- [sql.js Documentation](https://sql.js.org/documentation/)
- [Vite Configuration](https://vitejs.dev/config/)
