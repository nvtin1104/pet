# PetFocus Requirements Specification

**Version:** 0.1.0 | **Last Updated:** 2026-01-30

## Overview

PetFocus is a hybrid desktop pet + productivity application for Windows. Features a transparent overlay with an interactive pixel art knight pet, Pomodoro timer, todo management, and subscription tracking.

## Technical Stack

| Component | Technology |
|-----------|------------|
| Runtime | Electron 40.x |
| Language | Vanilla JavaScript (ES6+) |
| Database | sql.js (pure JS SQLite) |
| Rendering | HTML5 Canvas (pet), HTML/CSS (UI) |
| Platform | Windows 10/11 (cross-platform later) |

## Feature Requirements

### 1. Desktop Pet

**Description:** Animated pixel art knight that lives on the desktop.

**States:**
- **Idle:** Default state, subtle breathing animation (10 frames, 8 FPS)
- **Run:** Random movement, direction flip (10 frames, 12 FPS)
- **Sleep:** Triggered after inactivity (crouch sprite)

**Interactions:**
- Single-click: Pet runs and turns around
- Double-click: Opens productivity UI panel
- Hover: Glow effect, mouse captured

**Sprites:** `assets/knight/Colour1/Outline/120x80_PNGSheets/`

**Constraints:**
- Must not interfere with other applications
- Stay within screen bounds
- Resume from system wake/sleep

### 2. Mouse Passthrough

**Description:** Click-through transparent areas while pet/UI remains interactive.

**Behavior:**
- Transparent window areas pass clicks to desktop/apps below
- Pet canvas captures mouse hover and clicks
- UI panels capture mouse when visible
- State tracking prevents redundant IPC calls
- Throttled mousemove fallback (16ms)

**Implementation:**
```javascript
win.setIgnoreMouseEvents(true, { forward: true });
```

### 3. Productivity UI

#### 3.1 Pomodoro Timer (Planned)
- 25/5/15 minute presets (configurable)
- Visual countdown on pet
- Desktop notification on complete
- Track completed sessions in pet state

#### 3.2 Todo List
- Create, read, update, delete todos
- Mark complete/incomplete
- Priority levels (0-2)
- Optional due dates
- Persist in SQLite

#### 3.3 Subscription Tracker
- Track recurring subscriptions
- Amount, billing cycle, next billing date
- Category organization
- Monthly total calculation

### 4. Data Persistence

**Storage:** sql.js database saved to app userData directory

**Tables:**
| Table | Purpose |
|-------|---------|
| todos | Task items with priority and due dates |
| subscriptions | Recurring payment tracking |
| settings | Key-value app configuration |
| pet_state | Pet happiness, total focus time |
| migrations | Schema version tracking |

**Location:** `%APPDATA%/petfocus/petfocus.db`

### 5. Security Requirements

| Setting | Value | Reason |
|---------|-------|--------|
| contextIsolation | true | Mandatory - isolate preload |
| nodeIntegration | false | Mandatory - prevent XSS |
| sandbox | false | Required for sql.js WASM |
| webSecurity | true | Prevent CORS bypass |

**Additional:**
- CSP headers in index.html
- IPC channel whitelisting in preload.js
- Prepared statements for SQL
- No eval() or dynamic code execution

## Non-Functional Requirements

### Performance
- Idle CPU: <5%
- Memory: <150MB
- Startup time: <3 seconds

### Compatibility
- Windows 10 build 1903+
- Windows 11
- Future: macOS, Linux

## API Reference

### Window API (`window.petAPI.window`)

| Method | Parameters | Description |
|--------|------------|-------------|
| togglePassthrough | `ignore: boolean` | Toggle click-through |
| setPosition | `x: number, y: number` | Move window |
| minimizeToTray | - | Hide to system tray |
| showUI | - | Show and focus window |
| hideUI | - | Hide window |

### Database API (`window.petAPI.db`)

| Method | Parameters | Returns |
|--------|------------|---------|
| getTodos | - | `Todo[]` |
| createTodo | `{ title, priority?, dueDate? }` | `Todo` |
| updateTodo | `id, { title?, completed?, priority?, dueDate? }` | `Todo` |
| deleteTodo | `id` | `{ success, id }` |
| getSubscriptions | - | `Subscription[]` |
| createSubscription | `{ name, amount, currency?, billingCycle?, ... }` | `Subscription` |
| updateSubscription | `id, data` | `Subscription` |
| deleteSubscription | `id` | `{ success, id }` |
| getSettings | - | `Settings` |
| updateSettings | `{ key: value, ... }` | `Settings` |

### Event Listeners (`window.petAPI.on`)

| Method | Callback | Description |
|--------|----------|-------------|
| petStateChange | `(state) => {}` | Pet state updated |
| timerTick | `(seconds) => {}` | Timer countdown |
| timerComplete | `() => {}` | Timer finished |

## File Structure

```
pet/
├── main.js              # Electron main process, IPC handlers
├── preload.js           # contextBridge API exposure
├── index.html           # Main UI with CSP headers
├── renderer.js          # UI logic, mouse passthrough, pet animation
├── styles.css           # Transparent overlay styles
├── package.json
├── database/
│   ├── index.js         # Module exports
│   ├── db.js            # sql.js init, migrations, queries
│   ├── todos.js         # Todo CRUD operations
│   ├── subscriptions.js # Subscription CRUD operations
│   └── settings.js      # Key-value settings store
├── pet/                 # (Planned: separate pet modules)
│   ├── stateMachine.js
│   └── petRenderer.js
├── ui/                  # (Planned: UI components)
│   ├── todo.js
│   ├── timer.js
│   └── settings.js
├── assets/
│   └── knight/          # Pixel art sprite sheets
│       ├── Colour1/Outline/120x80_PNGSheets/
│       └── Colour1/NoOutline/120x80_PNGSheets/
└── docs/
    ├── requirements.md
    └── agent/
        ├── claude.md
        └── gemini.md
```

## Database Schema

```sql
CREATE TABLE todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 0,
  due_date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  billing_cycle TEXT DEFAULT 'monthly',
  next_billing_date TEXT,
  category TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE pet_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  current_state TEXT DEFAULT 'idle',
  happiness INTEGER DEFAULT 100,
  last_interaction TEXT DEFAULT (datetime('now')),
  total_focus_minutes INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now'))
);
```

## Default Settings

```javascript
{
  petName: 'Knight',
  pomodoroMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  alwaysOnTop: true,
  startWithSystem: false,
  soundEnabled: true,
  theme: 'dark'
}
```
