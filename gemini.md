# Gemini Agent Guide - PetFocus

## Quick Reference

| Key | Value |
|-----|-------|
| Tech | Electron 40.x, Vanilla JS, sql.js, Canvas |
| Branch | electron |
| Entry (Main) | main.js |
| Entry (Renderer) | src/pet (Vue Pet) |
| Database | %APPDATA%/petfocus/petfocus.db |

## Critical Constraints

| Rule | Reason |
|------|--------|
| `nodeIntegration: false` | NEVER change - security |
| `contextIsolation: true` | NEVER change - security |
| Database in main process ONLY | Renderer has no Node access |
| Whitelist IPC channels | Prevent arbitrary code execution |
| No eval() / new Function() | XSS prevention |

## File Map

```
main.js           → BrowserWindow, IPC handlers, db init
preload.js        → contextBridge (window.petAPI)
src/pet/          → Vue Pet app (PetCanvas component, sprites)
database/db.js    → sql.js init, migrations, query helpers
database/todos.js → Todo CRUD
database/subscriptions.js → Subscription CRUD
database/settings.js → Key-value store
src/pet/index.html → Pet entry (dev) with CSP headers
src/pet/styles/main.css → Pet-specific styles (uses Tailwind)
```

## IPC Pattern

```javascript
// Renderer (via contextBridge)
const todos = await window.petAPI.db.getTodos();
const newTodo = await window.petAPI.db.createTodo({ title: 'Task' });

// Main process (ipcMain.handle)
ipcMain.handle('db:get-todos', async () => {
  try {
    return TodosDB.getAll();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
});
```

## Database Schema

```sql
-- todos
id INTEGER PRIMARY KEY, title TEXT, completed INTEGER,
priority INTEGER, due_date TEXT, created_at TEXT, updated_at TEXT

-- subscriptions
id INTEGER PRIMARY KEY, name TEXT, amount REAL, currency TEXT,
billing_cycle TEXT, next_billing_date TEXT, category TEXT,
notes TEXT, created_at TEXT, updated_at TEXT

-- settings
key TEXT PRIMARY KEY, value TEXT, updated_at TEXT

-- pet_state
id INTEGER (always 1), current_state TEXT, happiness INTEGER,
last_interaction TEXT, total_focus_minutes INTEGER, updated_at TEXT
```

## API Quick Reference

```javascript
// Window
window.petAPI.window.togglePassthrough(bool)
window.petAPI.window.setPosition(x, y)
window.petAPI.window.minimizeToTray()

// Todos
window.petAPI.db.getTodos()
window.petAPI.db.createTodo({ title, priority?, dueDate? })
window.petAPI.db.updateTodo(id, { completed?, title?, ... })
window.petAPI.db.deleteTodo(id)

// Subscriptions
window.petAPI.db.getSubscriptions()
window.petAPI.db.createSubscription({ name, amount, billingCycle?, ... })

// Settings
window.petAPI.db.getSettings()
window.petAPI.db.updateSettings({ key: value })
```

## Mouse Passthrough Logic

```
1. Window starts: setIgnoreMouseEvents(true, {forward: true})
2. Mouse enters #pet-container: setIgnoreMouseEvents(false)
3. Mouse leaves #pet-container: setIgnoreMouseEvents(true)
4. Throttled fallback: 16ms mousemove check
```

## Pet State Machine

```
STATES = { IDLE, RUN, SLEEP }

Transitions:
- Random behavior: 5-15 sec intervals
- 60% → IDLE, 30% → RUN, 10% → SLEEP
- Click → RUN (turn around)
- Double-click → Toggle UI panel
```

## Sprite Config

```javascript
SPRITES = {
  idle:  { frames: 10, frameRate: 8 },
  run:   { frames: 10, frameRate: 12 },
  sleep: { frames: 1, frameRate: 1 }
}
// Path: ./assets/knight/Colour1/Outline/120x80_PNGSheets/
// Frame size: 120x80, Scale: 1.5x
```

## Commands

```bash
npm install   # Install dependencies
npm start     # Run app
```

## Teach

**Mục tiêu học tập:** Hiểu kiến trúc Electron + Vue Pet, IPC patterns, canvas sprite logic và Tailwind.

**Chủ đề:**
1. Setup & run (npm install, npm run dev)
2. Vite + Electron dev flow (DEV_SERVER_URL, `scripts/start-dev.js`)
3. Port renderer → Vue (`src/pet/`) và component hóa logic canvas
4. Mouse passthrough & IPC (preload whitelist)
5. Assets & Tailwind integration
6. Build & production verification

**Bài tập:**
- Thêm trạng thái mới cho Pet (ví dụ `dance`) và viết pseudo-steps sửa file tương ứng.
- Viết checklist chức năng (drag, click, dblclick → open settings).

**Ví dụ prompt cho AI:**
- "Cho tôi các bước để thêm state 'dance' vào Pet (file, symbol, test)."

**Tiêu chí đánh giá:** Dev + Build chạy; Pet đúng hành vi; IPC bảo mật.

## Debugging

| Task | Method |
|------|--------|
| DevTools | Ctrl+Shift+I or uncomment in main.js |
| Main logs | Terminal running npm start |
| DB file | %APPDATA%/petfocus/petfocus.db |
| Test IPC | DevTools console: `await window.petAPI.db.getTodos()` |

## Security Checklist

- [ ] No eval() or new Function()
- [ ] No remote code loading
- [ ] Prepared statements for SQL (params array)
- [ ] IPC channels in validChannels whitelist
- [ ] CSP headers in index.html
- [ ] No shell commands from renderer

## Common Fixes

| Issue | Solution |
|-------|----------|
| App won't start | Check main.js for syntax errors |
| Database empty | Check %APPDATA%/petfocus/ exists |
| Click-through broken | Check MousePassthrough.init() called |
| Pet not animating | Check sprite paths, image loading |
| IPC not working | Check channel in validChannels |

## Links

- [Requirements](../requirements.md)
- [Claude Guide](./claude.md)
- [Plan](../../plans/20260130-1030-petfocus-electron/plan.md)
- [Electron Docs](https://www.electronjs.org/docs/latest/)
