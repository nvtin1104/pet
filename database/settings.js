// Settings key-value store
const db = require('./db');

const SettingsDB = {
  get(key) {
    const row = db.queryOne('SELECT value FROM settings WHERE key = ?', [key]);
    if (!row) return null;

    try {
      return JSON.parse(row.value);
    } catch {
      return row.value;
    }
  },

  set(key, value) {
    const jsonValue = JSON.stringify(value);

    db.run(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = datetime('now')
    `, [key, jsonValue]);

    return { key, value };
  },

  getAll() {
    const rows = db.query('SELECT key, value FROM settings');
    const result = {};

    rows.forEach(row => {
      try {
        result[row.key] = JSON.parse(row.value);
      } catch {
        result[row.key] = row.value;
      }
    });

    return result;
  },

  delete(key) {
    const result = db.run('DELETE FROM settings WHERE key = ?', [key]);
    return { success: result.changes > 0, key };
  },

  // Default settings
  getDefaults() {
    return {
      petName: 'Knight',
      pomodoroMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      alwaysOnTop: true,
      startWithSystem: false,
      soundEnabled: true,
      theme: 'dark',
      petModeEnabled: false
    };
  },

  // Initialize with defaults if not set
  initDefaults() {
    const defaults = this.getDefaults();
    const current = this.getAll();

    Object.entries(defaults).forEach(([key, value]) => {
      if (current[key] === undefined) {
        this.set(key, value);
      }
    });

    return this.getAll();
  }
};

module.exports = SettingsDB;
