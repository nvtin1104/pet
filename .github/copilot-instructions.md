# Copilot Instructions for PetFocus

## Project Overview
PetFocus is an Electron + Vue 3 desktop pet productivity app. The architecture separates the **Settings window** (primary, always running) from the **Pet overlay window** (secondary, transparent overlay). Both communicate via Electron IPC with a whitelist-based security model.

**Tech Stack:** Electron 28, Vue 3, Vite, Tailwind CSS, TypeScript, sql.js (in-process SQLite), Canvas

## Critical Architecture Decisions

### Process Separation (Why?)
- **Main Process** (`main.js`): Window lifecycle, IPC handlers, database access
- **Renderer Process** (`src/settings/` + `src/pet/`): Vue apps, UI only
- **Database** (`database/db.js`): Accessed ONLY from main process via IPC (`invoke` channels)
  - Prevents XSS from accessing Node APIs
  - Ensures single source of truth for data

### IPC Security Model (NEVER bypass this)
All communication uses a **whitelist in `preload.js`** (`validChannels` object):
- `invoke` channels: Promise-based, request/response (e.g., `db:get-todos`)
- `send` channels: Fire-and-forget, one-way (e.g., `window:toggle-passthrough`)
- `on` channels: Listen-only subscriptions (e.g., `pet:state-change`)

**Pattern:** When adding IPC, update `validChannels` first, then expose in `contextBridge.exposeInMainWorld('petAPI', {...})`, then add handler in `main.js`.

### Development vs. Production
- **Dev:** Vite dev server runs at `http://localhost:5173`, main process loads HTML from there
- **Prod:** Vue builds to `dist/`, main process loads from file system
- **Config:** `main.js` reads `DEV_SERVER_URL` env var and checks `app.isPackaged`

## Key Files & Patterns

### Database Module (`database/`)
- `db.js`: sql.js initialization, migrations (check migration registry before running), save-on-change
- `todos.js`, `subscriptions.js`, `settings.js`: Module-per-entity with `getAll`, `create`, `update`, `delete`
- **Pattern:** Every DB module exports functions; main.js wraps them in `ipcMain.handle()` handlers

### Vue Components & Composables (`src/`)
- **Pet overlay** (`src/pet/`): Canvas-based rendering in `PetCanvas.vue`, no UI panels
- **Settings window** (`src/settings/`): Vue components with form sections (`SettingsSection`, `TodosSection`, etc.)
- **Composables** (`useSettings`, `useTodos`, etc.): State + IPC logic encapsulated
  - Call `window.petAPI.db.*()` to invoke IPC handlers
  - Load on mount, cache in `ref()`, handle errors with try/catch + error state

### Build Configuration
- **Vite** (`vite.config.js`): Two entry points (settings + pet), no chunking (CSP constraint in Electron)
- **TypeScript**: Strict mode, types in `src/types/petAPI.d.ts` (define shapes for `window.petAPI`)
- **Tailwind**: PostCSS pipeline, auto-prefixed, used in Vue SFCs

### Scripts
- `npm start`: Launches Electron app directly (`electron .`)
- `npm run dev`: Runs `scripts/start-dev.js` (spawns Vite dev server + Electron together)
- `npm run build`: Compiles TypeScript + Vite build to `dist/`

## Common Workflow Patterns

### Add a New Todo Feature
1. **Database:** Add CRUD function to `database/todos.js` (new param/logic)
2. **IPC Handler:** Add `ipcMain.handle()` in `main.js` → calls `TodosDB.newMethod()`
3. **Whitelist:** Add channel name to `preload.js` `validChannels.invoke[]`
4. **Bridge:** Add method to `contextBridge.exposeInMainWorld('petAPI', { db: { ... }})`
5. **Vue Composable:** Use `window.petAPI.db.newMethod()` in `useSettings.ts` or new composable
6. **Component:** Call composable method from template or lifecycle hook
7. **Test:** Start app with `npm start`, invoke from DevTools console: `await window.petAPI.db.newMethod()`

### Add a New Pet State/Animation
1. **Sprite Asset:** Place PNG sprite sheet at `assets/knight/Colour1/Outline/120x80_PNGSheets/_NewState.png`
2. **PetCanvas.vue:** 
   - Add to `STATES` object: `NEW_STATE: 'newState'`
   - Add to `SPRITES` config: `newState: { src: '...', frames: N, frameRate: F }`
3. **Behavior Logic:** Update `startBehavior()` to transition to new state based on user input or timer
4. **Test:** Run `npm start`, observe animation in overlay

### Debug Pet or Settings Window
- **Main Process:** Logs print to terminal where `npm start` runs
- **Renderer:** Open DevTools with F12 in either window, console has `window.petAPI` available
- **Enable DevTools:** Uncomment `mainWindow.webContents.openDevTools()` in `main.js`
- **Database Console Test:** In DevTools, run `await window.petAPI.db.getTodos()`

## Code Style & Conventions

- **Indentation:** 2 spaces
- **Variables:** camelCase
- **Classes/Types:** PascalCase
- **Vue 3:** Use `<script setup>`, Composition API, `ref()` + `onMounted()` + `onBeforeUnmount()`
- **Error Handling:** Try/catch in IPC handlers; set error state in composables
- **Comments:** Explain *why*, not *what*; mark critical sections with `// CRITICAL:` or `// NOTE:`
- **TypeScript:** Always type function params and returns; use `type` for shapes, `interface` for extensible contracts

## Dependencies & Constraints

- **Electron 28:** Stable LTS, contextIsolation required, preload script isolated
- **sql.js:** In-memory SQLite; persists to file on `save()`; no external DB needed
- **Tailwind 4:** Configured with postcss.config.cjs; run `build` step to generate CSS
- **Vite 7:** Tree-shaking, modern modules, no CSP 'unsafe-eval' (avoid `eval()`)

## Testing Checklist Before Commit

- [ ] `npm start` launches without errors
- [ ] Pet renders in transparent overlay
- [ ] Settings window opens on double-click (or via menu)
- [ ] Mouse passthrough on overlay works (click is ignored on transparent areas)
- [ ] CRUD operations in Settings save to database
- [ ] Data persists across app restart
- [ ] No console errors in DevTools (DevTools open → F12)
- [ ] TypeScript compilation succeeds: `npm run type-check`

## Resources

- [Electron Main Process API](https://www.electronjs.org/docs/latest/api/ipc-main)
- [sql.js Documentation](https://sql.js.org/documentation/)
- [Vue 3 + TypeScript](https://vuejs.org/guide/scaling-up/typescript.html)
- [Vite Configuration](https://vitejs.dev/config/)
