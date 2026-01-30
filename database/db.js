// Database module using sql.js (pure JavaScript SQLite)
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

let db = null;
let SQL = null;
let dbPath = null;

// Get database file path
function getDbPath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'petfocus.db');
}

// Initialize sql.js and database
async function init() {
  if (db) return db;

  // Initialize sql.js
  SQL = await initSqlJs();

  dbPath = getDbPath();

  // Load existing database or create new
  try {
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
      console.log('Database loaded from:', dbPath);
    } else {
      db = new SQL.Database();
      console.log('New database created');
    }
  } catch (err) {
    console.error('Error loading database:', err);
    db = new SQL.Database();
  }

  // Run migrations
  runMigrations();

  // Save after migrations
  save();

  return db;
}

// Run schema migrations
function runMigrations() {
  // Create migrations table
  db.run(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Check if initial migration applied
  const result = db.exec("SELECT name FROM migrations WHERE name = '001_initial'");
  const applied = result.length > 0 && result[0].values.length > 0;

  if (!applied) {
    console.log('Running initial migration...');

    // Create todos table
    db.run(`
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        priority INTEGER DEFAULT 0,
        due_date TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Create subscriptions table
    db.run(`
      CREATE TABLE IF NOT EXISTS subscriptions (
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
      )
    `);

    // Create settings table
    db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Create pet_state table
    db.run(`
      CREATE TABLE IF NOT EXISTS pet_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        current_state TEXT DEFAULT 'idle',
        happiness INTEGER DEFAULT 100,
        last_interaction TEXT DEFAULT (datetime('now')),
        total_focus_minutes INTEGER DEFAULT 0,
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Initialize pet state
    db.run("INSERT OR IGNORE INTO pet_state (id) VALUES (1)");

    // Mark migration as applied
    db.run("INSERT INTO migrations (name) VALUES ('001_initial')");

    console.log('Initial migration completed');
  }
}

// Save database to file
function save() {
  if (!db || !dbPath) return;

  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

// Get database instance
function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call init() first.');
  }
  return db;
}

// Execute query and return results as array of objects
function query(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);

  const results = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push(row);
  }
  stmt.free();

  return results;
}

// Execute query and return first result
function queryOne(sql, params = []) {
  const results = query(sql, params);
  return results.length > 0 ? results[0] : null;
}

// Run statement (INSERT, UPDATE, DELETE)
function run(sql, params = []) {
  db.run(sql, params);
  save(); // Auto-save after modifications
  return {
    lastInsertRowid: db.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0] || 0,
    changes: db.getRowsModified()
  };
}

// Close database
function close() {
  if (db) {
    save();
    db.close();
    db = null;
  }
}

module.exports = {
  init,
  getDb,
  query,
  queryOne,
  run,
  save,
  close
};
