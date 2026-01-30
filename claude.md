# Claude Code Agent Guide - PetFocus

## Project Context

PetFocus is an Electron desktop pet + productivity app. You are working on the `electron` branch.

**Tech Stack:** Electron 40.x, Vanilla JS, sql.js, Canvas rendering

## Key Files

| File | Purpose | Priority |
|------|---------|----------|
| `main.js` | Electron main process, IPC handlers, window config | High |
| `preload.js` | contextBridge API exposure, channel whitelist | High |
| `renderer.js` | UI logic, mouse passthrough, pet animation | High |
| `database/db.js` | sql.js initialization, migrations, queries | High |
| `database/todos.js` | Todo CRUD operations | Medium |
| `database/subscriptions.js` | Subscription CRUD operations | Medium |
| `database/settings.js` | Key-value settings store | Medium |
| `index.html` | Main UI with CSP headers | Medium |
| `styles.css` | Transparent overlay styles, UI panel | Medium |

## Development Commands

```bash
npm install          # Install dependencies
npm start            # Launch app
```

## Architecture Rules

### Critical Security (NEVER change)

1. **`nodeIntegration: false`** - Prevents XSS attacks from accessing Node
2. **`contextIsolation: true`** - Isolates preload from renderer
3. **Database in main process ONLY** - Renderer uses IPC
4. **Whitelist IPC channels** - See `preload.js` validChannels

### Design Patterns

1. **IPC Communication:** `ipcMain.handle` + `ipcRenderer.invoke` (Promise-based)
2. **State Tracking:** Prevent redundant IPC calls with state comparison
3. **Auto-save:** Database saves after every modification
4. **Throttling:** Mouse events throttled to 16ms (~60fps)

## Code Style

- Vanilla JS (ES6+), no frameworks
- 2-space indentation
- camelCase for variables, PascalCase for classes
- Descriptive function names
- Comments for non-obvious logic

## Common Tasks

### Add New IPC Channel

```javascript
// 1. preload.js - Add to whitelist
const validChannels = {
  invoke: [
    // ... existing
    'db:new-channel',  // Add here
  ],
};

// 2. preload.js - Expose via contextBridge
contextBridge.exposeInMainWorld('petAPI', {
  db: {
    newMethod: (data) => ipcRenderer.invoke('db:new-channel', data),
  }
});

// 3. main.js - Add handler
ipcMain.handle('db:new-channel', async (event, data) => {
  try {
    return SomeDB.someMethod(data);
  } catch (error) {
    console.error('db:new-channel error:', error);
    throw error;
  }
});
```

### Add Database Table

```javascript
// 1. database/db.js - Add migration
function runMigrations() {
  // Check if migration applied
  const result = db.exec("SELECT name FROM migrations WHERE name = '002_new_table'");
  const applied = result.length > 0 && result[0].values.length > 0;

  if (!applied) {
    db.run(`
      CREATE TABLE IF NOT EXISTS new_table (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        -- columns here
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
    db.run("INSERT INTO migrations (name) VALUES ('002_new_table')");
  }
}

// 2. Create database/newTable.js with CRUD operations
// 3. Export in database/index.js
// 4. Wire up IPC handlers in main.js
```

### Add Pet State

```javascript
// renderer.js - Add to STATES object
const STATES = {
  IDLE: 'idle',
  RUN: 'run',
  SLEEP: 'sleep',
  NEW_STATE: 'newState',  // Add here
};

// Add sprite config
const SPRITES = {
  // ... existing
  newState: {
    src: './assets/knight/Colour1/Outline/120x80_PNGSheets/_NewState.png',
    frames: 10,
    frameRate: 8
  }
};

// Update behavior logic in startBehavior()
```

### Modify UI Panel

```html
<!-- index.html - Add section to #ui-panel -->
<div id="ui-panel">
  <div class="panel-section">
    <label>New Section</label>
    <span id="new-value">Value</span>
  </div>
</div>
```

```css
/* styles.css - Add styles */
.panel-section { /* ... */ }
```

```javascript
// renderer.js - Add logic
function initUIPanel() {
  const newElement = document.getElementById('new-value');
  // Initialize
}
```

## Debugging

### Open DevTools
```javascript
// main.js - Uncomment this line
mainWindow.webContents.openDevTools({ mode: 'detached' });
```

### Locations
- **Main process logs:** Terminal running `npm start`
- **Renderer logs:** DevTools console (Ctrl+Shift+I)
- **Database file:** `%APPDATA%/petfocus/petfocus.db`

### Test Database in Console
```javascript
// DevTools console
await window.petAPI.db.getTodos()
await window.petAPI.db.createTodo({ title: 'Test' })
await window.petAPI.db.getSettings()
```

## Testing Checklist

Before committing:
- [ ] App starts without errors (`npm start`)
- [ ] Mouse passthrough works on transparent areas
- [ ] Pet animations play correctly
- [ ] Pet responds to click/double-click
- [ ] UI panel opens on double-click
- [ ] Data persists across restart
- [ ] No console errors in DevTools

## File Dependencies

```
main.js
├── database/index.js
│   ├── database/db.js (sql.js)
│   ├── database/todos.js
│   ├── database/subscriptions.js
│   └── database/settings.js
└── preload.js

renderer.js
├── window.petAPI (from preload.js)
├── Sprites (from assets/)
└── DOM elements (from index.html)
```

## IPC Channel Reference

| Channel | Type | Direction | Handler |
|---------|------|-----------|---------|
| `window:toggle-passthrough` | send | R→M | setIgnoreMouseEvents |
| `window:set-position` | send | R→M | setPosition |
| `db:get-todos` | invoke | R→M | TodosDB.getAll |
| `db:create-todo` | invoke | R→M | TodosDB.create |
| `db:update-todo` | invoke | R→M | TodosDB.update |
| `db:delete-todo` | invoke | R→M | TodosDB.delete |
| `db:get-subscriptions` | invoke | R→M | SubscriptionsDB.getAll |
| `db:get-settings` | invoke | R→M | SettingsDB.getAll |
| `db:update-settings` | invoke | R→M | SettingsDB.set |

## Resources

- [Electron Docs](https://www.electronjs.org/docs/latest/)
- [sql.js API](https://sql.js.org/documentation/)
- [Requirements](../requirements.md)
- [Implementation Plan](../../plans/20260130-1030-petfocus-electron/plan.md)
